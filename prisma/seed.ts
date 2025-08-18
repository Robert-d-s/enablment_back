import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting seed...');

  // Create Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: '$2b$10$rOJ1/8U4vvgJE4H6Kj6qg.8dK7V5N2yGM9Qf3L1zX8Kf7mP2wR5vN',
      role: 'ADMIN',
      tokenVersion: 1,
    },
  });

  const enablerUser = await prisma.user.upsert({
    where: { email: 'enabler@company.com' },
    update: {},
    create: {
      email: 'enabler@company.com',
      password: '$2b$10$aokhbvl1KSNSMUtxcQhD9Oo5eqnCKQuZkHrQ.M6l80.6YEI8gfhVm',
      role: 'ENABLER',
      tokenVersion: 1,
    },
  });

  const collaboratorUser = await prisma.user.upsert({
    where: { email: 'developer@company.com' },
    update: {},
    create: {
      email: 'developer@company.com',
      password: '$2b$10$aokhbvl1KSNSMUtxcQhD9Oo5eqnCKQuZkHrQ.M6l80.6YEI8gfhVm',
      role: 'COLLABORATOR',
      tokenVersion: 1,
    },
  });

  const designerUser = await prisma.user.upsert({
    where: { email: 'designer@company.com' },
    update: {},
    create: {
      email: 'designer@company.com',
      password: '$2b$10$aokhbvl1KSNSMUtxcQhD9Oo5eqnCKQuZkHrQ.M6l80.6YEI8gfhVm',
      role: 'COLLABORATOR',
      tokenVersion: 1,
    },
  });

  console.log('👥 Created users');

  // Create Teams
  const developmentTeam = await prisma.team.upsert({
    where: { id: 'dev-team-001' },
    update: {},
    create: {
      id: 'dev-team-001',
      name: 'Development Team',
    },
  });

  const designTeam = await prisma.team.upsert({
    where: { id: 'design-team-001' },
    update: {},
    create: {
      id: 'design-team-001',
      name: 'Design Team',
    },
  });

  const productTeam = await prisma.team.upsert({
    where: { id: 'product-team-001' },
    update: {},
    create: {
      id: 'product-team-001',
      name: 'Product Team',
    },
  });

  console.log('🏢 Created teams');

  // Associate Users with Teams
  await prisma.userTeam.createMany({
    data: [
      { userId: adminUser.id, teamId: developmentTeam.id },
      { userId: adminUser.id, teamId: designTeam.id },
      { userId: adminUser.id, teamId: productTeam.id },
      { userId: enablerUser.id, teamId: developmentTeam.id },
      { userId: enablerUser.id, teamId: productTeam.id },
      { userId: collaboratorUser.id, teamId: developmentTeam.id },
      { userId: designerUser.id, teamId: designTeam.id },
    ],
    skipDuplicates: true,
  });

  console.log('🔗 Associated users with teams');

  // Create Rates for each team
  await prisma.rate.createMany({
    data: [
      // Development Team rates
      {
        name: 'Senior Full-Stack Developer',
        teamId: developmentTeam.id,
        rate: new Decimal(950.0),
      },
      {
        name: 'Mid-Level Developer',
        teamId: developmentTeam.id,
        rate: new Decimal(750.0),
      },
      {
        name: 'Junior Developer',
        teamId: developmentTeam.id,
        rate: new Decimal(550.0),
      },
      {
        name: 'DevOps Engineer',
        teamId: developmentTeam.id,
        rate: new Decimal(850.0),
      },
      {
        name: 'QA Engineer',
        teamId: developmentTeam.id,
        rate: new Decimal(650.0),
      },

      // Design Team rates
      {
        name: 'Senior UX/UI Designer',
        teamId: designTeam.id,
        rate: new Decimal(800.0),
      },
      {
        name: 'Graphic Designer',
        teamId: designTeam.id,
        rate: new Decimal(600.0),
      },
      {
        name: 'UX Researcher',
        teamId: designTeam.id,
        rate: new Decimal(750.0),
      },

      // Product Team rates
      {
        name: 'Product Manager',
        teamId: productTeam.id,
        rate: new Decimal(900.0),
      },
      {
        name: 'Business Analyst',
        teamId: productTeam.id,
        rate: new Decimal(700.0),
      },
      {
        name: 'Project Coordinator',
        teamId: productTeam.id,
        rate: new Decimal(500.0),
      },
    ],
    skipDuplicates: true,
  });

  console.log('💰 Created rates');

  // Create Projects
  const ecommerceProject = await prisma.project.upsert({
    where: { id: 'ecommerce-platform-2025' },
    update: {},
    create: {
      id: 'ecommerce-platform-2025',
      name: 'E-commerce Platform Redesign',
      teamId: developmentTeam.id,
      createdAt: '2025-01-15T08:00:00.000Z',
      updatedAt: '2025-08-01T12:00:00.000Z',
      description:
        'Complete redesign of the e-commerce platform with modern UI/UX',
      state: 'started',
      startDate: '2025-01-15',
      targetDate: '2025-12-31',
    },
  });

  const mobileAppProject = await prisma.project.upsert({
    where: { id: 'mobile-app-v2' },
    update: {},
    create: {
      id: 'mobile-app-v2',
      name: 'Mobile App Version 2.0',
      teamId: developmentTeam.id,
      createdAt: '2025-02-01T08:00:00.000Z',
      updatedAt: '2025-08-01T12:00:00.000Z',
      description: 'Next generation mobile application with enhanced features',
      state: 'planned',
      startDate: '2025-09-01',
      targetDate: '2026-03-31',
    },
  });

  const designSystemProject = await prisma.project.upsert({
    where: { id: 'design-system-2025' },
    update: {},
    create: {
      id: 'design-system-2025',
      name: 'Company Design System',
      teamId: designTeam.id,
      createdAt: '2025-01-10T08:00:00.000Z',
      updatedAt: '2025-08-01T12:00:00.000Z',
      description: 'Comprehensive design system for all company products',
      state: 'started',
      startDate: '2025-01-10',
      targetDate: '2025-10-31',
    },
  });

  await prisma.project.upsert({
    where: { id: 'marketing-website-refresh' },
    update: {},
    create: {
      id: 'marketing-website-refresh',
      name: 'Marketing Website Refresh',
      teamId: productTeam.id,
      createdAt: '2025-03-01T08:00:00.000Z',
      updatedAt: '2025-08-01T12:00:00.000Z',
      description: 'Updated marketing website with improved conversion rates',
      state: 'backlog',
      startDate: null,
      targetDate: '2025-11-30',
    },
  });

  const dataAnalyticsProject = await prisma.project.upsert({
    where: { id: 'data-analytics-dashboard' },
    update: {},
    create: {
      id: 'data-analytics-dashboard',
      name: 'Analytics Dashboard',
      teamId: developmentTeam.id,
      createdAt: '2024-11-15T08:00:00.000Z',
      updatedAt: '2025-07-20T12:00:00.000Z',
      description: 'Real-time analytics dashboard for business intelligence',
      state: 'completed',
      startDate: '2024-11-15',
      targetDate: '2025-07-15',
    },
  });

  console.log('📋 Created projects');

  // Create Issues
  const issues = [
    // E-commerce Platform Issues
    {
      id: 'ecom-001',
      title: 'Implement user authentication system',
      createdAt: '2025-01-20T10:00:00.000Z',
      updatedAt: '2025-07-15T14:30:00.000Z',
      projectId: ecommerceProject.id,
      priorityLabel: 'High',
      identifier: 'ECOM-1',
      assigneeName: 'developer@company.com',
      projectName: ecommerceProject.name,
      state: 'In Progress',
      teamKey: developmentTeam.id,
      teamName: developmentTeam.name,
      dueDate: '2025-08-15',
    },
    {
      id: 'ecom-002',
      title: 'Design product catalog interface',
      createdAt: '2025-01-25T09:00:00.000Z',
      updatedAt: '2025-07-20T16:00:00.000Z',
      projectId: ecommerceProject.id,
      priorityLabel: 'Medium',
      identifier: 'ECOM-2',
      assigneeName: 'designer@company.com',
      projectName: ecommerceProject.name,
      state: 'In Progress',
      teamKey: developmentTeam.id,
      teamName: developmentTeam.name,
      dueDate: '2025-08-30',
    },
    {
      id: 'ecom-003',
      title: 'Implement shopping cart functionality',
      createdAt: '2025-02-01T11:00:00.000Z',
      updatedAt: '2025-06-10T12:00:00.000Z',
      projectId: ecommerceProject.id,
      priorityLabel: 'High',
      identifier: 'ECOM-3',
      assigneeName: 'developer@company.com',
      projectName: ecommerceProject.name,
      state: 'Done',
      teamKey: developmentTeam.id,
      teamName: developmentTeam.name,
      dueDate: null,
    },
    {
      id: 'ecom-004',
      title: 'Set up payment gateway integration',
      createdAt: '2025-02-10T08:30:00.000Z',
      updatedAt: '2025-07-25T10:00:00.000Z',
      projectId: ecommerceProject.id,
      priorityLabel: 'Urgent',
      identifier: 'ECOM-4',
      assigneeName: 'enabler@company.com',
      projectName: ecommerceProject.name,
      state: 'Todo',
      teamKey: developmentTeam.id,
      teamName: developmentTeam.name,
      dueDate: '2025-09-01',
    },

    // Mobile App Issues
    {
      id: 'mobile-001',
      title: 'Research native vs hybrid development',
      createdAt: '2025-02-15T14:00:00.000Z',
      updatedAt: '2025-03-10T09:00:00.000Z',
      projectId: mobileAppProject.id,
      priorityLabel: 'High',
      identifier: 'MOB-1',
      assigneeName: 'enabler@company.com',
      projectName: mobileAppProject.name,
      state: 'Done',
      teamKey: developmentTeam.id,
      teamName: developmentTeam.name,
      dueDate: null,
    },
    {
      id: 'mobile-002',
      title: 'Create wireframes for main user flows',
      createdAt: '2025-02-20T10:00:00.000Z',
      updatedAt: '2025-07-30T15:00:00.000Z',
      projectId: mobileAppProject.id,
      priorityLabel: 'Medium',
      identifier: 'MOB-2',
      assigneeName: 'designer@company.com',
      projectName: mobileAppProject.name,
      state: 'Backlog',
      teamKey: developmentTeam.id,
      teamName: developmentTeam.name,
      dueDate: '2025-08-31',
    },

    // Design System Issues
    {
      id: 'design-001',
      title: 'Define color palette and typography',
      createdAt: '2025-01-12T09:00:00.000Z',
      updatedAt: '2025-03-15T11:00:00.000Z',
      projectId: designSystemProject.id,
      priorityLabel: 'High',
      identifier: 'DS-1',
      assigneeName: 'designer@company.com',
      projectName: designSystemProject.name,
      state: 'Done',
      teamKey: designTeam.id,
      teamName: designTeam.name,
      dueDate: null,
    },
    {
      id: 'design-002',
      title: 'Create component library documentation',
      createdAt: '2025-01-20T13:00:00.000Z',
      updatedAt: '2025-07-28T14:00:00.000Z',
      projectId: designSystemProject.id,
      priorityLabel: 'Medium',
      identifier: 'DS-2',
      assigneeName: 'designer@company.com',
      projectName: designSystemProject.name,
      state: 'In Progress',
      teamKey: designTeam.id,
      teamName: designTeam.name,
      dueDate: '2025-09-15',
    },

    // Analytics Dashboard Issues (Completed project)
    {
      id: 'analytics-001',
      title: 'Design dashboard layout and navigation',
      createdAt: '2024-11-20T08:00:00.000Z',
      updatedAt: '2025-01-15T12:00:00.000Z',
      projectId: dataAnalyticsProject.id,
      priorityLabel: 'High',
      identifier: 'ANA-1',
      assigneeName: 'designer@company.com',
      projectName: dataAnalyticsProject.name,
      state: 'Done',
      teamKey: developmentTeam.id,
      teamName: developmentTeam.name,
      dueDate: null,
    },
    {
      id: 'analytics-002',
      title: 'Implement real-time data visualization',
      createdAt: '2024-12-01T10:00:00.000Z',
      updatedAt: '2025-07-10T16:00:00.000Z',
      projectId: dataAnalyticsProject.id,
      priorityLabel: 'High',
      identifier: 'ANA-2',
      assigneeName: 'developer@company.com',
      projectName: dataAnalyticsProject.name,
      state: 'Done',
      teamKey: developmentTeam.id,
      teamName: developmentTeam.name,
      dueDate: null,
    },
  ];

  await prisma.issue.createMany({
    data: issues,
    skipDuplicates: true,
  });

  console.log('🎯 Created issues');

  // Create Labels for issues
  const labels = [
    // Frontend labels
    {
      id: 'frontend-001',
      color: '#4cb782',
      name: 'Frontend',
      issueId: 'ecom-002',
    },
    {
      id: 'frontend-002',
      color: '#4cb782',
      name: 'Frontend',
      issueId: 'mobile-002',
    },

    // Backend labels
    {
      id: 'backend-001',
      color: '#5e6ad2',
      name: 'Backend',
      issueId: 'ecom-001',
    },
    {
      id: 'backend-002',
      color: '#5e6ad2',
      name: 'Backend',
      issueId: 'ecom-003',
    },
    {
      id: 'backend-003',
      color: '#5e6ad2',
      name: 'Backend',
      issueId: 'ecom-004',
    },
    {
      id: 'backend-004',
      color: '#5e6ad2',
      name: 'Backend',
      issueId: 'analytics-002',
    },

    // Design labels
    { id: 'design-001', color: '#f7c8c1', name: 'Design', issueId: 'ecom-002' },
    {
      id: 'design-002',
      color: '#f7c8c1',
      name: 'Design',
      issueId: 'mobile-002',
    },
    {
      id: 'design-003',
      color: '#f7c8c1',
      name: 'Design',
      issueId: 'design-001',
    },
    {
      id: 'design-004',
      color: '#f7c8c1',
      name: 'Design',
      issueId: 'design-002',
    },
    {
      id: 'design-005',
      color: '#f7c8c1',
      name: 'Design',
      issueId: 'analytics-001',
    },

    // Feature labels
    {
      id: 'feature-001',
      color: '#BB87FC',
      name: 'Feature',
      issueId: 'ecom-001',
    },
    {
      id: 'feature-002',
      color: '#BB87FC',
      name: 'Feature',
      issueId: 'ecom-003',
    },
    {
      id: 'feature-003',
      color: '#BB87FC',
      name: 'Feature',
      issueId: 'mobile-001',
    },
    {
      id: 'feature-004',
      color: '#BB87FC',
      name: 'Feature',
      issueId: 'analytics-002',
    },

    // Bug labels
    { id: 'bug-001', color: '#EB5757', name: 'Bug', issueId: 'ecom-004' },

    // Research labels
    {
      id: 'research-001',
      color: '#95a2b3',
      name: 'Research',
      issueId: 'mobile-001',
    },

    // Documentation labels
    {
      id: 'docs-001',
      color: '#f2994a',
      name: 'Documentation',
      issueId: 'design-002',
    },
  ];

  await prisma.label.createMany({
    data: labels,
    skipDuplicates: true,
  });

  console.log('🏷️ Created labels');

  // Create some Time tracking entries
  const timeEntries = [
    {
      startTime: new Date('2025-07-28T09:00:00.000Z'),
      endTime: new Date('2025-07-28T17:00:00.000Z'),
      userId: collaboratorUser.id,
      projectId: ecommerceProject.id,
      rateId: 3, // Junior Developer rate
      totalElapsedTime: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
    },
    {
      startTime: new Date('2025-07-29T10:00:00.000Z'),
      endTime: new Date('2025-07-29T15:00:00.000Z'),
      userId: designerUser.id,
      projectId: designSystemProject.id,
      rateId: 6, // Senior UX/UI Designer rate
      totalElapsedTime: 5 * 60 * 60 * 1000, // 5 hours in milliseconds
    },
    {
      startTime: new Date('2025-07-30T08:30:00.000Z'),
      endTime: new Date('2025-07-30T16:30:00.000Z'),
      userId: enablerUser.id,
      projectId: ecommerceProject.id,
      rateId: 2, // Mid-Level Developer rate
      totalElapsedTime: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
    },
    {
      startTime: new Date('2025-07-31T09:00:00.000Z'),
      endTime: new Date('2025-07-31T12:00:00.000Z'),
      userId: adminUser.id,
      projectId: dataAnalyticsProject.id,
      rateId: 1, // Senior Full-Stack Developer rate
      totalElapsedTime: 3 * 60 * 60 * 1000, // 3 hours in milliseconds
    },
  ];

  await prisma.time.createMany({
    data: timeEntries,
    skipDuplicates: true,
  });

  console.log('⏰ Created time tracking entries');

  console.log('✅ Seed completed successfully!');
  console.log('📊 Created:');
  console.log('  - 4 Users (Admin, Enabler, 2 Collaborators)');
  console.log('  - 3 Teams (Development, Design, Product)');
  console.log('  - 11 Rate types across teams');
  console.log('  - 5 Projects (various states)');
  console.log('  - 10 Issues with realistic workflows');
  console.log('  - 17 Labels categorizing issues');
  console.log('  - 4 Time tracking entries');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
