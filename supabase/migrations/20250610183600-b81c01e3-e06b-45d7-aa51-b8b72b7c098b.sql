
-- Agregar columna para opciones adicionales en la tabla products
ALTER TABLE public.products 
ADD COLUMN additional_options jsonb DEFAULT '[]'::jsonb;

-- Agregar columna para almacenar las opciones adicionales seleccionadas en order_items
ALTER TABLE public.order_items 
ADD COLUMN additional_selections text;

-- Comentario: 
-- additional_options en products contendrá un array de objetos con la estructura:
-- [{"name": "Salsas", "options": ["rosada", "bbq", "ajo"], "multiple": true, "required": false}]
-- additional_selections en order_items contendrá el string formateado: "Salsa: rosada, bbq"
