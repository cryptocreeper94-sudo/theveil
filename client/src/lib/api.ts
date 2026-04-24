import type { EcosystemApp, BlockchainStats, Document, InsertDocument } from "@shared/schema";

export interface ServiceHealth {
  name: string;
  status: "operational" | "degraded" | "down";
  latency?: number;
  message?: string;
}

export interface SystemHealth {
  status: "operational" | "degraded" | "down";
  timestamp: string;
  services: ServiceHealth[];
  uptime: number;
  version: string;
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const response = await fetch("/api/system/health");
  if (!response.ok) {
    throw new Error("Failed to fetch system health");
  }
  return response.json();
}

export async function fetchEcosystemApps(): Promise<EcosystemApp[]> {
  const response = await fetch("/api/ecosystem/apps");
  if (!response.ok) {
    throw new Error("Failed to fetch ecosystem apps");
  }
  return response.json();
}

export async function fetchBlockchainStats(): Promise<BlockchainStats> {
  const response = await fetch("/api/blockchain/stats");
  if (!response.ok) {
    throw new Error("Failed to fetch blockchain stats");
  }
  return response.json();
}

export async function fetchDocuments(category?: string, appId?: string): Promise<Document[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (appId) params.set("appId", appId);
  const response = await fetch(`/api/documents?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }
  return response.json();
}

export async function fetchDocument(id: string): Promise<Document> {
  const response = await fetch(`/api/documents/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch document");
  }
  return response.json();
}

export async function createDocument(doc: InsertDocument): Promise<Document> {
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  if (!response.ok) {
    throw new Error("Failed to create document");
  }
  return response.json();
}

export async function updateDocument(id: string, doc: Partial<InsertDocument>): Promise<Document> {
  const response = await fetch(`/api/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  if (!response.ok) {
    throw new Error("Failed to update document");
  }
  return response.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const response = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete document");
  }
}

export interface AppRegistration {
  appName: string;
  appSlug: string;
  appUrl?: string;
  description?: string;
  category?: string;
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

export async function registerApp(app: AppRegistration): Promise<{ success: boolean; data: unknown }> {
  const response = await fetch("/api/ecosystem/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(app),
  });
  if (!response.ok) {
    throw new Error("Failed to register app");
  }
  return response.json();
}

export async function syncEcosystem(): Promise<{ success: boolean; apps: EcosystemApp[] }> {
  const response = await fetch("/api/ecosystem/sync");
  if (!response.ok) {
    throw new Error("Failed to sync ecosystem");
  }
  return response.json();
}
