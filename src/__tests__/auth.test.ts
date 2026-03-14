import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const BASE_URL = 'http://localhost:3000';

describe('Auth API', () => {
  const testUser = {
    name: 'Test User',
    email: `test-${Date.now()}@phylax.dev`,
    password: 'testpass123',
  };
  let token: string;

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.name).toBe(testUser.name);
      expect(data.user.email).toBe(testUser.email);
      expect(data.user.role).toBe('submitter');
      expect(data.token).toBeDefined();
      expect(data.user.password_hash).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });

      expect(response.status).toBe(409);
    });

    it('should reject short password', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Short', email: 'short@test.com', password: '123' }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('8 characters');
    });

    it('should reject missing fields', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'No Email' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: testUser.password }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.email).toBe(testUser.email);
      expect(data.token).toBeDefined();
      token = data.token;
    });

    it('should reject wrong password', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: 'wrongpass' }),
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid email or password');
    });

    it('should reject nonexistent email with same error', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@test.com', password: 'whatever' }),
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid email or password');
    });
  });

  describe('Route Protection', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents`, {
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });

    it('should allow authenticated requests', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(200);
    });

    it('should reject submitter from admin-only routes', async () => {
      const response = await fetch(`${BASE_URL}/api/settings`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(response.status).toBe(403);
    });
  });
});
