
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Expense {
  id: string;
  user_id: string;
  type: 'comida' | 'operativo' | 'mejoras';
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
      type: 'comida' | 'operativo' | 'mejoras';
      amount: number;
      description: string;
      created_at?: string;
    }) => {
      if (!profile?.id) {
        throw new Error('No se pudo obtener el ID del usuario');
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          type: expense.type,
          amount: expense.amount,
          description: expense.description,
          user_id: profile.id,
          created_by_name: profile?.name || 'Admin',
          ...(expense.created_at && { created_at: expense.created_at }),
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

  const updateExpenseMutation = useMutation({
    mutationFn: async (expense: {
      id: string;
      type: 'comida' | 'operativo' | 'mejoras';
      amount: number;
      description: string;
    }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          type: expense.type,
          amount: expense.amount,
          description: expense.description,
        })
        .eq('id', expense.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Gasto actualizado",
        description: "El gasto se ha actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el gasto",
        variant: "destructive",
      });
      console.error('Error updating expense:', error);
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

  // Función para verificar si una fecha está en el mes actual
  const isCurrentMonth = (date: string | Date) => {
    const expenseDate = new Date(date);
    const currentDate = new Date();
    return expenseDate.getMonth() === currentDate.getMonth() && 
           expenseDate.getFullYear() === currentDate.getFullYear();
  };

  return {
    expenses,
    isLoading,
    createExpense: createExpenseMutation.mutate,
    updateExpense: updateExpenseMutation.mutate,
    deleteExpense: deleteExpenseMutation.mutate,
    isCreating: createExpenseMutation.isPending,
    isUpdating: updateExpenseMutation.isPending,
    isDeleting: deleteExpenseMutation.isPending,
    isCurrentMonth,
  };
};
