import { Request, Response, NextFunction } from 'express';
import { ok, err } from './types';

const DEMO_EMAIL = 'demo@qaleap.com';
const DEMO_PASSWORD = 'Demo123';

// Fake-but-valid token. requireAuth accepts any non-empty Bearer token, so issued
// tokens are not coupled to server restarts (test-stable).
const DEMO_TOKEN = 'qaleap-demo-token';

export function login(req: Request, res: Response) {
  const body = req.body ?? {};
  const email = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return res.status(400).json(err('Email and password are required'));
  }
  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    return res.status(401).json(err('Invalid email or password'));
  }
  return res.status(200).json(ok({ token: DEMO_TOKEN }));
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json(err('Missing or invalid authentication token'));
  }
  next();
}
