import http from 'node:http'
import { execSync } from 'node:child_process'
import { statSync } from 'node:fs'
import path from 'node:path'
import handler from 'serve-handler'

const preferredPort = Number.parseInt(process.env.PORT ?? '', 10)
const fallbackPort = Number.parseInt(process.env.START_PORT ?? '4173', 10)
const port = Number.isFinite(preferredPort) ? preferredPort : fallbackPort
const host = process.env.HOST?.trim() || '0.0.0.0'

const getGitCommit = () => {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

const getBuildTimestamp = () => {
  try {
    const distIndex = path.resolve('dist', 'index.html')
    const mtime = statSync(distIndex).mtime
    return mtime.toISOString()
  } catch {
    return 'unknown'
  }
}

const server = http.createServer((request, response) => {
  handler(request, response, {
    public: 'dist',
    rewrites: [{ source: '**', destination: '/index.html' }],
  })
})

server.listen(port, host, () => {
  const commit = getGitCommit()
  const buildTimestamp = getBuildTimestamp()
  console.log(`Build: commit ${commit}, dist/index.html mtime ${buildTimestamp}`)
  console.log(`Serving dist on http://${host}:${port}`)
})