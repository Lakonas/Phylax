CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(12) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Open',
  severity VARCHAR(10) NOT NULL DEFAULT 'P4',
  category VARCHAR(50) NOT NULL DEFAULT 'Other',
  assigned_to VARCHAR(100),
  reported_by VARCHAR(100) NOT NULL,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

CREATE SEQUENCE incident_seq START 1;

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'PHX-' || LPAD(nextval('incident_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();