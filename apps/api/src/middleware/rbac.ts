import type { NextFunction, Request, Response } from 'express';
import { PlatformRole } from '@prisma/client';
import { forbidden } from '../utils/errors';

export enum Permission {
  MANAGE_ORGANIZATIONS = 'manage_organizations',
  MANAGE_PLATFORM_USERS = 'manage_platform_users',
  MANAGE_ORG_MEMBERS = 'manage_org_members',
  MANAGE_USERS = 'manage_users',
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_AUDIT = 'view_audit',
  PLATFORM_SETTINGS = 'platform_settings',
  VIEW_ASSETS = 'view_assets',
  MANAGE_ASSETS = 'manage_assets',
  VIEW_VULNERABILITIES = 'view_vulnerabilities',
  MANAGE_VULNERABILITIES = 'manage_vulnerabilities',
  VIEW_REMEDIATION = 'view_remediation',
  MANAGE_REMEDIATION = 'manage_remediation',
  VIEW_RISK = 'view_risk',
  MANAGE_RISK = 'manage_risk',
}

const PERMISSIONS: Record<PlatformRole, Set<Permission>> = {
  [PlatformRole.SUPER_ADMIN]: new Set(Object.values(Permission)),
  [PlatformRole.SECURITY_ANALYST]: new Set([
    Permission.MANAGE_ORG_MEMBERS,
    Permission.MANAGE_USERS,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_AUDIT,
    Permission.VIEW_ASSETS,
    Permission.VIEW_VULNERABILITIES,
    Permission.MANAGE_VULNERABILITIES,
    Permission.VIEW_REMEDIATION,
    Permission.MANAGE_REMEDIATION,
    Permission.VIEW_RISK,
    Permission.MANAGE_RISK,
  ]),
  [PlatformRole.IT_ADMINISTRATOR]: new Set([
    Permission.MANAGE_USERS,
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ASSETS,
    Permission.MANAGE_ASSETS,
    Permission.VIEW_VULNERABILITIES,
    Permission.VIEW_REMEDIATION,
    Permission.MANAGE_REMEDIATION,
    Permission.VIEW_RISK,
  ]),
  [PlatformRole.EXECUTIVE_MANAGER]: new Set([
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ASSETS,
    Permission.VIEW_VULNERABILITIES,
    Permission.VIEW_REMEDIATION,
    Permission.VIEW_RISK,
  ]),
};

export function getEffectiveRole(req: Request): PlatformRole | null {
  if (req.user?.platformRole === PlatformRole.SUPER_ADMIN) {
    return PlatformRole.SUPER_ADMIN;
  }
  return req.member?.role ?? req.user?.platformRole ?? null;
}

function hasPermission(role: PlatformRole, permission: Permission): boolean {
  return PERMISSIONS[role]?.has(permission) ?? false;
}

export function hasAnyPermission(role: PlatformRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = getEffectiveRole(req);
    if (!role || !hasAnyPermission(role, permissions)) {
      next(forbidden());
      return;
    }
    next();
  };
}

export function requirePlatformRoles(...roles: PlatformRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = getEffectiveRole(req);
    if (!role || !roles.includes(role)) {
      next(forbidden());
      return;
    }
    next();
  };
}

export function requireSuperAdmin() {
  return requirePermission(Permission.MANAGE_ORGANIZATIONS);
}

export const canViewAssets = [
  Permission.VIEW_ASSETS,
  Permission.MANAGE_ASSETS,
] as const;

export const canManageAssets = [Permission.MANAGE_ASSETS] as const;

export const canViewVulns = [
  Permission.VIEW_VULNERABILITIES,
  Permission.MANAGE_VULNERABILITIES,
] as const;

export const canManageVulns = [Permission.MANAGE_VULNERABILITIES] as const;

export const canViewRemediation = [
  Permission.VIEW_REMEDIATION,
  Permission.MANAGE_REMEDIATION,
] as const;

export const canManageRemediation = [Permission.MANAGE_REMEDIATION] as const;

export const canViewRisk = [Permission.VIEW_RISK, Permission.MANAGE_RISK] as const;

export const canManageRisk = [Permission.MANAGE_RISK] as const;
