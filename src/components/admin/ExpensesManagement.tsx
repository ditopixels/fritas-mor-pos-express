
import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Download, Plus, DollarSign, Utensils, Settings, X, ChevronDown, ChevronUp, Edit, Calendar } from "lucide-react";
import * as XLSX from 'xlsx';
import { format, isSameMonth, startOfMonth, endOfMonth } from 'date-fns';
import { ExpenseItem, DynamicExpenseForm } from '@/types';
import { Expense } from '@/hooks/useExpenses';

export const ExpensesManagement = () => {
  const { expenses, isLoading, createExpense, updateExpense, deleteExpense, isCreating, isUpdating, isCurrentMonth } = useExpenses();
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
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState<{
    type: 'comida' | 'operativo' | 'mejoras';
    amount: number;
    description: string;
  }>({
    type: 'comida',
    amount: 0,
    description: ''
  });

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

  const isDateInCurrentMonth = (dateString: string) => {
    const selectedDate = new Date(dateString);
    const currentDate = new Date();
    return isSameMonth(selectedDate, currentDate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.type || newExpense.items.length === 0 || newExpense.total === 0) {
      return;
    }

    // Verificar que la fecha seleccionada sea del mes actual
    if (!isDateInCurrentMonth(expenseDate)) {
      alert('Solo puedes registrar gastos del mes actual');
      return;
    }

    const description = generateDescription(newExpense.items);
    if (!description.trim()) return;

    createExpense({
      type: newExpense.type as 'comida' | 'operativo' | 'mejoras',
      amount: newExpense.total,
      description: description,
      created_at: expenseDate + 'T' + format(new Date(), 'HH:mm:ss') + '.000Z',
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
    setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditForm({
      type: expense.type,
      amount: expense.amount,
      description: expense.description
    });
  };

  const handleUpdateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    updateExpense({
      id: editingExpense.id,
      type: editForm.type,
      amount: editForm.amount,
      description: editForm.description,
    });

    setEditingExpense(null);
  };

  const handleDelete = (expense: Expense) => {
    if (!isCurrentMonth(expense.created_at)) {
      alert('Solo puedes eliminar gastos del mes actual');
      return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      deleteExpense(expense.id);
    }
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

  const totalMejoras = filteredExpenses
    .filter(expense => expense.type === 'mejoras')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalGeneral = totalComida + totalOperativo + totalMejoras;

  const exportToExcel = () => {
    const exportData = filteredExpenses.map(expense => ({
      'Fecha': format(new Date(expense.created_at), 'dd/MM/yyyy HH:mm'),
      'Tipo': expense.type === 'comida' ? 'Comida' : expense.type === 'mejoras' ? 'Mejoras' : 'Operativo',
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
      'Tipo': 'TOTAL MEJORAS',
      'Monto': totalMejoras,
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
            {/* Selector de fecha */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha del gasto
              </label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                max={format(endOfMonth(new Date()), 'yyyy-MM-dd')}
                min={format(startOfMonth(new Date()), 'yyyy-MM-dd')}
                className={`${!isDateInCurrentMonth(expenseDate) ? 'border-red-500' : ''}`}
              />
              {!isDateInCurrentMonth(expenseDate) && (
                <p className="text-sm text-red-600">Solo puedes registrar gastos del mes actual</p>
              )}
            </div>

            {/* Selector de tipo con botones */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de gasto</label>
              <div className="grid grid-cols-3 gap-2">
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
                <Button
                  type="button"
                  variant={newExpense.type === 'mejoras' ? 'default' : 'outline'}
                  className={`h-12 flex items-center gap-2 ${
                    newExpense.type === 'mejoras' 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                  }`}
                  onClick={() => setNewExpense(prev => ({ ...prev, type: 'mejoras' }))}
                >
                  <Settings className="h-4 w-4" />
                  Mejoras
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <p className="text-sm text-muted-foreground">Total Mejoras</p>
                <p className="text-lg font-bold text-purple-600">
                  ${totalMejoras.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
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
                        className={
                          expense.type === 'comida' ? 'bg-orange-100 text-orange-800' : 
                          expense.type === 'mejoras' ? 'bg-purple-100 text-purple-800' : 
                          'bg-blue-100 text-blue-800'
                        }
                      >
                        {expense.type === 'comida' ? 'Comida' : expense.type === 'mejoras' ? 'Mejoras' : 'Operativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="min-w-0">
                      {/* Mobile: descripción collapsible */}
                      <div className="sm:hidden">
                        <div className="flex items-center gap-2">
                          <div className={`${
                            expandedRows.has(expense.id) ? '' : 'truncate'
                          } text-sm`}>
                            {expandedRows.has(expense.id) 
                              ? expense.description 
                              : expense.description.length > 30 
                                ? expense.description.substring(0, 30) + '...'
                                : expense.description
                            }
                          </div>
                          {expense.description.length > 30 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(expense.id)}
                              className="h-6 w-6 p-0 flex-shrink-0"
                            >
                              {expandedRows.has(expense.id) ? 
                                <ChevronUp className="h-3 w-3" /> : 
                                <ChevronDown className="h-3 w-3" />
                              }
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Desktop: descripción completa */}
                      <div className="hidden sm:block text-sm break-words">
                        {expense.description}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {expense.created_by_name}
                    </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-1">
                         {isCurrentMonth(expense.created_at) && (
                           <>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleEdit(expense)}
                               className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                             >
                               <Edit className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleDelete(expense)}
                               className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </>
                         )}
                         {!isCurrentMonth(expense.created_at) && (
                           <span className="text-xs text-gray-400">Mes anterior</span>
                         )}
                       </div>
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

      {/* Modal de edición */}
      <Dialog open={!!editingExpense} onOpenChange={() => setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Gasto</DialogTitle>
            <DialogDescription>
              Modifica los detalles del gasto seleccionado
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateExpense} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de gasto</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={editForm.type === 'comida' ? 'default' : 'outline'}
                  className={`h-12 flex items-center gap-2 ${
                    editForm.type === 'comida' 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setEditForm(prev => ({ ...prev, type: 'comida' }))}
                >
                  <Utensils className="h-4 w-4" />
                  Comida
                </Button>
                <Button
                  type="button"
                  variant={editForm.type === 'operativo' ? 'default' : 'outline'}
                  className={`h-12 flex items-center gap-2 ${
                    editForm.type === 'operativo' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                  }`}
                  onClick={() => setEditForm(prev => ({ ...prev, type: 'operativo' }))}
                >
                  <Settings className="h-4 w-4" />
                  Operativo
                </Button>
                <Button
                  type="button"
                  variant={editForm.type === 'mejoras' ? 'default' : 'outline'}
                  className={`h-12 flex items-center gap-2 ${
                    editForm.type === 'mejoras' 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                  }`}
                  onClick={() => setEditForm(prev => ({ ...prev, type: 'mejoras' }))}
                >
                  <Settings className="h-4 w-4" />
                  Mejoras
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Monto</label>
              <Input
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setEditingExpense(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Actualizando...' : 'Actualizar Gasto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
