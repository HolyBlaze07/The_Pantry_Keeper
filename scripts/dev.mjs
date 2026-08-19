import { createServer as createHttpServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createServer as createViteServer } from 'vite'

import suggestRecipes from '../api/suggest-recipes.ts'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDir, '..')
const defaultApiPort = 3001

function parseEnvFile(contents) {
  const parsed = {}

  for (const line of contents.split(/\r?\n/)) {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmedLine.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    let value = trimmedLine.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    parsed[key] = value
  }

  return parsed
}

async function loadLocalEnv() {
  const envFiles = ['.env.local', '.env']

  for (const envFile of envFiles) {
    const envPath = resolve(projectRoot, envFile)

    try {
      const contents = await readFile(envPath, 'utf8')
      const parsed = parseEnvFile(contents)

      for (const [key, value] of Object.entries(parsed)) {
        if (process.env[key] === undefined) {
          process.env[key] = value
        }
      }
    } catch {
      continue
    }
  }
}

function createApiRequestHandler() {
  return async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)

    if (requestUrl.pathname !== '/api/suggest-recipes') {
      response.statusCode = 404
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ error: 'Not found.' }))
      return
    }

    if (request.method !== 'POST') {
      response.statusCode = 405
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ error: 'Method not allowed.' }))
      return
    }

    const chunks = []

    for await (const chunk of request) {
      chunks.push(chunk)
    }

    let body = undefined

    if (chunks.length > 0) {
      const rawBody = Buffer.concat(chunks).toString('utf8')

      try {
        body = JSON.parse(rawBody)
      } catch {
        response.statusCode = 400
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ error: 'Invalid JSON request body.' }))
        return
      }
    }

    await suggestRecipes(
      {
        method: request.method,
        body,
      },
      {
        status(code) {
          response.statusCode = code

          return {
            json(value) {
              response.setHeader('Content-Type', 'application/json')
              response.end(JSON.stringify(value))
            },
          }
        },
      },
    )
  }
}

function startApiServer() {
  return new Promise((resolveServer, rejectServer) => {
    const requestHandler = createApiRequestHandler()
    const maxPortAttempts = 20

    const tryListen = (port, attempt) => {
      const server = createHttpServer(requestHandler)

      const onError = (error) => {
        if (error.code === 'EADDRINUSE' && attempt < maxPortAttempts) {
          server.close()
          tryListen(port + 1, attempt + 1)
          return
        }

        rejectServer(error)
      }

      server.once('error', onError)
      server.listen(port, () => {
        server.removeListener('error', onError)
        console.log(`Recipe API server listening on http://localhost:${port}`)
        resolveServer({ server, port })
      })
    }

    tryListen(defaultApiPort, 1)
  })
}

async function main() {
  await loadLocalEnv()
  const { server: apiServer, port: apiPort } = await startApiServer()
  process.env.VITE_API_PROXY_TARGET = `http://localhost:${apiPort}`

  const viteServer = await createViteServer({
    configFile: resolve(projectRoot, 'vite.config.ts'),
  })

  await viteServer.listen()

  const localUrl = viteServer.resolvedUrls?.local?.[0]

  if (localUrl) {
    console.log(`Pantry Keeper app is running at ${localUrl}`)
  }

  console.log(`Recipe API proxy target is ${process.env.VITE_API_PROXY_TARGET}`)

  const shutdown = async () => {
    apiServer.close()
    await viteServer.close()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})