import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (
            id.includes('react-dom') ||
            id.includes('react/jsx-runtime') ||
            id.includes('/react/')
          ) {
            return 'react-vendor'
          }

          if (id.includes('@tanstack/')) return 'tanstack-vendor'
          if (id.includes('@radix-ui/')) return 'radix-vendor'
          if (id.includes('lucide-react') || id.includes('react-icons')) return 'icons-vendor'
          if (id.includes('recharts') || id.includes('d3-')) return 'chart-vendor'
          if (
            id.includes('react-hook-form') ||
            id.includes('@hookform/resolvers') ||
            id.includes('zod')
          ) {
            return 'form-vendor'
          }
          if (id.includes('@dnd-kit/')) return 'dnd-vendor'
          if (id.includes('axios') || id.includes('sonner')) return 'app-utils-vendor'
          return 'vendor'
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
    },
  },
})
