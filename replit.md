# MattressPickupNow - Lead Capture Application

## Overview

MattressPickupNow is a Pure Urgency Execution System designed to solve the "Sleep on it tonight" problem. The system implements a 6-question lead capture flow that routes customers through one of 4 proven mattress options (Firm/Medium/Soft/Hybrid) with instant budget-based prioritization and automated SMS sequences.

**Core Mission**: "Click, click, click, set. Sleep on it tonight."

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

### Pure Urgency Lead Capture System
The application implements a streamlined 6-question system designed for maximum speed and conversion:

1. **Size Selection**: Twin/Full/Queen/King with instant pricing display
2. **Comfort Type**: F/M/S/H (Firm/Medium/Soft/Hybrid) - 4 proven options only
3. **ZIP Code**: Instant location-based inventory checking
4. **Budget Range**: Under $400/400-799/$800+ for automatic priority routing
5. **Urgency Level**: Today/This Week for immediate vs scheduled follow-up
6. **Contact Form**: Minimal friction data capture with instant lead processing

### Automatic Priority Routing System
- **High Priority ($800+ Budget)**: Instant phone alert to owner with 15-minute callback guarantee
- **Standard Priority ($400-799)**: Automated quotes with optional manual follow-up
- **Basic Priority (Under $400)**: Self-service route with store directions and pickup instructions
- **Today Urgency**: Immediate processing and same-day pickup coordination
- **Progress Tracking**: Visual 5-step progress bar with instant question-by-question flow

### Core Value Proposition
"Need a mattress TODAY? Pick one, pick it up, sleep on it tonight." The 4-option system (F/M/S/H) eliminates decision paralysis while the "fits in a Prius" proof point solves transportation concerns. Zero thinking required, maximum speed execution.

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
- `POST /api/leads`: Create new lead with automatic priority assignment and SMS automation trigger
- `POST /api/leads/:leadId/pickup`: Mark lead as picked up (stops automation sequence)  
- `POST /api/leads/:leadId/sms`: Send manual SMS to lead

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