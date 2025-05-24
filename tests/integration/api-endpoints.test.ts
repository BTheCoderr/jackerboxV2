import { describe, expect, test, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3002

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

let server: any

beforeAll(async () => {
  await app.prepare()
  
  server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  await new Promise<void>((resolve) => {
    server.listen(port, resolve)
  })
})

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => {
      server.close(resolve)
    })
  }
  await app.close()
})

describe('API Integration Tests', () => {
  describe('/api/health', () => {
    test('should return 200 and database status', async () => {
      const response = await request(`http://localhost:${port}`)
        .get('/api/health')
        .expect(200)

      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('database')
    })
  })

  describe('/api/equipment', () => {
    test('should return equipment list', async () => {
      const response = await request(`http://localhost:${port}`)
        .get('/api/equipment')
        .expect(200)

      expect(response.body).toHaveProperty('equipment')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.equipment)).toBe(true)
    })

    test('should filter by category', async () => {
      const response = await request(`http://localhost:${port}`)
        .get('/api/equipment?category=cameras')
        .expect(200)

      expect(response.body.equipment).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'cameras'
          })
        ])
      )
    })

    test('should search by query', async () => {
      const response = await request(`http://localhost:${port}`)
        .get('/api/equipment?query=canon')
        .expect(200)

      expect(response.body).toHaveProperty('equipment')
    })
  })

  describe('/api/payments/test-intent', () => {
    test('should create payment intent', async () => {
      const response = await request(`http://localhost:${port}`)
        .post('/api/payments/test-intent')
        .send({ amount: 1000 })
        .expect(200)

      expect(response.body).toHaveProperty('clientSecret')
      expect(response.body).toHaveProperty('paymentIntentId')
    })

    test('should reject invalid amount', async () => {
      await request(`http://localhost:${port}`)
        .post('/api/payments/test-intent')
        .send({ amount: -100 })
        .expect(400)
    })
  })

  describe('/api/user/profile', () => {
    test('should require authentication', async () => {
      await request(`http://localhost:${port}`)
        .get('/api/user/profile')
        .expect(401)
    })

    test('should reject unauthenticated POST', async () => {
      await request(`http://localhost:${port}`)
        .post('/api/user/profile')
        .send({ name: 'Test User' })
        .expect(401)
    })
  })

  describe('/api/rentals', () => {
    test('should require authentication for GET', async () => {
      await request(`http://localhost:${port}`)
        .get('/api/rentals')
        .expect(401)
    })

    test('should require authentication for POST', async () => {
      await request(`http://localhost:${port}`)
        .post('/api/rentals')
        .send({
          equipmentId: 'test-id',
          startDate: '2025-05-01',
          endDate: '2025-05-03',
          totalPrice: 300
        })
        .expect(401)
    })
  })

  describe('/api/messages', () => {
    test('should require authentication', async () => {
      await request(`http://localhost:${port}`)
        .get('/api/messages')
        .expect(401)
    })
  })

  describe('/api/webhooks/stripe', () => {
    test('should handle missing signature', async () => {
      await request(`http://localhost:${port}`)
        .post('/api/webhooks/stripe')
        .send({ type: 'test' })
        .expect(400)
    })
  })

  describe('/api/auth/providers', () => {
    test('should return auth providers', async () => {
      const response = await request(`http://localhost:${port}`)
        .get('/api/auth/providers')
        .expect(200)

      expect(response.body).toBeDefined()
    })
  })

  describe('/api/auth/session', () => {
    test('should return session info', async () => {
      const response = await request(`http://localhost:${port}`)
        .get('/api/auth/session')
        .expect(200)

      expect(response.body).toBeDefined()
    })
  })
}) 