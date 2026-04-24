import Docker from 'dockerode';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import stream from 'stream';

const DOCKER_SOCKET = process.env.DOCKER_HOST || '/var/run/docker.sock';
const docker = new Docker({ socketPath: DOCKER_SOCKET });

const WORKSPACE_BASE = process.env.STUDIO_STORAGE_PATH || '/tmp/darkwave-studio/workspaces';
const DEFAULT_IMAGE = process.env.STUDIO_NODE_IMAGE || 'node:20-alpine';
const DEFAULT_TIMEOUT_MS = Number(process.env.STUDIO_INSTALL_TIMEOUT_MS || 5 * 60 * 1000);

export interface RunResult {
  id: string;
  userId: string;
  projectId: string;
  startedAt: string;
  finishedAt?: string;
  exitCode?: number;
  logs: string;
  error?: string;
  durationMs?: number;
}

type RunningEntry = {
  id: string;
  container: Docker.Container;
  startedAt: number;
  timeoutHandle?: NodeJS.Timeout;
};

const runningMap = new Map<string, RunningEntry>();

async function ensureWorkdir(userId: string, projectId: string) {
  const dir = path.join(WORKSPACE_BASE, userId, projectId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function parseMemoryToBytes(m?: string): number | undefined {
  if (!m) return undefined;
  const r = m.trim().toLowerCase();
  try {
    if (r.endsWith('g')) return Math.round(parseFloat(r.slice(0, -1)) * 1024 ** 3);
    if (r.endsWith('m')) return Math.round(parseFloat(r.slice(0, -1)) * 1024 ** 2);
    if (r.endsWith('k')) return Math.round(parseFloat(r.slice(0, -1)) * 1024);
    const v = parseInt(r, 10);
    if (!isNaN(v)) return v;
  } catch (e) {}
  return undefined;
}

function parseCpuToNano(c?: string): number | undefined {
  if (!c) return undefined;
  const v = parseFloat(c);
  if (isNaN(v)) return undefined;
  return Math.round(v * 1e9);
}

async function ensureImage(image: string, appendLog: (s: string) => void) {
  try {
    const images = await docker.listImages({ filters: { reference: [image] } });
    if (images.length > 0) {
      appendLog(`[executor] image ${image} already present locally\n`);
      return;
    }

    appendLog(`[executor] pulling image ${image} ...\n`);
    await new Promise<void>((resolve, reject) => {
      docker.pull(image, (err: any, stream_: any) => {
        if (err) return reject(err);
        if (!stream_) return resolve();
        docker.modem.followProgress(
          stream_,
          (err2: any) => {
            if (err2) return reject(err2);
            resolve();
          },
          (event: any) => {
            if (event.status) {
              const detail = event.progress ? ` ${event.progress}` : '';
              appendLog(`[pull] ${event.status}${detail}\n`);
            }
          }
        );
      });
    });
    appendLog(`[executor] pull completed: ${image}\n`);
  } catch (err: any) {
    appendLog(`[executor] image pull error: ${String(err)}\n`);
    throw err;
  }
}

export async function spawnInstall(userId: string, projectId: string, pkgManager: 'npm' | 'yarn' | 'pip' = 'npm'): Promise<RunResult> {
  const runId = `${userId}-${projectId}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  const startedAt = Date.now();
  const startedAtIso = new Date(startedAt).toISOString();
  let logs = '';
  const appendLog = (s: string) => { logs += s; };

  const workdir = await ensureWorkdir(userId, projectId);
  const containerWorkdir = '/workspace';
  const cmd = pkgManager === 'yarn' ? 'yarn install --frozen-lockfile' : (pkgManager === 'pip' ? 'pip install -r requirements.txt' : 'npm install --no-audit --prefer-offline');

  const bind = `${workdir}:${containerWorkdir}:rw`;
  const memBytes = parseMemoryToBytes(process.env.STUDIO_CONTAINER_MEMORY || '512m');
  const nanoCPUs = parseCpuToNano(process.env.STUDIO_CONTAINER_CPU || '0.5');

  try {
    await ensureImage(DEFAULT_IMAGE, appendLog);
  } catch (err) {}

  let container: Docker.Container | null = null;
  try {
    container = await docker.createContainer({
      Image: DEFAULT_IMAGE,
      Cmd: ['/bin/sh', '-lc', `cd ${containerWorkdir} && ${cmd}`],
      Tty: false,
      WorkingDir: containerWorkdir,
      Env: [],
      HostConfig: {
        Binds: [bind],
        Memory: memBytes ?? undefined,
        NanoCPUs: nanoCPUs ?? undefined,
        ReadonlyRootfs: false,
        NetworkMode: 'none'
      }
    });

    appendLog(`[executor] created container ${container.id}\n`);
  } catch (err: any) {
    const errorMsg = `[executor] createContainer failed: ${String(err)}\n`;
    appendLog(errorMsg);
    return {
      id: runId,
      userId,
      projectId,
      startedAt: startedAtIso,
      finishedAt: new Date().toISOString(),
      exitCode: -1,
      logs,
      error: errorMsg,
      durationMs: Date.now() - startedAt
    };
  }

  try {
    const attachStream = await container.attach({ stream: true, stdout: true, stderr: true });
    const outStream = new stream.PassThrough();
    const errStream = new stream.PassThrough();

    (docker.modem as any).demuxStream(attachStream, outStream, errStream);

    outStream.on('data', (chunk: Buffer) => appendLog(chunk.toString('utf8')));
    errStream.on('data', (chunk: Buffer) => appendLog(chunk.toString('utf8')));

    await container.start();
    appendLog(`[executor] started container ${container.id} for run ${runId}\n`);

    const timeoutHandle = setTimeout(async () => {
      appendLog(`[executor] timeout hit (${DEFAULT_TIMEOUT_MS}ms). Killing container ${container?.id}\n`);
      try {
        await container?.kill();
      } catch (e) {}
    }, DEFAULT_TIMEOUT_MS);

    runningMap.set(runId, { id: runId, container, startedAt, timeoutHandle });

    const waitRes = await container.wait();
    const exitCode = (waitRes as any).StatusCode ?? (waitRes as any).statusCode ?? 0;

    try {
      const logsStream = await container.logs({ stdout: true, stderr: true, timestamps: false });
      if (logsStream instanceof Buffer) {
        appendLog(logsStream.toString('utf8'));
      } else {
        await new Promise<void>((resolve, reject) => {
          const chunks: Buffer[] = [];
          logsStream.on('data', (c: Buffer) => chunks.push(c));
          logsStream.on('end', () => { appendLog(Buffer.concat(chunks).toString('utf8')); resolve(); });
          logsStream.on('error', reject);
        });
      }
    } catch (e) {}

    const entry = runningMap.get(runId);
    if (entry?.timeoutHandle) clearTimeout(entry.timeoutHandle);
    runningMap.delete(runId);

    try {
      await container.remove({ force: true });
      appendLog(`[executor] removed container ${container.id}\n`);
    } catch (e) {
      appendLog(`[executor] failed to remove container: ${String(e)}\n`);
    }

    const finishedAt = Date.now();
    return {
      id: runId,
      userId,
      projectId,
      startedAt: startedAtIso,
      finishedAt: new Date(finishedAt).toISOString(),
      exitCode,
      logs,
      durationMs: finishedAt - startedAt
    };
  } catch (err: any) {
    const errorMsg = `[executor] run error: ${String(err)}\n`;
    appendLog(errorMsg);

    try {
      await container?.remove({ force: true });
    } catch (e) {}

    runningMap.delete(runId);
    return {
      id: runId,
      userId,
      projectId,
      startedAt: startedAtIso,
      finishedAt: new Date().toISOString(),
      exitCode: -1,
      logs,
      error: errorMsg,
      durationMs: Date.now() - startedAt
    };
  }
}

export async function getRunStatus(runId: string): Promise<{ running: boolean; startedAt?: string; uptimeMs?: number }> {
  const entry = runningMap.get(runId);
  if (!entry) return { running: false };
  return { running: true, startedAt: new Date(entry.startedAt).toISOString(), uptimeMs: Date.now() - entry.startedAt };
}

export async function killRun(runId: string): Promise<boolean> {
  const entry = runningMap.get(runId);
  if (!entry) return false;
  try {
    if (entry.timeoutHandle) clearTimeout(entry.timeoutHandle);
    await entry.container.kill();
    await entry.container.remove({ force: true });
  } catch (e) {}
  runningMap.delete(runId);
  return true;
}

export function listActiveRuns() {
  const out: { id: string; containerId: string; startedAt: string }[] = [];
  for (const [id, entry] of runningMap.entries()) {
    out.push({ id, containerId: entry.container.id, startedAt: new Date(entry.startedAt).toISOString() });
  }
  return out;
}

export default {
  spawnInstall,
  getRunStatus,
  killRun,
  listActiveRuns
};
