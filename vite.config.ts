import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    base: command === 'build' ? (env.VITE_BASE_PATH || '/') : '/',
    plugins: [react()],
    clearScreen: false,
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
          register: 'register.html',
          demo: 'demo.html',
          login: 'login/index.html',
          features: 'features/index.html',
          integrations: 'integrations/index.html',
          aiSales: 'ai-sales/index.html',
          resources: 'resources/index.html',
          pricing: 'pricing/index.html',
          install: 'install/index.html',
        },
      },
    },
    server: {
      port: 1420,
      strictPort: true,
    },
  };
});
