import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          // Add other large libraries you're using based on your dependencies
          // ui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          // utils: ['lodash', 'axios'],
          // icons: ['lucide-react', '@heroicons/react']
        }
      }
    },
    // Increase chunk size warning limit if needed
    chunkSizeWarningLimit: 1000
  }
})