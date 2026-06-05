import { z } from 'zod';
import { PlatformRole, UserStatus } from '@prisma/client';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  department: z.string().max(100).optional(),
  role: z.nativeEnum(PlatformRole).optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  department: z.string().max(100).nullable().optional(),
  platformRole: z.nativeEnum(PlatformRole).nullable().optional(),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});
