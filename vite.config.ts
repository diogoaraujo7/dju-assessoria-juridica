import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: false
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tiptap: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-bubble-menu'],
          genai: ['@google/genai'],
          markdown: ['react-markdown', 'remark-gfm', 'rehype-sanitize', 'marked', 'turndown', 'dompurify'],
          utils: ['zod', 'zod-to-json-schema', 'lucide-react', 'jsonrepair']
        }
      }
    }
  }
});
