import { z } from 'zod';
import { AssetStatus, AssetType, Criticality } from '@prisma/client';

export const listAssetsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  assetType: z.nativeEnum(AssetType).optional(),
  criticality: z.nativeEnum(Criticality).optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  search: z.string().optional(),
  internetFacing: z.coerce.boolean().optional(),
});

export const createAssetSchema = z.object({
  name: z.string().min(1).max(200),
  hostname: z.string().max(255).optional(),
  ipAddress: z.string().max(45).optional(),
  assetType: z.nativeEnum(AssetType),
  operatingSystem: z.string().max(200).optional(),
  owner: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  criticality: z.nativeEnum(Criticality).default(Criticality.MEDIUM),
  status: z.nativeEnum(AssetStatus).default(AssetStatus.ACTIVE),
  isInternetFacing: z.boolean().default(false),
});

export const updateAssetSchema = createAssetSchema.partial();

export const createServiceSchema = z.object({
  port: z.number().int().min(1).max(65535),
  protocol: z.string().min(1).max(20),
  service: z.string().max(100).optional(),
  version: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
});
