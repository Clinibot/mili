-- FIX: Asegurar permisos en chat de administradores

-- 1. Habilitar RLS
ALTER TABLE admin_chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Admins can view all messages" ON admin_chat_messages;
DROP POLICY IF EXISTS "Admins can send messages" ON admin_chat_messages;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON admin_chat_messages;

-- 3. Crear políticas permisivas para usuarios autenticados
CREATE POLICY "Admins can view all messages" ON admin_chat_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can send messages" ON admin_chat_messages
  FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Asegurar Realtime
alter publication supabase_realtime add table admin_chat_messages;
