import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const target = process.env.TARGET === 'firefox' ? 'firefox' : 'chromium';
const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = path.resolve(rootDir, 'dist', target);

export default defineConfig({
  resolve: {
    alias: {
      '@ai': rootDir
    }
  },
  define: {
    // Pass environment variables to extension
    'process.env.VITE_CONNECTOR_API_URL': JSON.stringify(
      process.env.VITE_CONNECTOR_API_URL || 'http://localhost:3001'
    ),
    'process.env.VITE_TARGET': JSON.stringify(target)
  },
  build: {
    outDir,
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: path.resolve(rootDir, 'extension/popup.html'),
        sidepanel: path.resolve(rootDir, 'extension/sidepanel.html'),
        background: path.resolve(rootDir, 'extension/background/index.ts'),
        'content-script': path.resolve(rootDir, 'extension/content-script/index.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  },
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      closeBundle() {
        mkdirSync(outDir, { recursive: true });
        copyFileSync(
          path.resolve(rootDir, `extension/manifest/${target}.manifest.json`),
          path.resolve(outDir, 'manifest.json')
        );
      }
    }
  ]
});
