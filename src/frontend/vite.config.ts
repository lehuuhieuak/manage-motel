import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

const DEFAULT_DEV_SERVER_PORT = 5173
const DEFAULT_GATEWAY_TARGET = 'http://localhost:5241'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // Aspire passes --port for its endpoint; plain `npm run dev` falls back to 5173.
  const port = Number(process.env.PORT ?? env.VITE_DEV_SERVER_PORT ?? DEFAULT_DEV_SERVER_PORT)
  const gatewayTarget = env.VITE_DEV_PROXY_TARGET || DEFAULT_GATEWAY_TARGET

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true,
      port,
      strictPort: true,
      // Browser traffic reaches the API Gateway only; these proxies are a
      // local-development shortcut so `/api/v1` and `/health/*` resolve the same
      // way they do behind the Gateway.
      proxy: {
        '/api': {
          target: gatewayTarget,
          changeOrigin: true,
        },
        '/health': {
          target: gatewayTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
