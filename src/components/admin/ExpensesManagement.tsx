
import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Download, Plus, DollarSign, Utensils, Settings, X, ChevronDown, ChevronUp } from "lucide-react";
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ExpenseItem, DynamicExpenseForm } from '@/types';

export const ExpensesManagement = () => {
  const { expenses, isLoading, createExpense, deleteExpense, isCreating } = useExpenses();
  const [newExpense, setNewExpense] = useState<DynamicExpenseForm>({
    type: '',
    items: [{
      id: '1',
      description: '',
      quantity: 1,
      unitValue: 0,
      subtotal: 0
    }],
    total: 0
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const updateItemSubtotal = (itemId: string, quantity: number, unitValue: number) => {
    const subtotal = quantity * unitValue;
    setNewExpense(prev => {
      const updatedItems = prev.items.map(item =>
        item.id === itemId ? { ...item, quantity, unitValue, subtotal } : item
      );
      const total = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      return { ...prev, items: updatedItems, total };
    });
  };

  const addItem = () => {
    const newId = (newExpense.items.length + 1).toString();
    setNewExpense(prev => ({
      ...prev,
      items: [...prev.items, {
        id: newId,
        description: '',
        quantity: 1,
        unitValue: 0,
        subtotal: 0
      }]
    }));
  };

  const removeItem = (itemId: string) => {
    if (newExpense.items.length <= 1) return;
    
    setNewExpense(prev => {
      const updatedItems = prev.items.filter(item => item.id !== itemId);
      const total = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      return { ...prev, items: updatedItems, total };
    });
  };

  const generateDescription = (items: ExpenseItem[]): string => {
    return items
      .filter(item => item.description.trim() !== '')
      .map(item => `${item.description} (${item.quantity}x $${item.unitValue.toLocaleString()})`)
      .join(', ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.type || newExpense.items.length === 0 || newExpense.total === 0) {
      return;
    }

    const description = generateDescription(newExpense.items);
    if (!description.trim()) return;

    createExpense({
      type: newExpense.type as 'comida' | 'operativo',
      amount: newExpense.total,
      description: description,
    });

    setNewExpense({
      type: '',
      items: [{
        id: '1',
        description: '',
        quantity: 1,
        unitValue: 0,
        subtotal: 0
      }],
      total: 0
    });
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

  const toggleRowExpansion = (expenseId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(expenseId)) {
      newExpanded.delete(expenseId);
    } else {
      newExpanded.add(expenseId);
    }
    setExpandedRows(newExpanded);
  };

  if (isLoading) {
    return <div className="p-4">Cargando gastos...</div>;
  }

  return (
    <div className="space-y-4 p-2 sm:p-4">
      {/* Formulario para agregar gastos - MEJORADO con items dinámicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registrar Nuevo Gasto
          </CardTitle>
          <CardDescription>
            Agrega un nuevo gasto con múltiples items al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de tipo con botones */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de gasto</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={newExpense.type === 'comida' ? 'default' : 'outline'}
                  className={`h-12 flex items-center gap-2 ${
                    newExpense.type === 'comida' 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setNewExpense(prev => ({ ...prev, type: 'comida' }))}
                >
                  <Utensils className="h-4 w-4" />
                  Comida
                </Button>
                <Button
                  type="button"
                  variant={newExpense.type === 'operativo' ? 'default' : 'outline'}
                  className={`h-12 flex items-center gap-2 ${
                    newExpense.type === 'operativo' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                  }`}
                  onClick={() => setNewExpense(prev => ({ ...prev, type: 'operativo' }))}
                >
                  <Settings className="h-4 w-4" />
                  Operativo
                </Button>
              </div>
            </div>

            {/* Items dinámicos */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Items del gasto</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar item
                </Button>
              </div>
              
              {newExpense.items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                    {newExpense.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      placeholder="Descripción del item"
                      value={item.description}
                      onChange={(e) => {
                        const newDescription = e.target.value;
                        setNewExpense(prev => ({
                          ...prev,
                          items: prev.items.map(i =>
                            i.id === item.id ? { ...i, description: newDescription } : i
                          )
                        }));
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Cantidad"
                      value={item.quantity}
                      min="1"
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value) || 1;
                        updateItemSubtotal(item.id, quantity, item.unitValue);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Valor unitario"
                      value={item.unitValue}
                      min="0"
                      step="0.01"
                      onChange={(e) => {
                        const unitValue = parseFloat(e.target.value) || 0;
                        updateItemSubtotal(item.id, item.quantity, unitValue);
                      }}
                    />
                  </div>
                  
                  <div className="text-right">
                    <span className="text-sm text-gray-600">Subtotal: </span>
                    <span className="font-semibold text-green-600">
                      ${item.subtotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Total general */}
              <div className="border-t pt-2 text-right">
                <span className="text-lg font-semibold">Total: </span>
                <span className="text-xl font-bold text-green-600">
                  ${newExpense.total.toLocaleString()}
                </span>
              </div>
            </div>

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

      {/* Lista de gastos - MEJORADA descripción responsive */}
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
                  <TableHead>Descripción</TableHead>
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
                    <TableCell className="min-w-0 max-w-xs">
                      {/* Mobile: descripción collapsible */}
                      <div className="md:hidden">
                        <div className={`text-sm break-words ${
                          expandedRows.has(expense.id) ? '' : 'line-clamp-2'
                        }`}>
                          {expense.description}
                        </div>
                        {expense.description.length > 50 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(expense.id)}
                            className="h-6 px-2 mt-1 text-xs text-blue-600"
                          >
                            {expandedRows.has(expense.id) ? 
                              <>Ver menos <ChevronUp className="h-3 w-3 ml-1" /></> : 
                              <>Ver más <ChevronDown className="h-3 w-3 ml-1" /></>
                            }
                          </Button>
                        )}
                      </div>
                      
                      {/* Desktop: descripción completa */}
                      <div className="hidden md:block text-sm break-words">
                        {expense.description}
                      </div>
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
