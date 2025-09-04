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
      // Usar funciones RPC para consultas eficientes
      const { data: incomeData, error: incomeError } = await supabase
        .rpc('get_total_income');

      if (incomeError) throw incomeError;

      const { data: expensesData, error: expensesError } = await supabase
        .rpc('get_total_expenses');

      if (expensesError) throw expensesError;

      const totalIncome = Number(incomeData) || 0;
      const totalExpenses = Number(expensesData) || 0;
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