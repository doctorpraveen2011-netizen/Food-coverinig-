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

// 1. Create .nojekyll in root, dist, and docs to disable Jekyll static processing on GitHub Pages
fs.writeFileSync(path.join(rootDir, '.nojekyll'), '');
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

// 2. Remove existing docs directory if exists and re-create
if (fs.existsSync(docsDir)) {
  fs.rmSync(docsDir, { recursive: true, force: true });
}
fs.mkdirSync(docsDir, { recursive: true });

// 3. Copy everything from dist/ to docs/
fs.cpSync(distDir, docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');

// 4. Copy assets & samples to root as well so both /assets and /docs/assets resolve 100%
const distAssets = path.join(distDir, 'assets');
const rootAssets = path.join(rootDir, 'assets');
if (fs.existsSync(distAssets)) {
  if (fs.existsSync(rootAssets)) {
    fs.rmSync(rootAssets, { recursive: true, force: true });
  }
  fs.cpSync(distAssets, rootAssets, { recursive: true });
}

const distSamples = path.join(distDir, 'samples');
const rootSamples = path.join(rootDir, 'samples');
if (fs.existsSync(distSamples)) {
  if (fs.existsSync(rootSamples)) {
    fs.rmSync(rootSamples, { recursive: true, force: true });
  }
  fs.cpSync(distSamples, rootSamples, { recursive: true });
}

// 5. Clean up links in docs/index.html
const docsIndex = path.join(docsDir, 'index.html');
if (fs.existsSync(docsIndex)) {
  let content = fs.readFileSync(docsIndex, 'utf-8');
  content = content.replace(/href="\.\/docs\//g, 'href="./');
  fs.writeFileSync(docsIndex, content, 'utf-8');
}

// 6. Create 404.html fallbacks for SPA client-side routing on GitHub Pages
const distIndex = path.join(distDir, 'index.html');
if (fs.existsSync(distIndex)) {
  fs.copyFileSync(docsIndex, path.join(docsDir, '404.html'));
  fs.copyFileSync(distIndex, path.join(rootDir, '404.html'));
  console.log('✓ Successfully copied dist -> docs, synchronized root assets, added .nojekyll, and generated 404.html fallbacks.');
} else {
  console.warn('Warning: dist/index.html not found.');
}
