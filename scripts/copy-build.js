import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run "vite build" first.');
  process.exit(1);
}

// 1. Remove existing docs directory if exists and re-create
if (fs.existsSync(docsDir)) {
  fs.rmSync(docsDir, { recursive: true, force: true });
}
fs.mkdirSync(docsDir, { recursive: true });

// 2. Copy everything from dist/ to docs/
fs.cpSync(distDir, docsDir, { recursive: true });

// 3. Clean up links in docs/index.html
const docsIndex = path.join(docsDir, 'index.html');
if (fs.existsSync(docsIndex)) {
  let content = fs.readFileSync(docsIndex, 'utf-8');
  content = content.replace(/href="\.\/docs\//g, 'href="./');
  fs.writeFileSync(docsIndex, content, 'utf-8');
}

// 4. Create 404.html fallbacks for SPA client-side routing on GitHub Pages
const distIndex = path.join(distDir, 'index.html');
if (fs.existsSync(distIndex)) {
  fs.copyFileSync(docsIndex, path.join(docsDir, '404.html'));
  fs.copyFileSync(docsIndex, path.join(rootDir, '404.html'));
  console.log('✓ Successfully copied dist -> docs and generated 404.html fallbacks.');
} else {
  console.warn('Warning: dist/index.html not found.');
}
