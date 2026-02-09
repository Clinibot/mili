-- CREAR TABLA DE NOTIFICACIONES PARA CLIENTES
-- Ejecutar en Supabase SQL Editor

-- Crear tabla
CREATE TABLE IF NOT EXISTS client_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'low_balance', 'balance_recharged', 'custom'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para performance
CREATE INDEX idx_client_notifications_client_id ON client_notifications(client_id);
CREATE INDEX idx_client_notifications_read ON client_notifications(read);
CREATE INDEX idx_client_notifications_created_at ON client_notifications(created_at DESC);

-- Habilitar RLS (pero deshabilitarlo como con las otras tablas)
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notifications DISABLE ROW LEVEL SECURITY;

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE client_notifications;
