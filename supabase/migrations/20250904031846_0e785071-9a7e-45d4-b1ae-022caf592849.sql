-- Update RPC functions to set search_path
CREATE OR REPLACE FUNCTION public.get_total_income(
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
) RETURNS numeric
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(total), 0)::numeric
  FROM public.orders
  WHERE status <> 'cancelled'
    AND (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date);
$$;

CREATE OR REPLACE FUNCTION public.get_total_expenses(
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
) RETURNS numeric
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)::numeric
  FROM public.expenses
  WHERE (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date);
$$;