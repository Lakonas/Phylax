CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  author VARCHAR(100) NOT NULL,
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_incident_id ON comments(incident_id);