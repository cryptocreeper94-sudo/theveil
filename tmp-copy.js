const fs = require('fs');
const path = require('path');

const srcRoot = path.join(__dirname, 'client/src');
const destRoot = path.join('D:', 'chronicles', 'src');

if (!fs.existsSync(destRoot)) {
    fs.mkdirSync(destRoot, { recursive: true });
}

function copyDir(src, dest) {
    if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true, force: true });
        console.log(`Copied dir ${src} to ${dest}`);
    } else {
        console.log(`Missing dir ${src}`);
    }
}

function copyFile(src, dest) {
    if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        console.log(`Copied file ${src} to ${dest}`);
    } else {
        console.log(`Missing file ${src}`);
    }
}

copyDir(path.join(srcRoot, 'components/ui'), path.join(destRoot, 'components/ui'));
copyDir(path.join(srcRoot, 'components/chronicles-3d'), path.join(destRoot, 'components/chronicles-3d'));
copyDir(path.join(srcRoot, 'components/chronicles'), path.join(destRoot, 'components/chronicles'));

const standalones = [
    'chronicles-npc.tsx',
    'chronicles-chat-panel.tsx',
    'character-portrait.tsx',
    'chrono-ui.tsx',
    'glass-card.tsx'
];
for (const file of standalones) {
    copyFile(path.join(srcRoot, 'components', file), path.join(destRoot, 'components', file));
}

const pagesDir = path.join(srcRoot, 'pages');
if (fs.existsSync(pagesDir)) {
    const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
    for (const file of pages) {
        if (file.startsWith('chronicles') || file.startsWith('chrono') || file === 'era-codex.tsx' || file === 'roadmap-chronicles.tsx' || file === 'scenario-generator.tsx' || file === 'build-your-legacy.tsx') {
            copyFile(path.join(pagesDir, file), path.join(destRoot, 'pages', file));
        }
    }
}

copyFile(path.join(srcRoot, 'stores/gameStore.ts'), path.join(destRoot, 'stores/gameStore.ts'));
copyFile(path.join(srcRoot, 'stores/authStore.ts'), path.join(destRoot, 'stores/authStore.ts'));
copyFile(path.join(srcRoot, 'services/api.ts'), path.join(destRoot, 'services/api.ts'));
copyFile(path.join(srcRoot, 'App.tsx'), path.join(destRoot, 'App.tsx'));

const envPath = path.join('D:', 'chronicles', '.env');
fs.writeFileSync(envPath, `VITE_API_BASE=https://dwtl.io\n`);
console.log('Wrote .env');

console.log('Done copying files.');
