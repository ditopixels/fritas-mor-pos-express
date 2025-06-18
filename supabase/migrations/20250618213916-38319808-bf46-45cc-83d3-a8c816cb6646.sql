
-- Agregar columna is_delivery a la tabla orders
ALTER TABLE public.orders 
ADD COLUMN is_delivery boolean NOT NULL DEFAULT false;
