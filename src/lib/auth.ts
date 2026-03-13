import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'submitter';
}

export function getUser(request: NextRequest): AuthUser | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function requireAuth(request: NextRequest): AuthUser | Response {
  const user = getUser(request);
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return user;
}

export function requireRole(request: NextRequest, roles: string[]): AuthUser | Response {
  const result = requireAuth(request);
  if (result instanceof Response) return result;

  if (!roles.includes(result.role)) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return result;
}