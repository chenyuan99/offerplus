import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  envPrefix: 'NEXT_PUBLIC_',
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
