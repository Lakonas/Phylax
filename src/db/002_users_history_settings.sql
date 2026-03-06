-- 002_users_history_settings.sql
-- User Stories: #21 (team members), #15 (audit trail), #7/#20 (queue toggle)

-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'submitter'
    CHECK (role IN ('admin', 'agent', 'submitter')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INCIDENT HISTORY TABLE (audit trail)
CREATE TABLE incident_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  field_changed VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_history_incident ON incident_history(incident_id);

-- SETTINGS TABLE
CREATE TABLE settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEED DEFAULTS
INSERT INTO settings (key, value) VALUES
  ('queue_strategy', 'slap'),
  ('stale_threshold_hours', '48');


