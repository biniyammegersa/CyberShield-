import { AssetStatus, AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { notFound } from '../utils/errors';
import { createAuditLog } from './audit.service';
import { recalculateOrganizationRisk } from './risk.service';
import type { z } from 'zod';
import type {
  createAssetSchema,
  createServiceSchema,
  listAssetsQuerySchema,
  updateAssetSchema,
} from '../validators/asset.validator';

type CreateAssetInput = z.infer<typeof createAssetSchema>;
type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
type ListQuery = z.infer<typeof listAssetsQuerySchema>;
type CreateServiceInput = z.infer<typeof createServiceSchema>;

export async function listAssets(organizationId: string, query: ListQuery) {
  const where: Prisma.AssetWhereInput = {
    organizationId,
    deletedAt: null,
    ...(query.assetType && { assetType: query.assetType }),
    ...(query.criticality && { criticality: query.criticality }),
    ...(query.status && { status: query.status }),
    ...(query.internetFacing !== undefined && { isInternetFacing: query.internetFacing }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { hostname: { contains: query.search, mode: 'insensitive' } },
        { ipAddress: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        _count: { select: { vulnerabilityLinks: true, services: true } },
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.asset.count({ where }),
  ]);

  return { items, total, page: query.page, limit: query.limit };
}

export async function getAsset(organizationId: string, id: string) {
  const asset = await prisma.asset.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      services: { orderBy: { port: 'asc' } },
      vulnerabilityLinks: {
        include: {
          vulnerability: {
            select: {
              id: true,
              title: true,
              severity: true,
              status: true,
              cveId: true,
            },
          },
        },
      },
    },
  });
  if (!asset) throw notFound('Asset not found');
  return asset;
}

export async function createAsset(
  organizationId: string,
  data: CreateAssetInput,
  userId: string,
  ip: string,
  userAgent?: string
) {
  const asset = await prisma.asset.create({
    data: { ...data, organizationId },
  });

  await createAuditLog({
    action: AuditAction.ASSET_CREATED,
    userId,
    organizationId,
    resourceType: 'asset',
    resourceId: asset.id,
    ipAddress: ip,
    userAgent,
  });

  return asset;
}

export async function updateAsset(
  organizationId: string,
  id: string,
  data: UpdateAssetInput,
  userId: string,
  ip: string,
  userAgent?: string
) {
  const existing = await prisma.asset.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
  if (!existing) throw notFound('Asset not found');

  const asset = await prisma.asset.update({ where: { id }, data });

  await createAuditLog({
    action: AuditAction.ASSET_UPDATED,
    userId,
    organizationId,
    resourceType: 'asset',
    resourceId: id,
    ipAddress: ip,
    userAgent,
  });

  await recalculateOrganizationRisk(organizationId);
  return asset;
}

export async function deleteAsset(
  organizationId: string,
  id: string,
  userId: string,
  ip: string,
  userAgent?: string
) {
  const existing = await prisma.asset.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
  if (!existing) throw notFound('Asset not found');

  await prisma.asset.update({
    where: { id },
    data: { deletedAt: new Date(), status: AssetStatus.DECOMMISSIONED },
  });

  await createAuditLog({
    action: AuditAction.ASSET_DELETED,
    userId,
    organizationId,
    resourceType: 'asset',
    resourceId: id,
    ipAddress: ip,
    userAgent,
  });

  await recalculateOrganizationRisk(organizationId);
}

export async function addService(
  organizationId: string,
  assetId: string,
  data: CreateServiceInput
) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, organizationId, deletedAt: null },
  });
  if (!asset) throw notFound('Asset not found');

  return prisma.assetService.upsert({
    where: {
      assetId_port_protocol: {
        assetId,
        port: data.port,
        protocol: data.protocol,
      },
    },
    create: { assetId, ...data },
    update: data,
  });
}

export async function getAttackSurface(organizationId: string) {
  const assets = await prisma.asset.findMany({
    where: { organizationId, deletedAt: null, isInternetFacing: true },
    include: {
      services: true,
      vulnerabilityLinks: {
        where: {
          vulnerability: { status: { in: ['OPEN', 'CONFIRMED'] } },
        },
      },
    },
    orderBy: { criticality: 'desc' },
  });

  const openPorts = assets.reduce((sum, a) => sum + a.services.length, 0);
  const exposedServices = assets.flatMap((a) =>
    a.services.map((s) => ({
      assetId: a.id,
      assetName: a.name,
      ipAddress: a.ipAddress,
      port: s.port,
      service: s.service,
      protocol: s.protocol,
    }))
  );

  return {
    internetFacingCount: assets.length,
    openPorts,
    exposedServices,
    criticalSystems: assets.filter((a) => a.criticality === 'CRITICAL').length,
    assets,
  };
}

export async function getAssetVulnerabilities(organizationId: string, assetId: string) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, organizationId, deletedAt: null },
  });
  if (!asset) throw notFound('Asset not found');

  return prisma.vulnerability.findMany({
    where: {
      organizationId,
      affectedAssets: { some: { assetId } },
    },
    include: {
      remediation: { select: { id: true, status: true, dueDate: true } },
    },
    orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
  });
}
