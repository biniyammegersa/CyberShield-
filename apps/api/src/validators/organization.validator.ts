import { z } from 'zod';
import { PlatformRole } from '@prisma/client';

export const createOrgSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().max(255).optional(),
});

export const updateOrgSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  domain: z.string().max(255).nullable().optional(),
  settings: z.record(z.unknown()).optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(PlatformRole),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(PlatformRole),
});
