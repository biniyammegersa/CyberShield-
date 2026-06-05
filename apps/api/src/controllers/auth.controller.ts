import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import * as authService from '../services/auth.service';
import { getClientIp } from '../services/audit.service';

const REFRESH_COOKIE = 'cybershield_refresh';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    const result = await authService.register(req.body, ip, req.headers['user-agent'] as string);
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({
      data: {
        accessToken: result.accessToken,
        user: result.user,
        memberships: result.memberships,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ip = getClientIp(req);
    const result = await authService.login(
      req.body.email,
      req.body.password,
      ip,
      req.headers['user-agent'] as string
    );
    setRefreshCookie(res, result.refreshToken);
    res.json({
      data: {
        accessToken: result.accessToken,
        user: result.user,
        memberships: result.memberships,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies[REFRESH_COOKIE] as string | undefined;
    if (!token) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });
      return;
    }
    const ip = getClientIp(req);
    const result = await authService.refreshSession(token, ip, req.headers['user-agent'] as string);
    setRefreshCookie(res, result.refreshToken);
    res.json({ data: { accessToken: result.accessToken } });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies[REFRESH_COOKIE] as string | undefined;
    const ip = getClientIp(req);
    await authService.logout(token, req.user?.id, ip);
    clearRefreshCookie(res);
    res.json({ data: { message: 'Logged out' } });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function loginHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await authService.getLoginHistory(req.user!.id, page, limit);
    res.json({ data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
  } catch (err) {
    next(err);
  }
}
