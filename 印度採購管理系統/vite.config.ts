import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const DB_FILE = path.resolve(__dirname, 'data.json')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'db-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/db' && req.method === 'GET') {
            if (!fs.existsSync(DB_FILE)) {
              fs.writeFileSync(DB_FILE, JSON.stringify({}))
            }
            const data = fs.readFileSync(DB_FILE, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(data)
          } else if (req.url === '/api/db' && req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', () => {
              fs.writeFileSync(DB_FILE, body)
              res.end('ok')
            })
          } else {
            next()
          }
        })
      }
    }
  ],
  server: {
    host: true, // 允許區域網路連線
    port: 5174,
    strictPort: true // 確保使用 5174，避免與主系統衝突
  }
})
