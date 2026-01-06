// Avoid Lightning CSS parsing warnings from generated container/pointer media
process.env.TAILWIND_LIGHTNINGCSS = 'never'

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, type PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 5000,
    strictPort: true
  },
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
  ],
  css: {
    // Avoid lightningcss warnings on newer media syntax from generated CSS
    transformer: 'postcss',
    postcss: {
      plugins: [
        {
          postcssPlugin: 'fix-problematic-media-queries',
          AtRule(atRule) {
            if (atRule.name !== 'media') return
            const cleaned = atRule.params
              .replace('(width >= (display-mode: standalone))', '(display-mode: standalone)')
              .replace('(width >= (pointer: coarse))', '(pointer: coarse)')
              .replace('(width >= (pointer: fine))', '(pointer: fine)')
            if (cleaned !== atRule.params) {
              atRule.params = cleaned
            }
          }
        }
      ]
    }
  },
  build: {
    // Skip CSS minification to avoid lightningcss warnings during optimize phase
    cssMinify: false
  },
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      // Coverage policy: do not add custom exclusions for app code.
      // Keep Vitest defaults (e.g., ignores dependencies) and enforce thresholds.
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70
      }
    }
  }
});
