import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3002
  },
  plugins: [
    react(),
    // legacy({
    //   targets: [
    //     'last 2 versions',
    //     'iOS >= 10',
    //     'Android >= 6',
    //     'Chrome >= 49',
    //     'Safari >= 10',
    //     'Samsung >= 5',
    //     'OperaMobile >= 46'
    //     // 其他特定版本或者范围
    //   ],
    //   renderLegacyChunks: true,
    //   additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    // })

    legacy({
      targets: ['chrome 86'],
      modernPolyfills: true,
      renderLegacyChunks: true,
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
  build: {
    target: 'chrome86'
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'chrome86'
    }
  }
});
