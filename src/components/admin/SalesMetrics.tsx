
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, TrendingUp, DollarSign, Package, Clock, Minus, TrendingDown } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Order } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, LineChart } from "recharts";
import { useExpenses } from "@/hooks/useExpenses";
import * as XLSX from "xlsx";

interface SalesMetricsProps {
  orders: Order[];
}

export const SalesMetrics = ({ orders }: SalesMetricsProps) => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

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

    // Productos más vendidos por cantidad
    const productSales = filteredOrders.reduce((acc, order) => {
      order.items.forEach(item => {
        const key = `${item.productName} - ${item.variantName}`;
        if (!acc[key]) {
          acc[key] = { name: key, quantity: 0, revenue: 0 };
        }
        acc[key].quantity += item.quantity;
        acc[key].revenue += item.price * item.quantity;
      });
      return acc;
    }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

    const topProductsByQuantity = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Productos que más dinero generan
    const topProductsByRevenue = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

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
      topProductsByQuantity,
      topProductsByRevenue,
      dailyComparison,
      expensesByType: Object.values(expensesByType),
      paymentMethods: Object.values(paymentMethods)
    };
  }, [filteredOrders, filteredExpenses]);

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

    // Hoja de productos más vendidos
    const productsData = [
      ['Producto', 'Cantidad Vendida', 'Ingresos']
    ];
    metrics.topProductsByQuantity.forEach(product => {
      productsData.push([product.name, product.quantity.toString(), product.revenue.toString()]);
    });
    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Productos Más Vendidos');

    // Hoja de productos que más dinero generan
    const revenueProductsData = [
      ['Producto', 'Ingresos', 'Cantidad Vendida']
    ];
    metrics.topProductsByRevenue.forEach(product => {
      revenueProductsData.push([product.name, product.revenue.toString(), product.quantity.toString()]);
    });
    const revenueProductsSheet = XLSX.utils.aoa_to_sheet(revenueProductsData);
    XLSX.utils.book_append_sheet(workbook, revenueProductsSheet, 'Top Productos por Ingresos');

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

      {/* Análisis de productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Productos más vendidos por cantidad */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Productos Más Vendidos (Cantidad)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topProductsByQuantity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay datos de productos vendidos</p>
              ) : (
                metrics.topProductsByQuantity.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <span className="text-xl sm:text-2xl font-bold text-gray-400 flex-shrink-0">#{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{product.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{product.quantity} unidades vendidas</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm sm:text-base">${product.revenue.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">en ingresos</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Productos que más dinero generan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Productos por Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topProductsByRevenue.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay datos de productos</p>
              ) : (
                metrics.topProductsByRevenue.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <span className="text-xl sm:text-2xl font-bold text-green-600 flex-shrink-0">#{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{product.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{product.quantity} unidades vendidas</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm sm:text-base text-green-600">${product.revenue.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">ingresos totales</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
