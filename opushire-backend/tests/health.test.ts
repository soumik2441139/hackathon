import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import app from '../src/server';

describe('API Health Checks', () => {
  it('GET / should return alive status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'alive', message: 'Opushire Backend API' });
  });

  it('GET /health should return environmental variables', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.env).toBeDefined();
    expect(res.body.status).toBe('ok');
  });

  // Tests 404 handler
  it('GET /invalid-route should return 404', async () => {
    const res = await request(app).get('/invalid-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
