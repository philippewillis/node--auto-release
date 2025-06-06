import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'

export function createApp() {
  const app = new Hono()

  // Midleware
  app.use('*', cors())
  app.use(compress())

  app.get('/', (c) => c.text('Hono!'))
  return app
}
