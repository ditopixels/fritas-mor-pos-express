-- Actualizar la restricción CHECK para permitir el tipo 'mejoras' en gastos
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_type_check;

-- Crear nueva restricción que incluya 'mejoras'
ALTER TABLE public.expenses ADD CONSTRAINT expenses_type_check 
CHECK (type IN ('comida', 'operativo', 'mejoras'));