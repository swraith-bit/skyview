import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Same policy previously hardcoded in index.html. Injected only during production builds so the
// dev server's inline react-refresh preamble is not blocked (F0.4). Android WebView reads the
// CSP from the built index.html, so the native app keeps the same protection.
const productionCsp =
  "default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'self'; " +
  "style-src 'self' 'unsafe-inline'; font-src 'self' data:; " +
  "connect-src 'self' https://api.open-meteo.com https://geocoding-api.open-meteo.com " +
  "https://services.swpc.noaa.gov https://api.wheretheiss.at https://iss-api.polluxlabs.io " +
  "https://api.nasa.gov https://celestrak.org https://nominatim.openstreetmap.org " +
  "ws://localhost:* ws://127.0.0.1:*; " +
  "img-src 'self' data: blob: https:; media-src https: blob:; " +
  "frame-src https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://player.vimeo.com; " +
  "worker-src 'self' blob:; form-action 'none';";

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'inject-production-csp',
        apply: 'build',
        transformIndexHtml(html) {
          return html.replace('</head>', `  <meta http-equiv="Content-Security-Policy" content="${productionCsp}" />\n  </head>`);
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'three-vendor';
            if (id.includes('node_modules/zod')) return 'schema-runtime';
          },
        },
      },
    },
  };
});
