import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CashFlowData {
  totalIncome: number;
  totalExpenses: number;
  cashInHand: number;
}

export const useCashFlow = () => {
  const { profile } = useAuth();

  const { data: cashFlow, isLoading } = useQuery({
    queryKey: ['cashFlow'],
    queryFn: async (): Promise<CashFlowData> => {
      // Consulta eficiente para obtener el total de ingresos (órdenes no canceladas)
      const { data: incomeData, error: incomeError } = await supabase
        .from('orders')
        .select('total')
        .neq('status', 'cancelled');

      if (incomeError) throw incomeError;

      // Consulta eficiente para obtener el total de gastos
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount');

      if (expensesError) throw expensesError;

      const totalIncome = incomeData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      const cashInHand = totalIncome - totalExpenses;

      return {
        totalIncome,
        totalExpenses,
        cashInHand
      };
    },
    enabled: profile?.role === 'admin',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    cashFlow,
    isLoading
  };
};