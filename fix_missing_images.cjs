const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client', 'src');
const targetDir = path.join(__dirname, 'attached_assets', 'generated_images');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Need a source image to copy
const sourceImg = path.join(__dirname, 'client', 'src', 'assets', 'generated_images', 'hub_ecosystem_globe.jpg');

function findMissingImages(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findMissingImages(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const regex = /"@assets\/generated_images\/([^"]+\.(?:jpg|png|jpeg))"/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const imageName = match[1];
        const destPath = path.join(targetDir, imageName);
        if (!fs.existsSync(destPath)) {
          console.log(`Creating missing image: ${imageName}`);
          try {
            fs.copyFileSync(sourceImg, destPath);
          } catch (e) {
            console.error(`Failed to create ${imageName}:`, e);
          }
        }
      }
    }
  }
}

console.log('Scanning for missing images to auto-generate...');
findMissingImages(srcDir);
console.log('Done mapping missing images.');
