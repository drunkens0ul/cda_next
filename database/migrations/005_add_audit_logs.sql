-- ============================================================================
-- AUDIT LOGS TABLE
-- Tracks all admin actions for security and compliance
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who performed the action
    admin_id UUID NOT NULL REFERENCES users(id),
    admin_email VARCHAR(255) NOT NULL,

    -- What action was performed
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,

    -- Target of the action (polymorphic)
    target_type VARCHAR(50),
    target_id UUID,
    target_identifier VARCHAR(255),

    -- Additional context
    details JSONB,
    ip_address INET,
    user_agent TEXT,

    -- Result
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure')),
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- Composite index for filtered queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_category_created ON audit_logs(category, created_at DESC);

COMMENT ON TABLE audit_logs IS 'Tracks administrative actions for security audit trail';
COMMENT ON COLUMN audit_logs.action IS 'Specific action: user.role_change, event.create, event.update, event.delete, etc.';
COMMENT ON COLUMN audit_logs.category IS 'Action category: user, event, registration, pending_signup, export';
COMMENT ON COLUMN audit_logs.details IS 'JSON object with action-specific data (old/new values, counts, etc.)';
