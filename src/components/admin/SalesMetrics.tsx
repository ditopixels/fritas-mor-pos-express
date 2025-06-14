import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, TrendingUp, DollarSign, Package, Clock } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Order } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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

  const filteredOrders = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return orders;
    
    return orders.filter(order => 
      isWithinInterval(order.createdAt, {
        start: startOfDay(dateRange.from!),
        end: endOfDay(dateRange.to!)
      })
    );
  }, [orders, dateRange]);

  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalProducts = filteredOrders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    // Productos más vendidos
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

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Ingresos por día
    const dailyRevenue = filteredOrders.reduce((acc, order) => {
      const date = format(order.createdAt, 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { date: format(order.createdAt, 'dd/MM', { locale: es }), revenue: 0, orders: 0 };
      }
      acc[date].revenue += order.total;
      acc[date].orders += 1;
      return acc;
    }, {} as Record<string, { date: string; revenue: number; orders: number }>);

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
      topProducts,
      dailyRevenue: Object.values(dailyRevenue).sort((a, b) => a.date.localeCompare(b.date)),
      paymentMethods: Object.values(paymentMethods)
    };
  }, [filteredOrders]);

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Hoja de resumen
    const summaryData = [
      ['Métrica', 'Valor'],
      ['Período', `${format(dateRange.from!, 'dd/MM/yyyy')} - ${format(dateRange.to!, 'dd/MM/yyyy')}`],
      ['Total Ingresos', metrics.totalRevenue.toString()],
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

    // Hoja de productos más vendidos
    const productsData = [
      ['Producto', 'Cantidad Vendida', 'Ingresos']
    ];
    metrics.topProducts.forEach(product => {
      productsData.push([product.name, product.quantity.toString(), product.revenue.toString()]);
    });
    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Productos Más Vendidos');

    // Descargar archivo
    const fileName = `reporte-ventas-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Productos Vendidos</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{metrics.totalProducts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingresos Diarios</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ingresos']}
                />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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

      {/* Productos más vendidos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Productos Más Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.topProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay datos de productos vendidos</p>
            ) : (
              metrics.topProducts.map((product, index) => (
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
