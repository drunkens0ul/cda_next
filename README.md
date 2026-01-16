# CDA Next.js Project

A Next.js 15+ implementation of Dubai Communicates in Emirati Sign Language landing page, featuring full internationalization support, responsive design, passwordless authentication, event registration, and a modular component architecture.

## Tech Stack

- **Framework**: Next.js 15.5.9 (App Router)
- **React**: 18.3.1
- **Styling**: Tailwind CSS 3.4
- **i18n**: next-intl 4.7.0
- **TypeScript**: 5.x
- **Database**: PostgreSQL
- **Email**: SendGrid
- **Node.js**: 20+

## Key Features

### Route-Based Internationalization
- `/en` - English version (LTR direction)
- `/ar` - Arabic version (RTL direction)
- Automatic locale detection via middleware
- Language switcher for instant locale toggling

### Passwordless Authentication
- Magic link login via email
- Multi-device session support (login works on both original and clicked devices)
- Session tracking with IP and user agent
- Soft delete for audit trails

### Event Registration
- Database-backed event management
- User registration for events
- Registration status tracking
- Bilingual event content (English/Arabic)

### Server-Side Rendering
- All components are server-side rendered by default
- Client components only where interactivity is needed
- Optimized for SEO and performance

## Database Schema

### Tables

#### users
Stores registered user accounts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique email address |
| first_name | VARCHAR(255) | User's first name |
| last_name | VARCHAR(255) | User's last name (optional) |
| phone_number | VARCHAR(50) | Phone number (optional) |
| email_verified | BOOLEAN | Whether email is verified |
| is_deleted | BOOLEAN | Soft delete flag |
| deleted_at | TIMESTAMP | When soft deleted |
| last_login_at | TIMESTAMP | Last login timestamp |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### sessions
Manages user sessions with device tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| session_token | VARCHAR(64) | Unique session token |
| expires_at | TIMESTAMP | Session expiration |
| ip_address | INET | Client IP address |
| user_agent | TEXT | Browser user agent |
| is_deleted | BOOLEAN | Soft delete flag |
| last_active_at | TIMESTAMP | Last activity timestamp |
| created_at | TIMESTAMP | Creation timestamp |

#### verification_tokens
Stores magic link verification tokens.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users (for login tokens) |
| email | VARCHAR(255) | Email address |
| token | VARCHAR(64) | Verification token |
| token_type | VARCHAR(20) | 'signup' or 'login' |
| polling_token | VARCHAR(64) | Token for cross-device polling |
| verified_user_id | UUID | User ID when verified (for polling) |
| expires_at | TIMESTAMP | Token expiration |
| used_at | TIMESTAMP | When token was used |
| is_deleted | BOOLEAN | Soft delete flag |
| created_at | TIMESTAMP | Creation timestamp |

#### events
Stores event information with bilingual support.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(255) | URL-friendly identifier |
| title | VARCHAR(500) | Event title (English) |
| title_ar | VARCHAR(500) | Event title (Arabic) |
| description | TEXT | Event description (English) |
| description_ar | TEXT | Event description (Arabic) |
| date | DATE | Event date |
| start_time | TIME | Event start time |
| end_time | TIME | Event end time |
| location | VARCHAR(500) | Location (English) |
| location_ar | VARCHAR(500) | Location (Arabic) |
| is_virtual | BOOLEAN | Whether event is virtual |
| max_attendees | INTEGER | Maximum capacity |
| image_url | VARCHAR(500) | Event image URL |
| status | VARCHAR(50) | upcoming/ongoing/completed/cancelled |
| is_deleted | BOOLEAN | Soft delete flag |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### event_registrations
Tracks user event registrations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| event_id | UUID | Foreign key to events |
| status | VARCHAR(50) | registered/attended/no_show/cancelled |
| registered_at | TIMESTAMP | Registration timestamp |
| attended_at | TIMESTAMP | Attendance timestamp |
| cancelled_at | TIMESTAMP | Cancellation timestamp |
| is_deleted | BOOLEAN | Soft delete flag |
| created_at | TIMESTAMP | Creation timestamp |

#### pending_signups
Temporary storage for signup data before email verification.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Email address |
| first_name | VARCHAR(255) | First name |
| last_name | VARCHAR(255) | Last name |
| phone_number | VARCHAR(50) | Phone number |
| token_id | UUID | Foreign key to verification_tokens |
| expires_at | TIMESTAMP | Expiration timestamp |
| is_deleted | BOOLEAN | Soft delete flag |

#### rate_limits
API rate limiting by identifier and action.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| identifier | VARCHAR(255) | IP, email, or user ID |
| action_type | VARCHAR(50) | Action being rate limited |
| window_start | TIMESTAMP | Rate limit window start |
| request_count | INTEGER | Number of requests |

#### marketing_email_list
Newsletter subscriptions (separate from app users).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Email address |
| subscribed_at | TIMESTAMP | Subscription timestamp |
| source | VARCHAR(100) | Subscription source |
| is_active | BOOLEAN | Active subscription flag |
| unsubscribed_at | TIMESTAMP | Unsubscription timestamp |

### Relationships
- users 1:N sessions (one user can have multiple sessions)
- users 1:N verification_tokens
- users N:M events (through event_registrations)
- events 1:N event_registrations

## API Routes

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Send magic link
- `GET /api/auth/verify` - Verify magic link token
- `GET /api/auth/check-verification` - Poll for verification status
- `POST /api/auth/resend` - Resend verification email
- `GET /api/auth/session` - Get current session
- `DELETE /api/auth/session` - Logout
- `PATCH /api/auth/profile` - Update profile

### Events
- `GET /api/events` - List all events
- `GET /api/events/[slug]` - Get event details
- `POST /api/events/[slug]/register` - Register for event
- `GET /api/events/[slug]/registration` - Check registration status

### User
- `GET /api/user/registrations` - Get user's event registrations

### Newsletter
- `POST /api/newsletter/subscribe` - Subscribe to newsletter

## Project Structure

```
cda_app/
├── app/
│   ├── [lang]/                    # Localized routes
│   │   ├── (auth)/                # Auth route group
│   │   ├── (dashboard)/           # Dashboard route group
│   │   ├── event/[slug]/          # Event detail page
│   │   └── page.tsx               # Landing page
│   ├── api/                       # API routes
│   │   ├── auth/                  # Auth endpoints
│   │   ├── events/                # Event endpoints
│   │   ├── user/                  # User endpoints
│   │   └── newsletter/            # Newsletter endpoints
│   └── globals.css
├── components/
│   ├── icons/                     # Icon components
│   ├── providers/                 # Context providers
│   └── *.tsx                      # UI components
├── database/
│   └── migrations/                # SQL migration files
├── i18n/
│   ├── config.ts
│   ├── request.ts
│   └── translations/              # en.json, ar.json
├── lib/
│   ├── auth.ts                    # Authentication functions
│   ├── db.ts                      # Database connection
│   ├── events.ts                  # Event functions
│   ├── email.ts                   # Email sending
│   ├── rate-limit.ts              # Rate limiting
│   └── types/                     # TypeScript interfaces
│       ├── auth.ts
│       └── events.ts
├── middleware.ts                  # i18n routing middleware
└── .env.local                     # Environment variables
```

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- SendGrid account (for emails)

### Environment Variables

Create `.env.local`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=no-reply@yourdomain.com
SENDGRID_FROM_NAME=Your App Name

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_SECRET=your-random-secret-key

# Token Configuration
VERIFICATION_TOKEN_EXPIRY_MINUTES=30
SESSION_TOKEN_EXPIRY_DAYS=30
MAGIC_LINK_EXPIRY_MINUTES=15
```

### Install Dependencies

```bash
npm install
```

### Run Migrations

```bash
# Connect to your PostgreSQL and run each migration file in order:
psql -U your_user -d your_db -f database/migrations/001_create_users_table.sql
# ... repeat for all migration files
```

### Development Server

```bash
npm run dev
```

Access at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## Authentication Flow

### Magic Link Login
1. User enters email on login page
2. Server creates verification token + polling token
3. Magic link email sent to user
4. User clicks link (can be on different device)
5. Link device gets session + redirects to dashboard
6. Original device polls for verification
7. When verified, original device also gets session

### Multi-Device Support
Both the device that initiated login AND the device that clicked the magic link receive valid sessions, enabling seamless login from any device.

## Event Registration Flow

1. User views event detail page
2. Clicks "Register Now"
3. If not logged in → redirected to login with returnTo parameter
4. After login → redirected back to event page
5. Registration auto-triggered on return
6. Success message shown, button disabled
7. User can view registered events in dashboard

## Requirements

- Node.js 20+
- PostgreSQL 14+
- npm (or bun)
