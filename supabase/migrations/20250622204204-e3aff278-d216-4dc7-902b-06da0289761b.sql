
-- Agregar el estado 'cancelled' como opción válida para el campo status
-- Y agregar columna para la razón de cancelación
ALTER TABLE public.orders 
ADD COLUMN cancellation_reason text;

-- Crear un check constraint para validar los estados permitidos
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('completed', 'cancelled', 'pending'));
