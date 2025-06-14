
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Trash2, Calculator } from "lucide-react";
import { useExpenses, useCreateExpense, useDeleteExpense, useExpensesSummary } from "@/hooks/useExpenses";
import { toast } from "sonner";
import { format } from "date-fns";
import * as XLSX from 'xlsx';

export const ExpensesManagement = () => {
  const [newExpense, setNewExpense] = useState({
    type: '' as 'comida' | 'operativo' | '',
    amount: '',
    description: '',
  });
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
  });

  const { data: expenses = [], isLoading } = useExpenses(
    dateFilter.startDate || undefined,
    dateFilter.endDate || undefined
  );
  const { data: summary } = useExpensesSummary(
    dateFilter.startDate || undefined,
    dateFilter.endDate || undefined
  );
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const handleCreateExpense = async () => {
    if (!newExpense.type || !newExpense.amount || !newExpense.description) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    try {
      await createExpense.mutateAsync({
        type: newExpense.type,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
      });

      setNewExpense({ type: '', amount: '', description: '' });
      toast.success("Gasto registrado correctamente");
    } catch (error) {
      console.error('Error creando gasto:', error);
      toast.error("Error al registrar el gasto");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense.mutateAsync(id);
      toast.success("Gasto eliminado correctamente");
    } catch (error) {
      console.error('Error eliminando gasto:', error);
      toast.error("Error al eliminar el gasto");
    }
  };

  const exportToExcel = () => {
    const worksheetData = expenses.map(expense => ({
      'Fecha': format(new Date(expense.created_at), 'dd/MM/yyyy HH:mm'),
      'Tipo': expense.type.charAt(0).toUpperCase() + expense.type.slice(1),
      'Monto': expense.amount,
      'Descripción': expense.description,
      'Registrado por': expense.created_by_name,
    }));

    // Agregar resumen al final
    worksheetData.push(
      {},
      { 'Fecha': 'RESUMEN', 'Tipo': '', 'Monto': '', 'Descripción': '', 'Registrado por': '' },
      { 'Fecha': 'Total Comida', 'Tipo': '', 'Monto': summary?.comida || 0, 'Descripción': '', 'Registrado por': '' },
      { 'Fecha': 'Total Operativo', 'Tipo': '', 'Monto': summary?.operativo || 0, 'Descripción': '', 'Registrado por': '' },
      { 'Fecha': 'TOTAL GENERAL', 'Tipo': '', 'Monto': summary?.total || 0, 'Descripción': '', 'Registrado por': '' }
    );

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos');

    const today = format(new Date(), 'yyyy-MM-dd');
    XLSX.writeFile(workbook, `gastos_${today}.xlsx`);
  };

  const getTypeColor = (type: string) => {
    return type === 'comida' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
      {/* Formulario para agregar nuevo gasto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registrar Nuevo Gasto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expense-type">Tipo de Gasto</Label>
              <Select
                value={newExpense.type}
                onValueChange={(value: 'comida' | 'operativo') => 
                  setNewExpense(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comida">Comida</SelectItem>
                  <SelectItem value="operativo">Operativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expense-amount">Monto</Label>
              <Input
                id="expense-amount"
                type="number"
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="expense-description">Descripción</Label>
            <Textarea
              id="expense-description"
              placeholder="Describe el gasto..."
              value={newExpense.description}
              onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleCreateExpense}
            disabled={createExpense.isPending}
            className="w-full md:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {createExpense.isPending ? 'Registrando...' : 'Registrar Gasto'}
          </Button>
        </CardContent>
      </Card>

      {/* Resumen de gastos */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Comida</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${summary.comida.toLocaleString()}
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Operativo</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${summary.operativo.toLocaleString()}
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total General</p>
                  <p className="text-2xl font-bold">
                    ${summary.total.toLocaleString()}
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros y acciones */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Historial de Gastos</CardTitle>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="Fecha inicio"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full md:w-auto"
                />
                <Input
                  type="date"
                  placeholder="Fecha fin"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full md:w-auto"
                />
              </div>
              <Button onClick={exportToExcel} variant="outline" className="w-full md:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando gastos...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay gastos registrados en el período seleccionado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Registrado por</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {format(new Date(expense.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(expense.type)}>
                          {expense.type.charAt(0).toUpperCase() + expense.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${expense.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.created_by_name}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
