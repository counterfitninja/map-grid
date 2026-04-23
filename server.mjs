import http from 'node:http'
import handler from 'serve-handler'

const preferredPort = Number.parseInt(process.env.PORT ?? '', 10)
const fallbackPort = Number.parseInt(process.env.START_PORT ?? '4173', 10)
const port = Number.isFinite(preferredPort) ? preferredPort : fallbackPort

const server = http.createServer((request, response) => {
  handler(request, response, {
    public: 'dist',
    rewrites: [{ source: '**', destination: '/index.html' }],
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Serving dist on http://0.0.0.0:${port}`)
})