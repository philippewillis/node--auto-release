import { Hono } from 'hono'
import { cors } from 'hono/cors'

export function createApp() {
  const app = new Hono()

  // Midleware
  app.use('*', cors())

  app.get('/', (c) => c.text('Hono!'))
  return app
}
