
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Expense {
  id: string;
  user_id: string;
  type: 'comida' | 'operativo';
  amount: number;
  description: string;
  created_at: string;
  created_by_name: string;
}

export const useExpenses = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['expenses', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (expenseData: {
      type: 'comida' | 'operativo';
      amount: number;
      description: string;
    }) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expenseData,
          created_by_name: profile?.name || 'Unknown'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};

export const useExpensesSummary = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['expenses-summary', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('type, amount');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const summary = data.reduce((acc, expense) => {
        acc[expense.type] = (acc[expense.type] || 0) + Number(expense.amount);
        acc.total = (acc.total || 0) + Number(expense.amount);
        return acc;
      }, {} as Record<string, number>);

      return {
        comida: summary.comida || 0,
        operativo: summary.operativo || 0,
        total: summary.total || 0,
      };
    },
  });
};
