
import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Download, Plus, DollarSign } from "lucide-react";
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const ExpensesManagement = () => {
  const { expenses, isLoading, createExpense, deleteExpense, isCreating } = useExpenses();
  const [newExpense, setNewExpense] = useState({
    type: '' as 'comida' | 'operativo' | '',
    amount: '',
    description: '',
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.type || !newExpense.amount || !newExpense.description) {
      return;
    }

    createExpense({
      type: newExpense.type as 'comida' | 'operativo',
      amount: parseFloat(newExpense.amount),
      description: newExpense.description,
    });

    setNewExpense({ type: '', amount: '', description: '' });
  };

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.created_at);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;
    
    if (start && expenseDate < start) return false;
    if (end && expenseDate > end) return false;
    return true;
  });

  const totalComida = filteredExpenses
    .filter(expense => expense.type === 'comida')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalOperativo = filteredExpenses
    .filter(expense => expense.type === 'operativo')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalGeneral = totalComida + totalOperativo;

  const exportToExcel = () => {
    const exportData = filteredExpenses.map(expense => ({
      'Fecha': format(new Date(expense.created_at), 'dd/MM/yyyy HH:mm'),
      'Tipo': expense.type === 'comida' ? 'Comida' : 'Operativo',
      'Monto': expense.amount,
      'Descripción': expense.description,
      'Registrado por': expense.created_by_name,
    }));

    // Agregar totales al final
    exportData.push({
      'Fecha': '',
      'Tipo': 'TOTAL COMIDA',
      'Monto': totalComida,
      'Descripción': '',
      'Registrado por': '',
    });
    exportData.push({
      'Fecha': '',
      'Tipo': 'TOTAL OPERATIVO',
      'Monto': totalOperativo,
      'Descripción': '',
      'Registrado por': '',
    });
    exportData.push({
      'Fecha': '',
      'Tipo': 'TOTAL GENERAL',
      'Monto': totalGeneral,
      'Descripción': '',
      'Registrado por': '',
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos');
    
    const dateRange = startDate && endDate ? `${startDate}_${endDate}` : format(new Date(), 'yyyy-MM-dd');
    const fileName = `gastos_${dateRange}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (isLoading) {
    return <div className="p-4">Cargando gastos...</div>;
  }

  return (
    <div className="space-y-4 p-2 sm:p-4">
      {/* Formulario para agregar gastos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registrar Nuevo Gasto
          </CardTitle>
          <CardDescription>
            Agrega un nuevo gasto al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                value={newExpense.type}
                onValueChange={(value: 'comida' | 'operativo') => 
                  setNewExpense(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de gasto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comida">Comida</SelectItem>
                  <SelectItem value="operativo">Operativo</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Monto"
                value={newExpense.amount}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                min="0"
                step="0.01"
              />
            </div>

            <Textarea
              placeholder="Descripción del gasto"
              value={newExpense.description}
              onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />

            <Button type="submit" disabled={isCreating} className="w-full sm:w-auto">
              {isCreating ? 'Registrando...' : 'Registrar Gasto'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Resumen y filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Comida</p>
                <p className="text-lg font-bold text-orange-600">
                  ${totalComida.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Operativo</p>
                <p className="text-lg font-bold text-blue-600">
                  ${totalOperativo.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total General</p>
                <p className="text-lg font-bold text-green-600">
                  ${totalGeneral.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="space-y-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Fecha inicio"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Fecha fin"
              />
            </div>
            <Button onClick={exportToExcel} variant="outline" size="sm" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de gastos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Gastos</CardTitle>
          <CardDescription>
            {filteredExpenses.length} gastos 
            {(startDate || endDate) && ` filtrados`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead className="hidden sm:table-cell">Descripción</TableHead>
                  <TableHead className="hidden md:table-cell">Registrado por</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-sm">
                      {format(new Date(expense.created_at), 'dd/MM/yy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={expense.type === 'comida' ? 'secondary' : 'outline'}
                        className={expense.type === 'comida' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}
                      >
                        {expense.type === 'comida' ? 'Comida' : 'Operativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell max-w-xs truncate">
                      {expense.description}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {expense.created_by_name}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExpense(expense.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredExpenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay gastos registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
