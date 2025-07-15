-- Actualizar las políticas de RLS para permitir actualizar órdenes (necesario para cancelar órdenes)
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id);

-- También permitir que admins actualicen cualquier orden
CREATE POLICY "Admins can update any order"
ON public.orders
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));