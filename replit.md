# MattressPickupNow - Lead Capture Application

## Overview

MattressPickupNow is a full-stack web application designed to connect emergency mattress buyers with Mattress Firm stores through an automated lead capture and messaging system. The application provides a simple, mobile-first interface for customers to submit their information and receive pre-written messages for contacting stores directly via SMS.

## User Preferences

Preferred communication style: Simple, everyday language.
Design preference: Premium and sleek appearance with icons only - absolutely no emojis.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern React application using functional components and hooks
- **Vite**: Fast build tool for development and production builds
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: Component library built on Radix UI primitives for consistent, accessible components
- **React Hook Form**: Form management with Zod validation for type-safe form handling
- **TanStack Query**: Data fetching and state management for API interactions
- **Wouter**: Lightweight client-side routing

### Backend Architecture
- **Express.js**: Node.js web framework for REST API
- **TypeScript**: Type-safe JavaScript for both client and server
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL support
- **Zod**: Runtime type validation for API endpoints and form data

### Database Strategy
- **PostgreSQL**: Primary database using Neon serverless database
- **Drizzle Kit**: Database migrations and schema management
- **In-memory fallback**: Memory storage implementation for development/testing

## Key Components

### Lead Capture System
The application implements a strategic multi-step lead capture flow focused on the "car revelation":

1. **ZIP Code Entry**: Location-based search with "car-friendly" messaging
2. **The Car Revelation**: Critical psychological breakthrough showing mattresses fit in back seats
3. **Mattress Selection**: Enhanced cards with prominent "fits in car" benefits and trust signals
4. **Contact Information**: Progressive information exchange with value at each step
5. **Store Details & Instructions**: Auto-selected closest store with pickup coordination

### Core Value Proposition
"Premium mattresses in boxes that fit on your back seat - no truck needed." This unique positioning solves the unknown problem most customers have about mattress transportation, creating a competitive moat through the revelation that quality mattresses can fit in any car.

### Store Finder Integration
- **Google Maps Integration**: API endpoint to search for nearby mattress stores
- **Mock Store Data**: Development fallback with realistic store information
- **Store Details**: Distance, ratings, hours, phone numbers, and availability status
- **Premium Display**: Clean, professional store cards with operational status

### Form Validation
- Real-time validation using Zod schemas
- Phone number auto-formatting to (XXX) XXX-XXXX format
- ZIP code validation (5-digit requirement)
- Required field validation with user-friendly error messages

### SMS Integration
- Pre-formatted message generation with customer data
- Copy-to-clipboard functionality
- Direct SMS app launch with pre-populated message and store number
- Lead ID generation for tracking (format: MPN + timestamp)

### UI/UX Features
- Mobile-first responsive design
- Progressive form steps with clear navigation
- Loading states and error handling
- Toast notifications for user feedback
- Accessible components using Radix UI primitives

## Data Flow

1. **Lead Submission**: Customer submits form data through React frontend
2. **Validation**: Server validates data using Zod schemas
3. **Storage**: Lead data stored in PostgreSQL with unique lead ID
4. **Notification**: SMS notification sent to owner (currently mocked)
5. **Response**: Customer receives formatted message for store contact

### API Endpoints
- `GET /api/health`: Health check endpoint
- `POST /api/find-stores`: Find nearby mattress stores by ZIP code
- `POST /api/leads`: Create new lead with validation

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL database driver
- **@radix-ui/***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management
- **@hookform/resolvers**: React Hook Form Zod integration
- **drizzle-orm**: Database ORM and query builder

### Development Tools
- **Vite**: Development server and build tool
- **TypeScript**: Type checking and compilation
- **Tailwind CSS**: Styling framework
- **ESBuild**: Fast JavaScript bundler for production

### Future Integrations
- **Twilio**: SMS service for owner notifications (currently mocked)
- **Store Locator API**: Dynamic store finding based on ZIP code
- **Analytics**: Lead tracking and conversion metrics

## Deployment Strategy

### Build Process
- **Client**: Vite builds React application to `dist/public`
- **Server**: ESBuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment mode (development/production)
- Development includes Replit-specific tooling and hot reload

### Hosting Requirements
- Node.js runtime environment
- PostgreSQL database (Neon serverless recommended)
- Environment variable support for database configuration
- Static file serving for client application

The application is designed for rapid deployment with minimal configuration, focusing on the core lead capture functionality while maintaining scalability for future feature additions.