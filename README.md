# Project Time & Issue Tracker - Backend

This is the backend service for the Project Time & Issue Tracker application. It is a robust GraphQL API built with NestJS, providing data management, authentication, and real-time capabilities. The service uses Prisma as its ORM for database interactions and is designed to synchronize data with external services like Linear.

## ✨ Features

-   **GraphQL API**: A comprehensive and strongly-typed API built with Apollo Server.
-   **Authentication**: Secure, JWT-based authentication with access and refresh token rotation.
-   **Role-Based Access Control (RBAC)**: Differentiated user roles (ADMIN, ENABLER, COLLABORATOR, PENDING) to manage permissions.
-   **Database Management**: Uses Prisma for elegant and safe database access with a clear schema definition.
-   **Data Synchronization**: Includes modules for synchronizing teams, projects, and issues from external services.
-   **Real-time Updates**: WebSocket integration to push live issue updates to connected clients.
-   **Webhooks**: Secure webhook endpoint to receive real-time data updates from external services (e.g., Linear).
-   **Security**: Implemented request throttling (rate limiting), GraphQL query depth/complexity limits, and robust validation.
-   **Configuration**: Environment-based configuration with clear validation for required variables.

## 🛠️ Tech Stack

-   **Framework**: [NestJS](https://nestjs.com/)
-   **API**: [GraphQL](https://graphql.org/) with [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
-   **Database ORM**: [Prisma](https://www.prisma.io/)
-   **Database**: [MySQL](https://www.mysql.com/) (but can be configured for PostgreSQL)
-   **Authentication**: [JWT](https://jwt.io/) (JSON Web Tokens)
-   **Real-time**: WebSockets with [Socket.IO](https://socket.io/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)

## 🚀 Getting Started

Follow these instructions to get the backend service running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18.x or later recommended)
-   [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
-   [Docker](https://www.docker.com/) and Docker Compose (for running a local database)
-   [Git](https://git-scm.com/)

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd et-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up the database:**
    A local MySQL database is required. The easiest way to run one is with Docker. Create a `docker-compose.yml` file in the project root:

    ```yaml
    # docker-compose.yml
    version: '3.8'
    services:
      db:
        image: mysql:8.0
        cap_add:
          - SYS_NICE
        restart: always
        environment:
          MYSQL_DATABASE: 'your_db_name'
          MYSQL_USER: 'your_db_user'
          MYSQL_PASSWORD: 'your_db_password'
          MYSQL_ROOT_PASSWORD: 'your_root_password'
        ports:
          - '3306:3306'
        volumes:
          - db_data:/var/lib/mysql

    volumes:
      db_data:
    ```

    Start the database container:
    ```bash
    docker-compose up -d
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file in the project root by copying the example:
    ```bash
    cp .env.example .env
    ```
    Now, open the `.env` file and fill in the required values.

    ```dotenv
    # .env

    # Database Connection
    DATABASE_URL="mysql://your_db_user:your_db_password@localhost:3306/your_db_name"

    # JWT Secrets (generate strong, random strings for these)
    # Use `openssl rand -hex 32` to generate a secret
    JWT_ACCESS_SECRET="<your_strong_32_char_access_secret>"
    JWT_REFRESH_SECRET="<your_strong_32_char_refresh_secret>"

    # Webhook Secret (for verifying incoming webhooks from Linear)
    WEBHOOK_SECRET="<your_webhook_secret>"

    # Optional Configuration
    PORT=8080
    LOG_LEVEL=info
    ```

5.  **Run Database Migrations:**
    Apply the schema to your database using Prisma.
    ```bash
    npx prisma migrate dev
    ```

6.  **Seed the Database:**
    Populate the database with initial data for testing and development.
    ```bash
    npm run db:seed
    ```

7.  **Start the Development Server:**
    ```bash
    npm run start:dev
    ```

The server will be running at `http://localhost:8080`. The GraphQL API is accessible at `http://localhost:8080/graphql`, where you can use tools like Apollo Sandbox for testing queries.

## 📜 Available Scripts

-   `npm run start:dev`: Starts the application in watch mode.
-   `npm run build`: Compiles the TypeScript source code.
-   `npm start`: Starts the application from the compiled build.
-   `npm run lint`: Lints the codebase.
-   `npm test`: Runs unit tests.
-   `npm run test:e2e`: Runs end-to-end tests.
-   `npm run db:seed`: Seeds the database with initial data.
-   `npx prisma migrate dev`: Applies database migrations.

## 🔑 Environment Variables

The application requires the following environment variables to be set in a `.env` file:

| Variable               | Description                                                                 | Example                                                   |
| ---------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| `DATABASE_URL`         | **Required.** The connection string for your database.                      | `"mysql://user:pass@host:port/db"`                        |
| `JWT_ACCESS_SECRET`    | **Required.** A strong secret for signing JWT access tokens (min 32 chars). | `"your_super_secret_for_access_tokens"`                   |
| `JWT_REFRESH_SECRET`   | **Required.** A strong secret for signing JWT refresh tokens (min 32 chars).| `"your_other_super_secret_for_refresh_tokens"`            |
| `WEBHOOK_SECRET`       | **Required.** A secret to verify incoming webhooks (min 16 chars).          | `"secret_from_linear_webhook_config"`                     |
| `PORT`                 | _Optional._ The port the server will run on.                                | `8080` (default)                                          |
| `LOG_LEVEL`            | _Optional._ The logging level for Pino logger.                              | `info` (default)                                          |
