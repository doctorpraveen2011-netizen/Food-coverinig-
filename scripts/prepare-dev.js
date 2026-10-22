import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const devIndexPath = path.join(rootDir, 'index.dev.html');

if (fs.existsSync(devIndexPath)) {
  fs.copyFileSync(devIndexPath, indexPath);
} else if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf-8');
  if (!content.includes('./src/main.tsx')) {
    // Replace bundled script with main.tsx for dev
    content = content.replace(
      /<script type="module" crossorigin src="\.\/assets\/index-[^"]+\.js"><\/script>/,
      '<script type="module" src="./src/main.tsx"></script>'
    );
    // Remove compiled css link for dev since Vite loads css through main.tsx
    content = content.replace(
      /<link rel="stylesheet" crossorigin href="\.\/assets\/index-[^"]+\.css">\s*/,
      ''
    );
    fs.writeFileSync(indexPath, content, 'utf-8');
  }
  // Save as master index.dev.html
  fs.writeFileSync(devIndexPath, content, 'utf-8');
}
