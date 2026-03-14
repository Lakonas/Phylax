import { describe, it, expect, beforeAll } from '@jest/globals';

const BASE_URL = 'http://localhost:3000';

describe('Incidents API', () => {
  let adminToken: string;
  let submitterToken: string;
  let incidentId: string;

  beforeAll(async () => {
    // Login as admin
    const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@phylax.dev', password: 'password123' }),
    });
    const adminData = await adminLogin.json();
    adminToken = adminData.token;

    // Register a submitter for role tests
    const submitterReg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Submitter Test',
        email: `submitter-${Date.now()}@phylax.dev`,
        password: 'testpass123',
        role: 'submitter',
      }),
    });
    const submitterData = await submitterReg.json();
    submitterToken = submitterData.token;
  });

  describe('POST /api/incidents', () => {
    it('should create an incident with valid data', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: 'Test incident from Jest',
          description: 'Automated test creating an incident',
          category: 'Application',
          severity: 'P3',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.ticket_number).toMatch(/^PHX-\d{6}$/);
      expect(data.title).toBe('Test incident from Jest');
      expect(data.status).toBe('Open');
      expect(data.severity).toBe('P3');
      expect(data.reported_by).toBe('Admin User');
      incidentId = data.id;
    });

    it('should reject missing title', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ description: 'No title here' }),
      });

      expect(response.status).toBe(400);
    });

    it('should default severity to P4', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: 'Default severity test',
          description: 'Should default to P4',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.severity).toBe('P4');
    });
  });

  describe('GET /api/incidents', () => {
    it('should return an array of incidents', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/incidents/[id]', () => {
    it('should return a single incident', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(incidentId);
      expect(data.title).toBe('Test incident from Jest');
    });

    it('should return 404 for nonexistent incident', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents/00000000-0000-0000-0000-000000000000`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/incidents/[id] — State Machine', () => {
    it('should transition Open to In Progress', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'In Progress', assigned_to: 'Sarah Chen' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('In Progress');
      expect(data.assigned_to).toBe('Sarah Chen');
    });

    it('should reject invalid transition In Progress to Closed', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'Closed' }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Cannot transition');
    });

    it('should require resolution notes when resolving', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'Resolved' }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Resolution notes');
    });

    it('should resolve with resolution notes', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: 'Resolved',
          resolution_notes: 'Fixed in automated test',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('Resolved');
      expect(data.resolved_at).toBeDefined();
    });

    it('should allow reopen from Resolved to In Progress', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'In Progress' }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('In Progress');
    });

    it('should reject submitter from updating incidents', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${submitterToken}`,
        },
        body: JSON.stringify({ severity: 'P1' }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Audit Trail', () => {
    it('should record changes in incident history', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}/history`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].field_changed).toBeDefined();
      expect(data[0].old_value).toBeDefined();
      expect(data[0].new_value).toBeDefined();
    });
  });

  describe('Comments', () => {
    it('should post a comment', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ body: 'Test comment from Jest' }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.body).toBe('Test comment from Jest');
      expect(data.author).toBe('Admin User');
    });

    it('should fetch comments for an incident', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}/comments`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should post an internal note', async () => {
      const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ body: 'Internal note from Jest', is_internal: true }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.is_internal).toBe(true);
    });
  });
});
