# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Running
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run start:dev` - Start development server with watch mode
- `npm run start:debug` - Start server in debug mode

### Code Quality
- `npm run lint` - Run ESLint with auto-fix (uses modern flat config format)
- `npm run format` - Format code with Prettier
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage report
- `npm run test:e2e` - Run end-to-end tests

### Database Operations
- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma migrate dev` - Create and apply migrations in development
- `npx prisma studio` - Open Prisma Studio GUI
- `npm run db:seed` - Seed database with initial data

## Architecture Overview

This is a **NestJS GraphQL API** for time tracking with Linear integration. The application follows a modular architecture with clear separation of concerns.

### Core Technologies
- **Framework**: NestJS with Express
- **API**: GraphQL with Apollo Server
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Real-time**: WebSocket for issue updates
- **Logging**: Pino logger with structured logging

### Module Structure

#### Authentication (`src/auth/`)
- JWT-based authentication with refresh tokens and blacklisting
- Role-based authorization (ADMIN, ENABLER, COLLABORATOR, PENDING)
- Token versioning for role changes
- JWT caching service for performance

#### User Management (`src/user/`)
- Separated resolvers for different concerns (projects, teams, role management)
- User security service for sensitive operations
- Custom exceptions for specific error scenarios

#### Project Management (`src/project/`)
- **ProjectService**: Read-only operations for GraphQL API
- **ProjectSyncService**: Internal sync operations for database synchronization
- Comprehensive input validation and error handling
- DataLoader pattern for performance optimization

#### Issue Tracking (`src/issue/`)
- Issue management with Linear integration
- Caching service for performance
- Real-time updates via WebSockets (`src/issue-updates/`)

#### Team Management (`src/team/`)
- Team-based access control
- User-team associations with proper cascading

#### Time Tracking (`src/time/`)
- Time entry management with project and rate associations
- Supports different billing rates per team

#### Webhook Integration (`src/webhook/`)
- Linear webhook processing for real-time synchronization
- HMAC-SHA256 signature validation
- Handles project and issue updates from Linear

### Database Schema

The application uses a MySQL database with the following key entities:
- **User**: Authentication and role management
- **Team**: Organization structure with user associations
- **Project**: Time tracking projects linked to teams
- **Issue**: Linear issues with project associations
- **Time**: Time entries with user, project, and rate references
- **Rate**: Billing rates per team
- **Invoice**: Billing and invoicing functionality

### Key Patterns

#### Service Separation
Services are split by responsibility:
- Public API services for GraphQL operations
- Internal services for synchronization and data processing
- Utility services for caching and validation

#### Error Handling
- Custom exception classes for specific scenarios
- Global exception filters for consistent error responses
- Comprehensive logging with structured data

#### Performance Optimizations
- DataLoader pattern for N+1 query prevention
- Request-scoped caching
- Database indexes for frequently queried fields
- Connection pooling and query optimization

#### Security
- HMAC signature validation for webhooks
- JWT token blacklisting and versioning
- Role-based access control
- Input validation with class-validator

### Environment Variables

Key environment variables to configure:
- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: JWT signing secret
- `WEBHOOK_SECRET`: Linear webhook validation secret
- `PORT`: Server port (default: 8080)
- `LOG_LEVEL`: Logging level (default: info)

## Important Notes

### ESLint Configuration
The project uses the modern ESLint flat config format (`eslint.config.js`). The configuration supports TypeScript with all project-specific rules maintained.

### Database Migrations
Always run `npx prisma generate` after schema changes and create migrations with `npx prisma migrate dev` in development.

### Testing
Use the existing Jest configuration for unit tests. E2E tests are configured in `test/` directory.

### Real-time Features
The application includes WebSocket support for real-time issue updates. Connection management is handled by the `ConnectionManagerService`.

### GraphQL Development
The GraphQL schema is auto-generated. Use the GraphQL playground at `/graphql` for API exploration and testing.