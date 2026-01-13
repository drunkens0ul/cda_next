# CDA Next.js Project

A Next.js 15+ implementation of Dubai Communicates in Sign Language landing page, featuring full internationalization support, responsive design, and a modular component architecture.

## Tech Stack

- **Framework**: Next.js 15.5.9 (App Router)
- **React**: 18.3.1
- **Styling**: Tailwind CSS 3.4
- **i18n**: next-intl 4.7.0
- **TypeScript**: 5.x
- **Node.js**: 20+

## Key Features

### Route-Based Internationalization
- `/en` - English version (LTR direction)
- `/ar` - Arabic version (RTL direction)
- Automatic locale detection via middleware
- Language switcher for instant locale toggling

### Server-Side Rendering
- All components are server-side rendered by default
- Client components only where interactivity is needed
- Optimized for SEO and performance

### Responsive Design
- Mobile-first approach
- Fully responsive across all breakpoints
- Tailwind CSS for styling with custom design tokens

### Modular Architecture
- Route groups for logical page organization
- Barrel exports for clean imports
- Reusable UI components (Button, Badge, Section)
- Type-safe TypeScript interfaces

## Project Structure

```
cda_next/
├── app/
│   ├── [lang]/                    # Localized routes
│   │   ├── (auth)/                # Auth route group
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── verify-email/
│   │   ├── (dashboard)/           # Dashboard route group
│   │   │   └── dashboard/
│   │   ├── event/[slug]/          # Event detail page
│   │   ├── layout.tsx             # Locale-aware layout
│   │   └── page.tsx               # Landing page
│   └── globals.css                # Global styles
├── components/
│   ├── icons/                     # Icon components
│   │   └── index.ts               # Barrel export
│   ├── index.ts                   # Component exports
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── Footer.tsx
│   ├── Events.tsx
│   ├── Sponsors.tsx
│   ├── About.tsx
│   ├── StrategicMission.tsx
│   ├── MissionCards.tsx
│   ├── JoinMovement.tsx
│   ├── LanguageSwitcher.tsx
│   ├── TopBar.tsx
│   ├── Button.tsx
│   ├── Badge.tsx
│   ├── Section.tsx
│   └── inputStyles.ts
├── i18n/
│   ├── config.ts                  # Locale configuration
│   ├── request.ts                 # Server-side i18n config
│   └── translations/              # Translation files
│       ├── en.json
│       └── ar.json
├── lib/
│   ├── constants.ts               # Design tokens & constants
│   ├── types.ts                   # TypeScript interfaces
│   ├── utils.ts                   # Utility functions
│   ├── events.ts                  # Event data
│   └── sponsors.ts                # Sponsor data
├── public/
│   └── assets/                    # Images and static assets
├── middleware.ts                  # Locale routing middleware
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind configuration
└── tsconfig.json                  # TypeScript configuration
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Access at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Lint

```bash
npm run lint
```

## Components

### UI Components
- **Button** - Reusable button with variants (primary, secondary, outline)
- **Badge** - Status badge component
- **Section** - Section wrapper with consistent spacing

### Page Components (Server)
- **Hero** - Hero section with gradient background
- **About** - About section with image
- **Events** - Event cards grid
- **Sponsors** - Partner/sponsor logos
- **StrategicMission** - Mission pillars with timeline
- **MissionCards** - Mission cards with icons
- **JoinMovement** - Benefits section
- **Footer** - Footer with navigation

### Interactive Components (Client)
- **Header** - Fixed header with scroll detection, mobile menu
- **LanguageSwitcher** - EN/AR toggle
- **TopBar** - Top notification bar

## Internationalization

All translations stored in `i18n/translations/`:

```json
// en.json / ar.json
{
  "nav": { "home": "Home", "events": "Events" },
  "hero": { "title": "...", "subtitle": "..." },
  "events": { "title": "Upcoming Events" },
  "eventDetail": { "registerNow": "Register Now", ... }
}
```

Keys follow nested dot notation structure per section.

## Styling

- **Tailwind CSS** with custom utility classes
- **CSS Variables** for colors: `--primary-blue`, `--dark-blue`, `--light-blue`
- **Custom utilities**: `.container-custom`, `.section-padding`, `.section-heading`
- **Design tokens** in `lib/constants.ts` (colors, spacing, breakpoints, typography)
- **RTL support** for Arabic locale

## Types

Shared interfaces in `lib/types.ts`:

```typescript
export interface Event {
  id: number
  title: string
  date: string
  time: string
  description: string
  attendees: string
  image: string
}

export interface Sponsor {
  id: number
  name: string
  image: string
  alt?: string
}

export interface Pillar {
  title: string
  description: string
}
```

## Icons

All icons in `components/icons/` with barrel export. Each icon accepts a `className` prop for styling.

## Deployment

Deploy to Vercel or any Next.js-compatible platform. No environment variables required for core functionality.

## Requirements

- Node.js 20+
- npm (or yarn/pnpm)

## Roadmap

- [ ] Backend setup (API routes + database)
- [ ] Authentication (login/signup)
- [ ] Email integration (verification, notifications)
- [ ] Server-side data fetching
- [ ] Image optimization & cloud storage
