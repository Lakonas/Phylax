-- Seed data for Phylax demo
-- Realistic incidents across all statuses and severities

INSERT INTO incidents (title, description, severity, category, status, assigned_to, reported_by, resolution_notes, resolved_at, closed_at) VALUES

-- Resolved & Closed (shows TTR data)
('Email server unreachable', 'Exchange server not responding to IMAP connections. All staff affected.', 'P1', 'Infrastructure', 'Closed', 'Sarah Chen', 'Mike Torres', 'DNS record was pointing to decommissioned IP. Updated A record and flushed DNS cache.', NOW() - INTERVAL '4 days 2 hours', NOW() - INTERVAL '4 days 1 hour'),

('SSO login loop on Chrome', 'Users on Chrome 120+ getting infinite redirect after entering credentials.', 'P2', 'Application', 'Closed', 'James Park', 'Lisa Wang', 'Chrome update changed SameSite cookie defaults. Updated auth cookie settings to SameSite=None with Secure flag.', NOW() - INTERVAL '6 days 5 hours', NOW() - INTERVAL '6 days 3 hours'),

('Backup job failing silently', 'Nightly database backup job shows success but output files are 0 bytes.', 'P2', 'Infrastructure', 'Resolved', 'Sarah Chen', 'DevOps Bot', 'Disk quota exceeded on backup volume. Expanded volume from 500GB to 1TB and added monitoring alert at 80% capacity.', NOW() - INTERVAL '1 day', NULL),

('API rate limit too aggressive', 'Partner integration hitting 429 errors during normal business hours.', 'P3', 'Application', 'Resolved', 'James Park', 'Alex Rivera', 'Increased rate limit from 100 to 500 req/min for authenticated partners. Added partner tier to rate limit config.', NOW() - INTERVAL '2 days', NULL),

-- In Progress (active work)
('VPN disconnects every 30 minutes', 'Remote workers on FortiClient dropping connection consistently at 30-minute intervals.', 'P2', 'Network', 'In Progress', 'Sarah Chen', 'James Park', NULL, NULL, NULL),

('Dashboard loading slowly', 'Analytics dashboard takes 12+ seconds to render. Started after last deployment.', 'P3', 'Application', 'In Progress', 'James Park', 'Lisa Wang', NULL, NULL, NULL),

('Printer queue stuck on 3rd floor', 'Print jobs queuing but not releasing to HP LaserJet on 3rd floor. Other floors fine.', 'P4', 'Infrastructure', 'In Progress', 'Alex Rivera', 'Front Desk', NULL, NULL, NULL),

-- Open (untriaged or unassigned)
('Production database CPU at 95%', 'PostgreSQL primary showing sustained high CPU. Query performance degrading.', 'P1', 'Infrastructure', 'Open', NULL, 'DevOps Bot', NULL, NULL, NULL),

('Customer portal returning 403', 'Enterprise customers getting forbidden errors on /api/v2/accounts endpoint since 6am.', 'P1', 'Application', 'Open', NULL, 'Support Team', NULL, NULL, NULL),

('New hire laptop not imaging', 'PXE boot failing for Dell Latitude 5540 models. Older models work fine.', 'P3', 'Infrastructure', 'Open', NULL, 'IT Onboarding', NULL, NULL, NULL),

('Slack integration stopped posting', 'Incident notifications no longer appearing in #ops-alerts channel.', 'P3', 'Application', 'Open', NULL, 'Sarah Chen', NULL, NULL, NULL),

('Office wifi slow on 2nd floor', 'Users reporting intermittent slowness on CORP-WIFI SSID. Speed tests showing 5mbps.', 'P4', 'Network', 'Open', 'Alex Rivera', 'Facilities', NULL, NULL, NULL),

('Request for shared drive access', 'Marketing team needs read access to /shared/design-assets folder.', 'P4', 'Access', 'Open', NULL, 'Karen Lee', NULL, NULL, NULL);


