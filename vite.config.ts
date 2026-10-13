import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/my-finance-tracker/',
  plugins: [react()],
});
