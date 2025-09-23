# Chronic Fatigue Health Tracker

A Progressive Web App designed to provide empathetic, evidence-based health management for individuals with ME/CFS and Long COVID.

## Features

- **Daily Health Routines**: Gentle breathing, mobility, and stretching exercises
- **AI-Powered Pacing**: Intelligent guidance to prevent post-exertional malaise
- **Symptom Tracking**: Comprehensive logging with healthcare provider reports
- **Low-Stimulus Design**: "Vibe coding" principles for minimal cognitive load
- **Privacy-First**: GDPR compliant with robust data protection

## Tech Stack

- **Framework**: Next.js 14+ with TypeScript
- **UI**: shadcn/ui with Origin UI design system
- **Styling**: Tailwind CSS with accessibility enhancements
- **PWA**: Next-PWA for offline functionality
- **Testing**: Vitest with React Testing Library
- **Code Quality**: ESLint, Prettier, TypeScript

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual database credentials
   ```

3. Set up the database:
   ```bash
   # Generate database migrations
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Or push schema directly (development)
   npm run db:push
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage

### Database Scripts

- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema to database (development)
- `npm run db:studio` - Open Drizzle Studio for database management

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   └── api/            # API routes
├── components/          # Reusable UI components
│   └── ui/             # shadcn/ui components
├── lib/                # Utility functions
│   └── db/             # Database configuration and services
│       ├── services/   # Database service layer
│       ├── migrations/ # Database migrations
│       ├── schema.ts   # Database schema definitions
│       └── connection.ts # Database connection
└── test/               # Test configuration
```

## Database Architecture

The application uses **NeonDB PostgreSQL** with **Drizzle ORM** for type-safe database operations:

### Core Tables
- `users` - User authentication and basic profile
- `user_profiles` - Extended health-specific user information
- `daily_health_logs` - Comprehensive daily symptom and energy tracking
- `movement_sessions` - Exercise and movement activity logging
- `biometric_measurements` - Camera-based heart rate and HRV data
- `nutrition_logs` - Food, supplement, and hydration tracking
- `sleep_logs` - Sleep optimization and quality tracking
- `pacing_recommendations` - AI-generated pacing suggestions
- `health_reports` - Healthcare provider report generation

### Key Features
- **Type Safety**: Full TypeScript integration with Zod validation
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Performance**: Optimized queries with pagination and indexing
- **Privacy**: GDPR-compliant data structure with user control
- **Accessibility**: Designed for chronic illness patient needs

## Accessibility Features

- WCAG 2.1 AA compliance
- High contrast mode support
- Reduced motion preferences
- Large touch targets (44px minimum)
- Screen reader optimization
- Keyboard navigation support

## PWA Features

- Offline functionality
- App installation
- Push notifications (planned)
- Background sync (planned)

## Contributing

This project follows evidence-based development practices and prioritizes the needs of chronic illness patients. All contributions should consider cognitive load, energy limitations, and accessibility requirements.