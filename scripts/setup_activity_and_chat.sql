-- TABLA 1: REGISTRO DE ACTIVIDAD (Activity Logs)
CREATE TABLE admin_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL, -- Ej: 'Crear Cliente', 'Regalar Saldo', 'Añadir Gasto'
  details TEXT,         -- Descripción legible
  metadata JSONB,       -- Datos técnicos opcionales (IDs, valores anteriores, etc)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para Logs: Todo admin ve todo
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs" ON admin_activity_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert logs" ON admin_activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);


-- TABLA 2: CHAT DE ADMINS
CREATE TABLE admin_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para Chat: Todo admin ve todo
ALTER TABLE admin_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all messages" ON admin_chat_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can send messages" ON admin_chat_messages
  FOR INSERT TO authenticated WITH CHECK (true);

-- realtime
alter publication supabase_realtime add table admin_chat_messages;
alter publication supabase_realtime add table admin_activity_logs;
