
-- Crear tabla para attachments de productos
CREATE TABLE public.product_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  values TEXT[] NOT NULL DEFAULT '{}',
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear índice para mejorar el rendimiento de consultas
CREATE INDEX idx_product_attachments_product_id ON public.product_attachments(product_id);

-- Agregar columna variant_attachments a order_items si no existe
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS variant_attachments JSONB DEFAULT '{}';
