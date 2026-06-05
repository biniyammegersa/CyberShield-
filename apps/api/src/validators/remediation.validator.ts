import { z } from 'zod';
import { RemediationStatus } from '@prisma/client';

export const listRemediationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(RemediationStatus).optional(),
  assignedToId: z.string().optional(),
});

export const updateRemediationSchema = z.object({
  status: z.nativeEnum(RemediationStatus).optional(),
  assignedToId: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000),
});
