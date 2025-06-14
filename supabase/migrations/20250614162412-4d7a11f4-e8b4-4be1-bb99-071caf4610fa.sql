
-- Crear tabla para los gastos
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('comida', 'operativo')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_name TEXT NOT NULL
);

-- Agregar Row Level Security (RLS) para que solo admins puedan acceder
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Política que permite a los admins ver todos los gastos
CREATE POLICY "Only admins can view all expenses" 
  ON public.expenses 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política que permite a los admins crear gastos
CREATE POLICY "Only admins can create expenses" 
  ON public.expenses 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política que permite a los admins actualizar gastos
CREATE POLICY "Only admins can update expenses" 
  ON public.expenses 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política que permite a los admins eliminar gastos
CREATE POLICY "Only admins can delete expenses" 
  ON public.expenses 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Crear índices para optimizar consultas
CREATE INDEX idx_expenses_type ON public.expenses(type);
CREATE INDEX idx_expenses_created_at ON public.expenses(created_at);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
