-- Google Calendar OAuth tokens table
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMPTZ NOT NULL,
    calendar_id TEXT DEFAULT 'primary',
    connected_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add calendar_connected flag to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS calendar_connected BOOLEAN DEFAULT false;

-- RLS policies
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage calendar tokens"
    ON google_calendar_tokens
    FOR ALL
    USING (true)
    WITH CHECK (true);
