
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
      created_at?: string;
    }) => {
      const updateData: any = {
        type: expense.type,
        amount: expense.amount,
        description: expense.description,
      };

      // Solo actualizar la fecha si se proporciona
      if (expense.created_at) {
        updateData.created_at = expense.created_at;
      }

      const { data, error } = await supabase
        .from('expenses')
        .update(updateData)
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

  // Función para verificar si una fecha está en el mes actual y permitir edición
  const isCurrentMonth = (date: string | Date) => {
    const expenseDate = new Date(date);
    const currentDate = new Date();
    const today = new Date();
    
    // Si estamos en los primeros 3 días del mes, permitir gastos del mes anterior
    if (today.getDate() <= 3) {
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const isLastMonth = expenseDate.getMonth() === lastMonth.getMonth() && 
                         expenseDate.getFullYear() === lastMonth.getFullYear();
      if (isLastMonth) return true;
    }
    
    // Permitir gastos del mes actual
    return expenseDate.getMonth() === currentDate.getMonth() && 
           expenseDate.getFullYear() === currentDate.getFullYear();
  };

  // Función para verificar si una fecha es válida para crear gastos
  const isValidDateForExpense = (date: string | Date) => {
    const expenseDate = new Date(date);
    const today = new Date();
    
    // No permitir fechas futuras
    if (expenseDate > today) return false;
    
    // Si estamos en los primeros 3 días del mes, permitir gastos del mes anterior (último día)
    if (today.getDate() <= 3) {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
      const lastDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      
      if (expenseDate.getMonth() === lastMonth.getMonth() && 
          expenseDate.getFullYear() === lastMonth.getFullYear() &&
          expenseDate.getDate() === lastDayOfPrevMonth.getDate()) {
        return true;
      }
    }
    
    // Permitir gastos del mes actual (hasta hoy)
    return expenseDate.getMonth() === today.getMonth() && 
           expenseDate.getFullYear() === today.getFullYear();
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
    isValidDateForExpense,
  };
};
