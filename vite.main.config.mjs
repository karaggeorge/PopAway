import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'node:path';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: path.resolve('src/popaway-cli'),
          dest: './'
        }
      ]
    })
  ]
});
