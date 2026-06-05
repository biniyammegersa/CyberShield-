import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../.env') });

import {
  AssetType,
  Criticality,
  PlatformRole,
  PrismaClient,
  RemediationStatus,
  Severity,
  UserStatus,
  VulnerabilityStatus,
} from '@prisma/client';
import { calculateRiskScore } from '../src/utils/risk.engine';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('CyberShield123!', 12);

  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      domain: 'acme.example.com',
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@cybershield.local' },
    update: {},
    create: {
      email: 'admin@cybershield.local',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      status: UserStatus.ACTIVE,
      platformRole: PlatformRole.SUPER_ADMIN,
      emailVerifiedAt: new Date(),
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@acme.local' },
    update: {},
    create: {
      email: 'analyst@acme.local',
      passwordHash,
      firstName: 'Security',
      lastName: 'Analyst',
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  const itAdmin = await prisma.user.upsert({
    where: { email: 'itadmin@acme.local' },
    update: {},
    create: {
      email: 'itadmin@acme.local',
      passwordHash,
      firstName: 'IT',
      lastName: 'Administrator',
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  const executive = await prisma.user.upsert({
    where: { email: 'executive@acme.local' },
    update: {},
    create: {
      email: 'executive@acme.local',
      passwordHash,
      firstName: 'Executive',
      lastName: 'Manager',
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  const members = [
    { userId: superAdmin.id, role: PlatformRole.SUPER_ADMIN },
    { userId: analyst.id, role: PlatformRole.SECURITY_ANALYST },
    { userId: itAdmin.id, role: PlatformRole.IT_ADMINISTRATOR },
    { userId: executive.id, role: PlatformRole.EXECUTIVE_MANAGER },
  ];

  for (const m of members) {
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: { organizationId: org.id, userId: m.userId },
      },
      update: { role: m.role },
      create: {
        organizationId: org.id,
        userId: m.userId,
        role: m.role,
      },
    });
  }

  // Phase 2 sample data
  await prisma.vulnerabilityAsset.deleteMany({
    where: { vulnerability: { organizationId: org.id } },
  });
  await prisma.remediationTask.deleteMany({
    where: { vulnerability: { organizationId: org.id } },
  });
  await prisma.vulnerability.deleteMany({ where: { organizationId: org.id } });
  await prisma.assetService.deleteMany({ where: { asset: { organizationId: org.id } } });
  await prisma.asset.deleteMany({ where: { organizationId: org.id } });
  await prisma.postureSnapshot.deleteMany({ where: { organizationId: org.id } });

  const webServer = await prisma.asset.create({
    data: {
      organizationId: org.id,
      name: 'Production Web Server',
      hostname: 'web-prod-01.acme.local',
      ipAddress: '10.0.1.10',
      assetType: AssetType.SERVER,
      operatingSystem: 'Ubuntu 22.04',
      owner: 'Platform Team',
      location: 'DC-East',
      criticality: Criticality.CRITICAL,
      isInternetFacing: true,
    },
  });

  const dbServer = await prisma.asset.create({
    data: {
      organizationId: org.id,
      name: 'Customer Database',
      hostname: 'db-prod-01.acme.local',
      ipAddress: '10.0.1.20',
      assetType: AssetType.DATABASE,
      operatingSystem: 'PostgreSQL 16',
      owner: 'Data Team',
      location: 'DC-East',
      criticality: Criticality.CRITICAL,
    },
  });

  const workstation = await prisma.asset.create({
    data: {
      organizationId: org.id,
      name: 'Finance Workstation',
      hostname: 'fin-ws-04.acme.local',
      ipAddress: '10.0.2.45',
      assetType: AssetType.WORKSTATION,
      operatingSystem: 'Windows 11',
      criticality: Criticality.MEDIUM,
    },
  });

  await prisma.assetService.createMany({
    data: [
      { assetId: webServer.id, port: 443, protocol: 'tcp', service: 'https', state: 'open' },
      { assetId: webServer.id, port: 80, protocol: 'tcp', service: 'http', state: 'open' },
      { assetId: webServer.id, port: 22, protocol: 'tcp', service: 'ssh', state: 'open' },
      { assetId: dbServer.id, port: 5432, protocol: 'tcp', service: 'postgresql', state: 'open' },
    ],
  });

  const vulns = [
    {
      title: 'Apache Log4j Remote Code Execution',
      description: 'CVE-2021-44228 Log4Shell vulnerability in logging component.',
      severity: Severity.CRITICAL,
      cvssScore: 10.0,
      cveId: 'CVE-2021-44228',
      likelihood: 5,
      impact: 5,
      assetIds: [webServer.id],
      remediationStatus: RemediationStatus.IN_PROGRESS,
      assignedToId: analyst.id,
    },
    {
      title: 'OpenSSH Weak Key Exchange',
      description: 'SSH server supports weak key exchange algorithms.',
      severity: Severity.HIGH,
      cvssScore: 7.5,
      cveId: 'CVE-2023-38408',
      likelihood: 3,
      impact: 4,
      assetIds: [webServer.id],
      remediationStatus: RemediationStatus.ASSIGNED,
      assignedToId: itAdmin.id,
    },
    {
      title: 'PostgreSQL Default Credentials Risk',
      description: 'Database may be configured with weak authentication.',
      severity: Severity.MEDIUM,
      cvssScore: 5.5,
      likelihood: 2,
      impact: 4,
      assetIds: [dbServer.id],
      remediationStatus: RemediationStatus.OPEN,
    },
    {
      title: 'Outdated Windows Security Patches',
      description: 'Missing cumulative security updates from last quarter.',
      severity: Severity.HIGH,
      cvssScore: 8.1,
      cveId: 'CVE-2024-30088',
      likelihood: 4,
      impact: 3,
      assetIds: [workstation.id],
      remediationStatus: RemediationStatus.OPEN,
    },
    {
      title: 'SSL Certificate Expiring Soon',
      description: 'TLS certificate expires within 14 days.',
      severity: Severity.LOW,
      cvssScore: 3.1,
      likelihood: 2,
      impact: 2,
      assetIds: [webServer.id],
      remediationStatus: RemediationStatus.RESOLVED,
    },
  ];

  for (const v of vulns) {
    const { assetIds, remediationStatus, assignedToId, ...vulnData } = v;
    const vuln = await prisma.vulnerability.create({
      data: {
        ...vulnData,
        organizationId: org.id,
        discoveryDate: new Date(Date.now() - Math.random() * 30 * 86400000),
        status:
          remediationStatus === RemediationStatus.RESOLVED
            ? VulnerabilityStatus.MITIGATED
            : VulnerabilityStatus.OPEN,
      },
    });

    for (const assetId of assetIds) {
      const asset = await prisma.asset.findUnique({ where: { id: assetId } });
      if (asset) {
        await prisma.vulnerabilityAsset.create({
          data: {
            vulnerabilityId: vuln.id,
            assetId,
            riskScore: calculateRiskScore(vuln.severity, asset.criticality),
          },
        });
      }
    }

    await prisma.remediationTask.create({
      data: {
        vulnerabilityId: vuln.id,
        status: remediationStatus,
        assignedToId,
        dueDate: new Date(Date.now() + 14 * 86400000),
        ...(remediationStatus === RemediationStatus.RESOLVED && {
          completedAt: new Date(),
        }),
      },
    });
  }

  const openVulns = await prisma.vulnerability.findMany({
    where: { organizationId: org.id, status: VulnerabilityStatus.OPEN },
    include: { affectedAssets: true },
  });
  let exposure = 0;
  let criticalCount = 0;
  for (const vuln of openVulns) {
    if (vuln.severity === Severity.CRITICAL) criticalCount++;
    for (const link of vuln.affectedAssets) {
      exposure += link.riskScore ?? 0;
    }
  }

  await prisma.postureSnapshot.create({
    data: {
      organizationId: org.id,
      score: 68.5,
      openCount: openVulns.length,
      criticalCount,
      metadata: { exposure, seeded: true },
    },
  });

  console.log('Seed complete:');
  console.log(`  Sample assets: 3, vulnerabilities: ${vulns.length}`);
  console.log('  Super Admin: admin@cybershield.local / CyberShield123!');
  console.log('  Analyst:     analyst@acme.local / CyberShield123!');
  console.log('  IT Admin:    itadmin@acme.local / CyberShield123!');
  console.log('  Executive:   executive@acme.local / CyberShield123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
