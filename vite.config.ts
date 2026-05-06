import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const runGit = (args: string[]) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

const getPackageVersion = () => {
  try {
    const pkgRaw = readFileSync(new URL('./package.json', import.meta.url), 'utf8')
    const pkg = JSON.parse(pkgRaw) as { version?: string }
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

const buildMeta = {
  version: getPackageVersion(),
  commit: runGit(['rev-parse', '--short', 'HEAD']),
  message: runGit(['log', '-1', '--pretty=%s']),
  time: new Date().toISOString(),
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(buildMeta.version),
    __APP_BUILD_COMMIT__: JSON.stringify(buildMeta.commit),
    __APP_BUILD_MESSAGE__: JSON.stringify(buildMeta.message),
    __APP_BUILD_TIME__: JSON.stringify(buildMeta.time),
  },
})
