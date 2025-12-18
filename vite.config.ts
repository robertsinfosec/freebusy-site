// Avoid Lightning CSS parsing warnings from generated container/pointer media
process.env.TAILWIND_LIGHTNINGCSS = 'never'

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
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
});
