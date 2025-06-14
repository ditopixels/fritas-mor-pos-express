
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Expense {
  id: string;
  user_id: string;
  type: 'comida' | 'operativo';
  amount: number;
  description: string;
  created_at: string;
  created_by_name: string;
}

export const useExpenses = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Expense[];
    },
    enabled: profile?.role === 'admin',
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (expense: {
      type: 'comida' | 'operativo';
      amount: number;
      description: string;
    }) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          created_by_name: profile?.name || 'Admin',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Gasto registrado",
        description: "El gasto se ha registrado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar el gasto",
        variant: "destructive",
      });
      console.error('Error creating expense:', error);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Gasto eliminado",
        description: "El gasto se ha eliminado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el gasto",
        variant: "destructive",
      });
      console.error('Error deleting expense:', error);
    },
  });

  return {
    expenses,
    isLoading,
    createExpense: createExpenseMutation.mutate,
    deleteExpense: deleteExpenseMutation.mutate,
    isCreating: createExpenseMutation.isPending,
    isDeleting: deleteExpenseMutation.isPending,
  };
};
