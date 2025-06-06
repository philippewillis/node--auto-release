import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

export function createApp() {
  const app = new Hono()

  // Midleware
  app.use('*', cors())
  app.use(compress())
  app.use(logger())
  app.use(prettyJSON())

  // Routes
  app.get('/', (c) => c.text('Hono!'))
  return app
}
