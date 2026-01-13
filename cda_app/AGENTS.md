# Agent Guidelines for CDA Next.js Project

This is a Next.js 15.5+ project with App Router, TypeScript, next-intl for internationalization, and Tailwind CSS.

## Build Commands

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

**Testing**: No test framework configured. Do not add test files or test commands.

## Code Style

### Component Types
- **Server Components**: Default (no directive needed)
- **Client Components**: Must include `'use client'` at the top of the file
  - Required for: event handlers (onClick, onChange), hooks (useState, useEffect), browser APIs
  - Examples: Header.tsx, Button.tsx, LanguageSwitcher.tsx
- **All components should be wrapped in `memo()`** to prevent unnecessary re-renders: `export default memo(ComponentName)`

### Imports
- Use named imports: `import { useState, useEffect } from 'react'`
- Type imports: `import type { Metadata } from "next"`
- Group imports in this order: React/Next.js, third-party, local modules
- Use path alias `@/` for root-level imports: `import { locales } from '@/i18n/config'`
- Import `cn` utility from lib/utils for class merging

### TypeScript
- Strict mode enabled in tsconfig.json
- All components and functions must have explicit type annotations
- Use `export const` for type exports: `export type Locale = (typeof locales)[number]`
- Define types in lib/types.ts for shared interfaces
- Async functions must properly await Promises
- params are async in Next.js 15+: `const { lang } = await params`

### Naming Conventions
- Components: PascalCase (Hero.tsx, Header.tsx, Button.tsx)
- Functions: camelCase (cn, generateStaticParams)
- Constants: camelCase for module exports
- Translation keys: camelCase with dot notation (nav.events, hero.title)
- Icon components: PascalCase ending with "Icon" (MenuIcon.tsx, ArrowRightIcon.tsx)

### File Structure
- **App Router**: `app/[lang]/` for localized routes
- **Route Groups**: `(auth)` for auth pages, `(dashboard)` for dashboard pages
- **Components**: Top-level `components/` for reusable components
- **Icons**: `components/icons/` with index.ts barrel export
- **Utilities**: `lib/` for helper functions (utils.ts, constants.ts, types.ts)
- **i18n**: Config in `i18n/`, translations in `i18n/translations/{locale}.json`
- **Assets**: Static files in `public/assets/`

### Styling
- Use Tailwind CSS utility classes
- Use `cn()` utility for conditional classes: `cn('base-class', isActive && 'active-class')`
- Custom utility classes in globals.css: `.container-custom`, `.section-padding`, `.section-heading`, `.section-label`
- CSS variables: `--primary-blue: #0066CC`, `--dark-blue: #004C99`, `--light-blue: #E6F2FF`
- Font: Dubai font family (supports Arabic and English)
- Mobile-first responsive design (sm:, md:, lg: breakpoints)
- RTL support: `dir={lang === 'ar' ? 'rtl' : 'ltr'}` on html element
- Button variants: default, primary, secondary, outline with sizes sm, md, lg

### Component Patterns
- Use props interface definition: `function Component({ children, className, ...props }: Props) { ... }`
- Spread HTML attributes: `{...props}` at the end of props object
- Merge className with cn(): `className={cn('default-classes', className)}`
- Use Next.js Link for navigation: `<Link href="/route">` not anchor tags
- Use anchor tags for same-page anchors: `<a href="#section">`
- Images in public folder with Next.js Image component: `<Image src="/assets/logo.png" alt="..." width={48} height={48} />`

### Internationalization (i18n)
- **Locales**: 'en' (default), 'ar'
- Configured with next-intl plugin
- Client components: `const t = useTranslations('namespace')`
- Server components: `await getTranslations({ locale: lang, namespace: 'Metadata' })`
- Translation keys: camelCase with dot notation (nav.events, hero.title)
- Always add translations to both en.json and ar.json
- Wrap app with NextIntlClientProvider in root layout
- Generate static params for all locales in generateStaticParams()

### Type Definitions
- Shared interfaces in lib/types.ts: Event, Sponsor, Pillar, Benefit
- Locale type: `export type Locale = 'en' | 'ar'`
- Type exports should use `export const` for reuse

### Form Patterns
- Use inputStyles from components/inputStyles.ts for consistent form inputs
- Input styles: base, error, label, helper properties
- Apply error styles with cn(): `className={cn(inputStyles.base, hasError && inputStyles.error)}`
- Labels use standard class: `className={inputStyles.label}`

### Language Switching
- Extract locale from pathname: `const currentLocale = pathname.split('/')[1] || 'en'`
- Switch languages by replacing locale in path segments
- Use Link component for language switching: `<Link href={getSwitchedPath('ar')}>`
- LanguageSwitcher component is client-side, wrapped in memo()

### Icon Components
- All icons in components/icons/ directory
- Export via barrel file in components/icons/index.ts
- Import: `import { MenuIcon, ArrowRightIcon } from './icons'`
- Use memo() for performance: `export default memo(ComponentIcon)`
- Icons accept className prop for styling

### Route Groups
- `(auth)` route group: login, signup, verify-email pages
- `(dashboard)` route group: dashboard page
- Route groups don't affect URL structure
- Each group has its own layout.tsx

### Error Handling
- Use `notFound()` from `next/navigation` for 404s (e.g., invalid locale)
- No custom error boundaries implemented
- Validate locale parameters against `locales` array
- Always destructure params with await

### Linting
- ESLint config: extends eslint-config-next with typescript and core-web-vitals
- Run `npm run lint` before committing changes
- No auto-formatting configured (no Prettier)

### Do Not
- Add test files or test commands
- Add comments unless explicitly requested
- Use other styling frameworks (styled-components, emotion, etc.)
- Change the directory structure
- Add npm packages without checking if they're already used
- Use anchor tags for internal routing (use Link instead)
- Use default imports for React hooks, use named imports
