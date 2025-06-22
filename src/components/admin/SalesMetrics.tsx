
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Download, TrendingUp, DollarSign, Package, Clock, Minus, TrendingDown, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Order } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, LineChart } from "recharts";
import { useExpenses } from "@/hooks/useExpenses";
import * as XLSX from "xlsx";

interface SalesMetricsProps {
  orders: Order[];
}

interface ProductSalesData {
  productName: string;
  variantName: string;
  quantity: number;
  revenue: number;
  fullName: string; // Para búsqueda
}

type SortField = 'quantity' | 'revenue';
type SortDirection = 'asc' | 'desc';

export const SalesMetrics = ({ orders }: SalesMetricsProps) => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  // Estados para la tabla de productos
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('quantity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { expenses } = useExpenses();

  const filteredOrders = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return orders;
    
    return orders.filter(order => 
      isWithinInterval(order.createdAt, {
        start: startOfDay(dateRange.from!),
        end: endOfDay(dateRange.to!)
      })
    );
  }, [orders, dateRange]);

  const filteredExpenses = useMemo(() => {
    if (!dateRange.from || !dateRange.to || !expenses) return [];
    
    return expenses.filter(expense => 
      isWithinInterval(new Date(expense.created_at), {
        start: startOfDay(dateRange.from!),
        end: endOfDay(dateRange.to!)
      })
    );
  }, [expenses, dateRange]);

  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalProducts = filteredOrders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    // Gastos totales
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Ventas por productos - TODOS los productos con diferenciación de variantes
    const productSales = filteredOrders.reduce((acc, order) => {
      order.items.forEach(item => {
        const key = `${item.productName}|||${item.variantName}`;
        if (!acc[key]) {
          acc[key] = { 
            productName: item.productName,
            variantName: item.variantName,
            quantity: 0, 
            revenue: 0,
            fullName: `${item.productName} - ${item.variantName}`
          };
        }
        acc[key].quantity += item.quantity;
        acc[key].revenue += item.price * item.quantity;
      });
      return acc;
    }, {} as Record<string, ProductSalesData>);

    const allProductSales = Object.values(productSales);

    // Ingresos por día
    const dailyRevenue = filteredOrders.reduce((acc, order) => {
      const date = format(order.createdAt, 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { date: format(order.createdAt, 'dd/MM', { locale: es }), revenue: 0, orders: 0, expenses: 0 };
      }
      acc[date].revenue += order.total;
      acc[date].orders += 1;
      return acc;
    }, {} as Record<string, { date: string; revenue: number; orders: number; expenses: number }>);

    // Gastos por día
    filteredExpenses.forEach(expense => {
      const date = format(new Date(expense.created_at), 'yyyy-MM-dd');
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { 
          date: format(new Date(expense.created_at), 'dd/MM', { locale: es }), 
          revenue: 0, 
          orders: 0, 
          expenses: 0 
        };
      }
      dailyRevenue[date].expenses += expense.amount;
    });

    // Agregar ganancia neta diaria
    const dailyComparison = Object.values(dailyRevenue)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => ({
        ...day,
        netProfit: day.revenue - day.expenses
      }));

    // Gastos por tipo
    const expensesByType = filteredExpenses.reduce((acc, expense) => {
      const type = expense.type === 'comida' ? 'Comida' : 'Operativo';
      if (!acc[type]) {
        acc[type] = { name: type, value: 0, count: 0 };
      }
      acc[type].value += expense.amount;
      acc[type].count += 1;
      return acc;
    }, {} as Record<string, { name: string; value: number; count: number }>);

    // Ingresos por método de pago
    const paymentMethods = filteredOrders.reduce((acc, order) => {
      const method = order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia';
      if (!acc[method]) {
        acc[method] = { name: method, value: 0, count: 0 };
      }
      acc[method].value += order.total;
      acc[method].count += 1;
      return acc;
    }, {} as Record<string, { name: string; value: number; count: number }>);

    return {
      totalRevenue,
      totalOrders,
      averageTicket,
      totalProducts,
      totalExpenses,
      netProfit,
      profitMargin,
      allProductSales,
      dailyComparison,
      expensesByType: Object.values(expensesByType),
      paymentMethods: Object.values(paymentMethods)
    };
  }, [filteredOrders, filteredExpenses]);

  // Lógica para filtrar, ordenar y paginar productos
  const processedProductSales = useMemo(() => {
    let filtered = metrics.allProductSales;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      return (aValue - bValue) * multiplier;
    });

    return filtered;
  }, [metrics.allProductSales, searchTerm, sortField, sortDirection]);

  // Paginación
  const totalPages = Math.ceil(processedProductSales.length / itemsPerPage);
  const paginatedProducts = processedProductSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Hoja de resumen
    const summaryData = [
      ['Métrica', 'Valor'],
      ['Período', `${format(dateRange.from!, 'dd/MM/yyyy')} - ${format(dateRange.to!, 'dd/MM/yyyy')}`],
      ['Total Ingresos', metrics.totalRevenue.toString()],
      ['Total Gastos', metrics.totalExpenses.toString()],
      ['Ganancia Neta', metrics.netProfit.toString()],
      ['Margen de Ganancia (%)', metrics.profitMargin.toFixed(2)],
      ['Total Órdenes', metrics.totalOrders.toString()],
      ['Ticket Promedio', metrics.averageTicket.toString()],
      ['Total Productos Vendidos', metrics.totalProducts.toString()]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // Hoja de órdenes detalladas
    const ordersData = [
      ['Fecha', 'Número de Orden', 'Cliente', 'Método de Pago', 'Productos', 'Total']
    ];
    filteredOrders.forEach(order => {
      ordersData.push([
        format(order.createdAt, 'dd/MM/yyyy HH:mm'),
        `ORD-${order.id.slice(-8)}`,
        order.customerName,
        order.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia',
        order.items.length.toString(),
        order.total.toString()
      ]);
    });
    const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Órdenes');

    // Hoja de gastos
    const expensesData = [
      ['Fecha', 'Tipo', 'Descripción', 'Monto', 'Creado por']
    ];
    filteredExpenses.forEach(expense => {
      expensesData.push([
        format(new Date(expense.created_at), 'dd/MM/yyyy HH:mm'),
        expense.type === 'comida' ? 'Comida' : 'Operativo',
        expense.description,
        expense.amount.toString(),
        expense.created_by_name
      ]);
    });
    const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Gastos');

    // Hoja de productos - COMPLETA
    const productsData = [
      ['Producto', 'Variación', 'Cantidad Vendida', 'Ingresos']
    ];
    metrics.allProductSales.forEach(product => {
      productsData.push([
        product.productName,
        product.variantName,
        product.quantity.toString(),
        product.revenue.toString()
      ]);
    });
    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Ventas por Productos');

    // Descargar archivo
    const fileName = `reporte-ventas-completo-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Selector de período */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div>
              <CardTitle className="text-lg sm:text-xl">Métricas de Ventas</CardTitle>
              <CardDescription className="text-sm">
                Análisis detallado del rendimiento del negocio
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="text-xs sm:text-sm">
                      {dateRange.from && dateRange.to
                        ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
                        : 'Seleccionar período'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="flex flex-col sm:flex-row">
                    <div className="p-3">
                      <div className="text-sm font-medium mb-2">Fecha de inicio</div>
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                        locale={es}
                      />
                    </div>
                    <div className="p-3 border-t sm:border-t-0 sm:border-l">
                      <div className="text-sm font-medium mb-2">Fecha final</div>
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                        locale={es}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button onClick={exportToExcel} size="sm" className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                <span className="text-xs sm:text-sm">Exportar Excel</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-green-600">${metrics.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Gastos Totales</CardTitle>
            <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-red-600">${metrics.totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Ganancia Neta</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-lg sm:text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${metrics.netProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Margen (%)</CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-lg sm:text-2xl font-bold ${metrics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.profitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Órdenes</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{metrics.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Ticket Promedio</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">${Math.round(metrics.averageTicket).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Comparación Diaria: Ingresos vs Gastos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Comparación Diaria: Ingresos vs Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={metrics.dailyComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const label = name === 'revenue' ? 'Ingresos' : 
                                 name === 'expenses' ? 'Gastos' : 'Ganancia Neta';
                    return [`$${value.toLocaleString()}`, label];
                  }}
                />
                <Bar dataKey="revenue" fill="#10b981" name="revenue" />
                <Bar dataKey="expenses" fill="#ef4444" name="expenses" />
                <Bar dataKey="netProfit" fill="#6366f1" name="netProfit" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gastos por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gastos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={metrics.expensesByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metrics.expensesByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Métodos de Pago */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Métodos de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={metrics.paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metrics.paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Nueva tabla completa de ventas por productos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ventas por Productos</CardTitle>
          <CardDescription>
            Análisis completo de ventas por producto y variación con {processedProductSales.length} resultados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controles de búsqueda y filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar producto o variación..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortField === 'quantity' && sortDirection === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('quantity')}
                className="flex items-center gap-2"
              >
                {getSortIcon('quantity')}
                Por Cantidad
              </Button>
              <Button
                variant={sortField === 'revenue' && sortDirection === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('revenue')}
                className="flex items-center gap-2"
              >
                {getSortIcon('revenue')}
                Por Ingresos
              </Button>
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center gap-2">
                      Producto
                      {sortField === 'quantity' && getSortIcon('quantity')}
                    </div>
                  </TableHead>
                  <TableHead>Variación</TableHead>
                  <TableHead 
                    className="text-center cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      Cantidad
                      {sortField === 'quantity' && getSortIcon('quantity')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('revenue')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Ingresos
                      {sortField === 'revenue' && getSortIcon('revenue')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No se encontraron productos que coincidan con la búsqueda' : 'No hay datos de productos vendidos'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product, index) => (
                    <TableRow key={`${product.productName}-${product.variantName}`} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {product.productName}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {product.variantName}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {product.quantity}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ${product.revenue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, processedProductSales.length)} de {processedProductSales.length} productos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de órdenes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimas Órdenes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {filteredOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay órdenes en el período seleccionado</p>
            ) : (
              filteredOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 sm:p-4 border rounded">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base">ORD-{order.id.slice(-8)}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{order.customerName}</p>
                    <p className="text-xs text-gray-400">{format(order.createdAt, 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm sm:text-base">${order.total.toLocaleString()}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{order.items.length} productos</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
