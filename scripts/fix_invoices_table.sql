-- FIX: Recrear tabla de facturas con esquema correcto
-- Este script soluciona el error 400 y el error al guardar

DROP TABLE IF EXISTS invoices;

CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- Opcional, puede ser NULL para gastos globales
  type TEXT NOT NULL CHECK (type IN ('expense', 'sale')),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('paid', 'unpaid')) DEFAULT 'unpaid',
  document_url TEXT,
  description TEXT,
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Política para permitir todo a usuarios autenticados (admin)
CREATE POLICY "Allow all for authenticated users" ON invoices
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Crear índices para velocidad
CREATE INDEX idx_invoices_type ON invoices(type);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date DESC);

-- Verificar
SELECT * FROM invoices;
