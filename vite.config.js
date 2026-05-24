import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const buildVersion = new Date().toISOString()

// Stamp public/version.json as soon as the config is evaluated (build & dev)
writeFileSync(
  resolve(__dirname, 'public/version.json'),
  JSON.stringify({ version: buildVersion }) + '\n'
)
console.log(`[version-stamp] version = ${buildVersion}`)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/mc4u-private/',
  define: {
    // Inject the build version as a global constant so the runtime can compare
    __APP_VERSION__: JSON.stringify(buildVersion),
  },
})
