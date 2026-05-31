import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify('https://test.supabase.co'),
    'import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify('test-anon-key'),
    'import.meta.env.NEXT_PUBLIC_DEBUG': JSON.stringify('false')
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'src/test/**', '**/*.d.ts', '**/*.config.*', '**/index.tsx']
    }
  }
});