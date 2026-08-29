import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cesium()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      strictPort: false,
      hmr: process.env.DISABLE_HMR !== 'true'
        ? { port: 24679 } // Explicit HMR port to avoid conflicts
        : false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
