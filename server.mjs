import http from 'node:http'
import handler from 'serve-handler'

const port = Number.parseInt(process.env.PORT ?? '3000', 10)

const server = http.createServer((request, response) => {
  handler(request, response, {
    public: 'dist',
    rewrites: [{ source: '**', destination: '/index.html' }],
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Serving dist on http://0.0.0.0:${port}`)
})