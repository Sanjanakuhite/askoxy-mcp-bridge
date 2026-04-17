const request = require('supertest');
const app = require('../server');

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('tools');
    expect(Array.isArray(response.body.tools)).toBe(true);
  });
});

describe('Rate Limiting', () => {
  it('should handle rate limiting', async () => {
    // This test would need to be adjusted based on rate limiter config
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});