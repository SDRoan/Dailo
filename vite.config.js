import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import coachHandler from './api/coach.js'

function localApiRoutes() {
  return {
    name: 'local-api-routes',
    configureServer(server) {
      server.middlewares.use('/api/coach', async (req, res, next) => {
        try {
          await coachHandler(req, res)
        } catch {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Local AI endpoint failed.' }))
        }
        if (!res.writableEnded) next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), localApiRoutes()],
})
