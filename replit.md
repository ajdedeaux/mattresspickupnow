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

1. **Size Selection**: Twin/Full/Queen/King with instant pricing display (per correct pricing: F=$299.99, M=$399.99, H=$499.99, S=$699.99 for Queen)
2. **Comfort Type**: F/M/S/H (Firm/Medium/Soft/Hybrid) - 4 proven options only
3. **ZIP Code**: Instant location-based inventory checking
4. **Budget Range**: Under $400/400-799/$800+ for automatic priority routing
5. **Urgency Level**: Today/This Week for immediate vs scheduled follow-up
6. **Contact Form**: Minimal friction data capture with instant lead processing

### Persona Detection Engine (NEW - Jan 2025)
Rules-based psychology profiling system identifies 9 customer personas:
- **Direct to AJ Routing**: Emergency Replacement, Immediate Move-In, Property Manager, Delivery Mismatch
- **Self-Service Routing**: Coming-of-Age, Student Transition, Guest Accommodations, Child Milestone
- **Default**: Practical No-Nonsense
- **AI-Ready**: Confidence scoring and reasoning for each persona match

### Automatic Priority Routing System (ENHANCED)
- **Direct to AJ**: Emergency personas get instant owner alerts with 15-minute callback guarantee
- **Self-Service**: Standard flow with calendar CTA and automated follow-up
- **Psychology-Driven Messaging**: Persona-specific validation scripts ("That makes total sense, let's fix it fast")
- **Data Ownership**: Complete CSV export for AJ's CRM and email follow-up

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
- `POST /api/leads`: Create new lead with persona detection, priority assignment, and SMS automation trigger
- `POST /api/leads/:leadId/pickup`: Mark lead as picked up (stops automation sequence)  
- `POST /api/leads/:leadId/sms`: Send manual SMS to lead
- `GET /api/leads/export`: CSV export of all leads for data ownership (AJ's CRM integration)

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

## Recent Changes

### July 2025 - Updated Webhook Implementation & Dedicated Warehouse Search (Latest)

**Updated Webhook Trigger Point:**
- Webhook now fires after Step 9 (reference code generation + video display) instead of complete customer journey
- Captures leads at peak engagement moment with all essential data for immediate store coordination
- Field name corrected from "demographic" to "who_its_for" to match app language consistency
- Uses "NA" values for customer_name and urgency_level (collected during outreach phase)

**Dedicated Warehouse Search Implementation:**
- Added separate `/api/nearby-warehouses` endpoint for specific warehouse discovery
- Implemented 2-tier warehouse search strategy with 80km radius (larger than store searches)
- Enhanced data structure with warehouse-specific metadata (warehouseType, inventoryCapacity, serviceRadius)
- Store name extraction functionality added for inventory search integration

**Enhanced Market Intelligence:**
- Complete location data structure with store ranking, market density analysis
- Separate warehouse object in API responses as specified in original requirements
- Business intelligence metadata including service area indicators and distance categorization
- Ready for production Google API reconnection with comprehensive error handling

**Updated Webhook Payload Structure:**
```json
{
  "customer_data": {
    "reference_code": "MP-XXXX",
    "who_its_for": "Me|My Child|Guest Room|etc",
    "mattress_size": "Queen",
    "mattress_model": "Medium", 
    "locked_price": "$399.99",
    "customer_name": "NA",
    "urgency_level": "NA"
  },
  "location_data": {
    "mattress_firm_stores": [...],
    "mattress_firm_warehouse": {...},
    "search_metadata": {...}
  }
}
```

### January 2025 - N8N Automation Integration & Customer Profile Tracking System

**Comprehensive Customer Journey Tracking:**
- Implemented complete customer profile tracking system with unique tracking IDs generated on app entry
- Built reference code generation (MP-XXXX format) for seamless N8N automation integration
- Added real-time profile updates at each funnel step: ZIP code → Demographics → Size → Firmness → Contact Method
- Comprehensive API endpoints for customer profile CRUD operations and CSV export for data ownership

**N8N Automation Ready Infrastructure:**
- Customer profile context provider manages tracking throughout entire user journey
- Reference code generation triggered when profile is complete with 24-hour price lock
- **LIVE WEBHOOK INTEGRATION:** Automatic POST to https://hook.us2.make.com/xmw2ahcia681bvopgp5esp37i2pu2hn4 when customer completes profile
- Fire-and-forget webhook delivery with error handling and logging
- CSV export functionality for Google Sheets integration and CRM data ownership
- Complete customer data capture: tracking ID, reference code, selections, pricing, location, contact preferences

**Webhook Payload Structure:**
- referenceCode (MP-XXXX format)
- trackingId (unique customer identifier)
- zipCode, mattressSize, firmness, finalPrice
- demographics, contactMethod (always "sms")
- priceLockExpiry (24-hour window)

**Advanced User Flow Integration:**
- Automatic ZIP code tracking when location is entered (GPS or manual)
- Demographics tracking during use case selection (personal, business, etc.)
- Mattress size and firmness selections tracked with calculated pricing
- Contact method preference tracking (SMS, email, form) for personalized follow-up
- Complete customer profile ready for N8N automation processing with all user selections

### January 2025 - Clean Branded Customer Quotes & Perfect Tagline

**Revolutionary Tagline Implementation:**
- Updated header tagline to "Why wait? Get it today." for perfect visual balance
- Combines punchy psychological challenge with clear action orientation
- Expanded length matches "Sleep on it tonight" space requirements while adding urgency reinforcement
- Font size increased to text-base for better visual prominence and hierarchy

**Premium Static Customer Quote System:**
- Replaced glitchy rotating animations with clean, static customer quote
- Features Cyrus D.'s perfect "no shopping around" testimonial supporting core value proposition
- Clean typography matching site's premium aesthetic - no animations, no layout shifting
- Fixed height container prevents any visual glitches or scroll jumping
- Maintains star ratings (⭐⭐⭐⭐⭐ 4.9/5 • 2,000+ customers) above quote for credibility
- Premium approach: one powerful, readable quote that users can actually absorb

**Apple-Level Design Simplification:**
- Consolidated trust badges to 3 core elements: Same-day • Fits in your car • 120-night trial
- "Fits in your car" positioned center as key differentiator (removes biggest logistics barrier)
- Cut 40% of text density with generous white space throughout
- Premium spacing: doubled tagline spacing, increased element separation

**Ultra-Minimal Conversion Polish:**
- Removed insulting progress indicators and "X more digits" countdown
- Eliminated condescending "ZIP code complete" validation messages  
- Auto-submit functionality: instantly processes when user types 5th digit
- Removed unnecessary manual "Find pickup locations" button
- Clean loading state that only appears during actual processing
- Respects user intelligence with minimal, functional interface

### January 2025 - Premium UI Polish & Clean Design Implementation

**Progressive Reveal Message Builder (January 2025):**
- Revolutionary step-by-step interface where completed fields disappear and next step appears
- Sticky message preview at top with real-time character-by-character updates as they type
- Auto-advancing flow: Name input → Auto-advance to urgency → Auto-advance to send button
- Magical UX: Each step slides in smoothly, previous step disappears, keeping focus on current task
- Always-visible message building: Live blue/green highlighting with "Live" indicator
- Premium completion flow: Green checkmark, "Perfect! Ready to send" with premium send button
- Psychology perfect: Feels like building something custom, not filling out a form
- Mobile-optimized: Works flawlessly with keyboard, always keeps message visible

**Clean Input Design (January 2025):**
- Removed decorative icons that consume valuable mobile real estate
- Simplified name input to match clean, minimal design of other entry sections
- Consistent typography hierarchy without unnecessary visual elements
- One-tap optimized with no extra color styling or gradients on inputs
- Focus on functionality over decoration for maximum user efficiency

**Standard Page Flow (January 2025):**
- Fixed message builder to show complete context first (logo, header, message preview)
- Users can orient themselves and see the big picture before committing to input
- Requires intentional tap on "Enter your name" button to begin input flow
- Removed redundant bottom navigation when top back button is visible
- Follows consistent UX pattern across all application steps
- Fixed "Edit message" glitch: now properly resets to clean "Enter your name" button state instead of auto-advancing

### January 2025 - Premium UI Polish & Clean Design Implementation

**Button Enhancement (Complete):**
- Redesigned confirmation page buttons with premium Apple/Stripe aesthetic
- Removed all icons and emojis for clean, professional appearance
- Added custom box shadows for floating effect (green/blue colored shadows)
- Implemented hover animations with scale and lift effects
- Clean typography hierarchy with proper font weights

**Premium Video Card Design (Complete):**
- Replaced emoji-filled "A MATTRESS in a PRIUS?" card with professional premium design
- Clean messaging: "No truck? No problem." / "Fits in a Prius."
- Apple/Tesla-level aesthetic with blue gradient matching brand colors
- Professional glassmorphism play button with subtle transparency and blur effects
- Optimized 288x320px format with perfect symmetry to button layout below
- Integrated final cleaned up and shortened "Fits in a Prius" demonstration video
- Professional quality with optimal length for user engagement
- Implemented smart video flip card with auto-flip-back after playback
- Video plays once then automatically returns to CTA state (saves bandwidth costs)
- Maintains replay capability while preventing continuous looping
- System cleanup: removed all previous video versions for optimal performance

**Mattress Selection Page Redesign (Complete):**
- Applied clean, confident design philosophy removing sales pressure
- Simplified headline from promotional copy to simple "How do you like your mattress to feel?"
- Streamlined instructions to just "Tap to see details"
- Implemented subtle "Most Popular" flag attached to card border
- Maintained premium expanded view with colored backgrounds and professional styling
- User reports excellent UX: cards intelligently center and lock in place when expanded
- Preserved premium feeling while achieving Apple/Tesla-level design confidence

**Trust Badge Optimization (Complete):**
- Simplified from complex gradients to subtle, minimal design
- Consistent blue-50 background with blue-600 icons for brand alignment
- Reduced visual weight to support rather than compete with main experience
- Clean clock, shield, and dollar icons with consistent styling
- Minimal approach emphasizes clarity over visual impact
- Subtle nudges that build trust without demanding attention
- Matches the clean, confident aesthetic of previous pages