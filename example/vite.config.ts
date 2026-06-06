import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    // Ensure a single copy of React and hook-using libs when using file: deps
    dedupe: ['react', 'react-dom', 'lucide-react'],
  },
  server: {
    port: 3001,
  },
});
