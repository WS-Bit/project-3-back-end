# Melody Memo - Backend

## Introduction

Melody Memo is a full-stack web application that allows users to manage and review music releases. This README focuses on the backend portion of the project, which is built with Express.js and MongoDB.

## Table of Contents

1. [Technologies Used](#technologies-used)
2. [Project Structure](#project-structure)
3. [Setup and Installation](#setup-and-installation)
4. [API Endpoints](#api-endpoints)
5. [Authentication and Authorization](#authentication-and-authorization)
6. [Database Models](#database-models)
7. [Error Handling](#error-handling)
8. [Email Functionality](#email-functionality)

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for authentication
- bcrypt for password hashing
- dotenv for environment variable management
- SendGrid for email functionality
- Express Mongo Sanitize for security

## Project Structure

The backend is organized into several key directories:

- `config/`: Contains configuration files, including the router setup.
- `controllers/`: Holds the logic for handling different API routes.
- `models/`: Defines the MongoDB schemas for the application.
- `errors/`: Contains custom error handling logic.
- `utils/`: Includes utility functions, such as email sending capabilities.

## Setup and Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory and add the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_TEMPLATE_ID=your_sendgrid_template_id
   SENDGRID_CONFIRMATION_TEMPLATE_ID=your_sendgrid_confirmation_template_id
   ```
5. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

The backend provides the following main API endpoints:

- `/api/signup`: User registration
- `/api/login`: User authentication
- `/api/artists`: CRUD operations for artists
- `/api/releases`: CRUD operations for music releases
- `/api/releases/:releaseId/reviews`: CRUD operations for reviews
- `/api/user`: User profile and favorite management

For detailed information on each endpoint, please refer to the individual controller files in the `controllers/` directory.

## Authentication and Authorization

The application uses JSON Web Tokens (JWT) for authentication. The `secureRoute` middleware in `secureRoute.ts` handles token verification for protected routes.

## Database Models

The application uses the following main MongoDB models:

- User: Stores user information and authentication details
- Artist: Represents music artists
- Release: Represents music releases (albums, singles, etc.)
- Review: Stores user reviews for releases

Each model is defined in its respective file in the `models/` directory.

## Error Handling

Custom error handling is implemented to provide clear and consistent error messages across the application. The `errors/validation.ts` file contains logic for formatting validation errors.

## Email Functionality

The application uses SendGrid for sending emails, such as password reset links and email confirmation. The email sending logic is encapsulated in the `utils/sendEmail.ts` file.

---

