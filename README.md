# PROJECT NAME :  Training Facility Backend Api

## DESCRIPTION

- This project is designed to help training facilities manage their business. It helps make management efficient by eliminating miscellaneous processes in the documenting procedures involved in the management of the facility such as registering a member or recording a member's sessions. 
- Training Facility Management API is a backend system designed to help the management of training facilities. It provides a structured way to handle everyday complex operations, reducing manual administrative work, reducing the chance of errors and minimizing reliance on paper-based record keeping.
The system supports essential management operations, including member registration and management, membership plans and subscriptions, payment tracking, and session management. It also provides role-based access control to ensure that users and staff can only access operations permitted by their roles while only giving full access to admins.
Built with a focus on organization, maintainability, and secure data handling, the API provides a foundation for managing training facility operations efficiently and can be integrated with a frontend application.

## Features

### Authentication & Authorization
  - User registration and login.
  - Google OAuth 2.0 authentication.
  - JWT-based authentication with access and refresh tokens.
  - Session management, including token refresh and logout.
  - Role-based access control (RBAC) and permission-based access control (PBAC).

### User Management
  - Member registration and profile management, including password changes..
  - User retrieval and management by administrators.
  - Role assignment and management.
  - Profile avatar upload and removal.

### Membership & Subscription Management
  - Membership plan creation and price management.
  - Multiple subscription durations.
  - Subscription creation, retrieval, updating, and cancellation.
  - Subscription status tracking.

### Facility Management
  - Facility creation, retrieval, and management.
  - Support for different facility types.
  - Plan-based facility access.

### Payment Management
  - Payment creation and tracking.
  - Payment status management.
  - Receipt upload and retrieval.

### Facility Session Management
  - Member session creation and tracking.
  - Session check-in and checkout.
  - Session retrieval and management.

### API Documentation
  - OpenAPI documentation.
  - Interactive Swagger UI for exploring and testing API endpoints.

### AI Support
  - AI-powered support endpoint for handling user requests.


## Technology Stack

- TypeScript: The language used to help with static type checking.
- Node.js: Backend runtime environment for the compiled JavaScript.
- Express.js: Node.js web framework to ease the API building.
- PostgreSQL: For the structured database management.
- Prisma ORM: For database communication with our API.
- Zod: Runtime request validation, query coercion, and TypeScript type inference.
- Bcrypt: For password hashing and verification.
- JWT: Token format used in user Authentication and Authorization.
- Openid-client: For supporting OAuth and OpenID Connect authentication purposes.
- Multer and Supabase: For manageing multipart/form-data and uploads to cloud storage.
- Nodemailer and Resend: For handling emails.  
- Vitest and Supertest: For testing in development.
- Swagger-ui: For interactive project documentation.
- @asteasolutions/zod-to-openapi: For generating OpenAPI schemas from Zod schemas.
- Cookie-parser: For parsing requests and giving access to cookies.
- Cors: For controlling cross-origin access.
- Helmet: For setting http security headers to protect the system.
- @google/genai: For adding an AI support feature.


## Getting Started

### Prerequisites
- Node.js
- npm (included with Node.js)

### Clone the repository

```bash
git clone https://github.com/killshot-0/Training-Facility-Backend-Api
cd Training-Facility-Backend-Api
npm install
```

### Configure Environment Variables

Create a `.env` file in the project root by copying the provided `.env.example` file.

Fill in the required values with your own credentials and configuration.

### Set Up the Database

```bash
npx prisma migrate deploy
npm run seed
npx prisma generate
```
### Running the server

```bash
npm run dev
```


## API Documentation

This project uses Swagger UI and OpenAPI to provide interactive API documentation.

After starting the application, access the documentation at:

http://localhost:5000/api/docs


## Testing

The project uses Vitest and Supertest for automated testing of API endpoints and application functionality.

ONLY RUN TESTS IF THE SCRIPT IN YOUR `package.json` SWITCHES TO THE TEST DATABASE!

Run the test suite using:

```bash
npm test
``` 

## Project Structure

```TEXT
Training-Facility-Backend-Api/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   ├── seed-run.ts
│   └── seed.ts
│
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── multer.ts
│   ├── controllers/
│   │   ├── admin.controller.ts
│   │   ├── ai.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── facility.controller.ts
│   │   ├── oauth.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── plan.controller.ts
│   │   ├── session.controller.ts
│   │   ├── subscription.controller.ts
│   │   └── user.controller.ts
│   ├── docs/
│   │   ├── openapi.ts
│   │   ├── operations.ts
│   │   ├── swagger-autogen.ts
│   │   ├── swagger-output.json
│   │   └── zod-openapi.ts
│   ├── generated/
│   ├── lib/
│   │   ├── ai.ts
│   │   ├── oauth.ts
│   │   ├── prisma.ts
│   │   └── storage.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── ownership.middleware.ts
│   │   ├── permission.middleware.ts
│   │   └── validate.middleware.ts
│   ├── routes/
│   │   ├── admin.routes.ts
│   │   ├── ai.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── facilities.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── plan.routes.ts
│   │   ├── session.routes.ts
│   │   ├── subscription.routes.ts
│   │   └── user.routes.ts
│   ├── schemas/
│   │   ├── admin.schemas.ts
│   │   ├── ai.schemas.ts
│   │   ├── auth.schemas.ts
│   │   ├── env.schemas.ts
│   │   ├── facility.schemas.ts
│   │   ├── file.schemas.ts
│   │   ├── payment.schemas.ts
│   │   ├── plan.schemas.ts
│   │   ├── session.schemas.ts
│   │   ├── subscription.schemas.ts
│   │   └── user.schemas.ts
│   ├── services/
│   │   ├── admin.service.ts
│   │   ├── ai.service.ts
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   ├── facility.service.ts
│   │   ├── oauth.service.ts
│   │   ├── payment.service.ts
│   │   ├── plan.service.ts
│   │   ├── session.service.ts
│   │   ├── subscripton.service.ts
│   │   └── user.service.ts
│   ├── templates/
│   │   └── email.templates.ts
│   ├── types/
│   │   └── express.d.ts
│   ├── utils/
│   │   ├── access-token.ts
│   │   ├── async-handler.ts
│   │   ├── oauth.ts
│   │   ├── password.ts
│   │   └── refresh-token.ts
│   ├── app.ts
│   └── server.ts
│
├── test/
│   ├── helpers/
│   │   └── factory.ts
│   ├── admin.test.ts
│   ├── ai.test.ts
│   ├── auth.test.ts
│   ├── facility.test.ts
│   ├── payment.test.ts
│   ├── plan.test.ts
│   ├── session.test.ts
│   ├── subscription.test.ts
│   └── user.test.ts
│
├── .env.example
├── .gitignore
├── package-lock.json
├── package.json
├── prisma7.config.ts
├── README.md
├── skills-lock.json
└── tsconfig.json
```