const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Monitor = require('../models/Monitor');
const StatusPage = require('../models/StatusPage');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Monitor.deleteMany({});
  await StatusPage.deleteMany({});
});

describe('PingCraft API End-to-End Workflow Integration Tests', () => {
  let userTokenA;
  let userIdA;
  let userTokenB;
  let userIdB;

  beforeEach(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Developer',
        email: 'alice@example.com',
        password: 'Password123!'
      });
    userTokenA = resA.body.data.token;
    userIdA = resA.body.data.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Responder',
        email: 'bob@example.com',
        password: 'Password123!'
      });
    userTokenB = resB.body.data.token;
    userIdB = resB.body.data.user.id;
  });

  describe('Health Route', () => {
    test('GET /api/health returns 200 and system readiness info', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.database.connected).toBe(true);
      expect(res.body.system.nodeVersion).toBeDefined();
    });
  });

  describe('Authentication & Protected Routes', () => {
    test('rejects unauthenticated requests to protected monitor endpoint with 401', async () => {
      const res = await request(app).get('/api/monitors');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('logs in registered user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'Password123!'
        });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    test('rejects login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'WrongPassword!'
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Monitor Lifecycle & Ownership Enforcement', () => {
    test('creates monitor for User A and prevents SSRF URLs', async () => {
      // 1. Rejects localhost SSRF
      const badRes = await request(app)
        .post('/api/monitors')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Internal Admin',
          url: 'http://localhost:8080/admin'
        });
      expect(badRes.status).toBe(400);
      expect(badRes.body.message).toContain('rejected');

      // 2. Accepts valid public URL
      const goodRes = await request(app)
        .post('/api/monitors')
        .set('Authorization', `Bearer ${userTokenA}`)
        .send({
          name: 'Public API Check',
          url: 'https://httpbin.org/status/200',
          method: 'GET',
          intervalSeconds: 60
        });
      expect(goodRes.status).toBe(201);
      expect(goodRes.body.data.name).toBe('Public API Check');
    });

    test('enforces strict ownership isolation: User B cannot access User A monitor', async () => {
      // Create monitor under User A
      const monitor = await Monitor.create({
        userId: userIdA,
        name: 'Private Database API',
        url: 'https://httpbin.org/status/200',
        method: 'GET'
      });

      // User A can access it
      const resA = await request(app)
        .get(`/api/monitors/${monitor._id}`)
        .set('Authorization', `Bearer ${userTokenA}`);
      expect(resA.status).toBe(200);

      // User B tries to access User A's monitor -> receives 404
      const resB = await request(app)
        .get(`/api/monitors/${monitor._id}`)
        .set('Authorization', `Bearer ${userTokenB}`);
      expect(resB.status).toBe(404);

      // User B tries to delete User A's monitor -> receives 404
      const delB = await request(app)
        .delete(`/api/monitors/${monitor._id}`)
        .set('Authorization', `Bearer ${userTokenB}`);
      expect(delB.status).toBe(404);
    });

    test('pauses and resumes a monitor', async () => {
      const monitor = await Monitor.create({
        userId: userIdA,
        name: 'Production Auth',
        url: 'https://httpbin.org/status/200'
      });

      const pauseRes = await request(app)
        .patch(`/api/monitors/${monitor._id}/pause`)
        .set('Authorization', `Bearer ${userTokenA}`);
      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.data.isPaused).toBe(true);
      expect(pauseRes.body.data.status).toBe('PAUSED');

      const resumeRes = await request(app)
        .patch(`/api/monitors/${monitor._id}/pause`)
        .set('Authorization', `Bearer ${userTokenA}`);
      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.data.isPaused).toBe(false);
      expect(resumeRes.body.data.status).toBe('OPERATIONAL');
    });
  });

  describe('Public Status Page Route', () => {
    test('serves public status page by slug without authentication', async () => {
      const monitor = await Monitor.create({
        userId: userIdA,
        name: 'CDN Edge',
        url: 'https://httpbin.org/status/200',
        status: 'OPERATIONAL',
        isPublic: true
      });

      await StatusPage.create({
        userId: userIdA,
        slug: 'acme-services',
        title: 'Acme Cloud Status',
        description: 'System health monitoring',
        monitors: [monitor._id],
        isPublished: true
      });

      const res = await request(app).get('/api/status-pages/public/acme-services');
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Acme Cloud Status');
      expect(res.body.data.components.length).toBe(1);
      expect(res.body.data.components[0].name).toBe('CDN Edge');

      // Private URLs, emails, or user IDs are NOT leaked
      expect(res.body.data.components[0].url).toBeUndefined();
      expect(res.body.data.userId).toBeUndefined();
    });

    test('returns 404 for non-existent status page slug', async () => {
      const res = await request(app).get('/api/status-pages/public/non-existent-slug-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
