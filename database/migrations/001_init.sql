-- CDA Application Database Schema
-- Combined migration file for fresh database setup
-- Created: 2026-01-13

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- UTILITY FUNCTION: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    phone_number VARCHAR(50),
    role VARCHAR(20) DEFAULT 'user',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_verified ON users(email_verified);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_deleted ON users(is_deleted);
CREATE INDEX idx_users_last_login_at ON users(last_login_at);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN users.role IS 'User role: user (default) or admin';

-- ============================================================================
-- VERIFICATION TOKENS TABLE
-- ============================================================================
CREATE TABLE verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('signup', 'login')),
    polling_token VARCHAR(64),
    verified_user_id UUID,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX idx_verification_tokens_email ON verification_tokens(email);
CREATE INDEX idx_verification_tokens_expires ON verification_tokens(expires_at);
CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_polling ON verification_tokens(polling_token);
CREATE INDEX idx_verification_tokens_is_deleted ON verification_tokens(is_deleted);

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_is_deleted ON sessions(is_deleted);

-- ============================================================================
-- RATE LIMITS TABLE
-- ============================================================================
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    request_count INTEGER DEFAULT 1,
    UNIQUE(identifier, action_type, window_start)
);

CREATE INDEX idx_rate_limits_lookup ON rate_limits(identifier, action_type, window_start);

-- ============================================================================
-- PENDING SIGNUPS TABLE
-- ============================================================================
CREATE TABLE pending_signups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    phone_number VARCHAR(50),
    token_id UUID NOT NULL REFERENCES verification_tokens(id) ON DELETE CASCADE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_pending_signups_email ON pending_signups(email);
CREATE INDEX idx_pending_signups_expires ON pending_signups(expires_at);
CREATE INDEX idx_pending_signups_token_id ON pending_signups(token_id);
CREATE INDEX idx_pending_signups_is_deleted ON pending_signups(is_deleted);

-- ============================================================================
-- MARKETING EMAIL LIST TABLE
-- ============================================================================
CREATE TABLE marketing_email_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(100) DEFAULT 'website_footer',
    is_active BOOLEAN DEFAULT TRUE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marketing_email_list_email ON marketing_email_list(email);
CREATE INDEX idx_marketing_email_list_active ON marketing_email_list(is_active);
CREATE INDEX idx_marketing_email_list_source ON marketing_email_list(source);
CREATE INDEX idx_marketing_email_list_subscribed_at ON marketing_email_list(subscribed_at);

COMMENT ON TABLE marketing_email_list IS 'Newsletter subscription list for marketing team - separate from application users';

-- ============================================================================
-- EVENTS TABLE
-- All times are stored in UTC. TIME WITH TIME ZONE ensures timezone awareness.
-- ============================================================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    title_ar VARCHAR(500),
    description TEXT,
    description_ar TEXT,
    date DATE NOT NULL,
    start_time TIME WITH TIME ZONE,
    end_time TIME WITH TIME ZONE,
    location VARCHAR(500),
    location_ar VARCHAR(500),
    is_virtual BOOLEAN DEFAULT FALSE,
    max_attendees INTEGER,
    image_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    show_join_button BOOLEAN DEFAULT FALSE,
    meeting_url VARCHAR(500),
    is_highlighted BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_is_deleted ON events(is_deleted);
CREATE INDEX idx_events_highlighted ON events(is_highlighted);

-- Ensure only ONE event can be highlighted at a time (among non-deleted events)
CREATE UNIQUE INDEX idx_events_single_highlighted
    ON events (is_highlighted)
    WHERE is_highlighted = TRUE AND is_deleted = FALSE;

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN events.show_join_button IS 'When true, shows Join Event button for registered users';
COMMENT ON COLUMN events.meeting_url IS 'URL to join the virtual meeting (Zoom, Teams, etc.)';
COMMENT ON COLUMN events.is_highlighted IS 'When true, this event is featured in the JoinMovement section (only one allowed)';

-- ============================================================================
-- EVENT REGISTRATIONS TABLE
-- ============================================================================
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'no_show', 'cancelled')),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attended_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
);

CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);
CREATE INDEX idx_event_registrations_is_deleted ON event_registrations(is_deleted);

CREATE TRIGGER update_event_registrations_updated_at
    BEFORE UPDATE ON event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
