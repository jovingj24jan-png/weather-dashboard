import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /weather-dashboard/; dev stays at /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/weather-dashboard/' : '/',
  plugins: [react()],
}));
