import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Download, TrendingUp, DollarSign, Package, Clock, Minus, TrendingDown, Search, ChevronDown, ChevronUp } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Order } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart } from "recharts";
import { useExpenses } from "@/hooks/useExpenses";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { RecentOrdersList } from "./RecentOrdersList";
import { SalesHeatmap } from "./SalesHeatmap";
import * as XLSX from "xlsx";

interface SalesMetricsProps {
  orders: Order[];
}

interface ProductSalesData {
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  totalQuantity: number;
  totalRevenue: number;
  variants: {
    variantId: string;
    variantName: string;
    quantity: number;
    revenue: number;
  }[];
  hasVariants: boolean;
}

type SortField = 'name' | 'quantity' | 'revenue';
type SortDirection = 'asc' | 'desc';

export const SalesMetrics = ({ orders }: SalesMetricsProps) => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  // Estados para la grid de productos
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('quantity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showZeroSales, setShowZeroSales] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const { expenses } = useExpenses();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();

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

  // Crear datos de ventas por producto
  const productSalesData = useMemo(() => {
    if (!products) return [];

    console.log('Processing product sales data...');
    console.log('Products:', products.length);
    console.log('Filtered orders:', filteredOrders.length);

    // Crear mapa de ventas por producto/variante
    const salesMap = new Map<string, { quantity: number; revenue: number }>();

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        
        // Si tiene variantId, usar eso, sino usar el productId
        const key = item.sku.split("-default")[0]
        
        console.log('Processing item:', {
          productId: item.id,
          variantId: item.sku,
          quantity: item.quantity,
          price: item.price,
          item,
          key
        });
        if (!salesMap.has(key)) {
          salesMap.set(key, { quantity: 0, revenue: 0 });
        }
        
        const currentSales = salesMap.get(key)!;
        currentSales.quantity += item.quantity;
        currentSales.revenue += item.price * item.quantity;
      });
    });

    console.log('Sales map:', Array.from(salesMap.entries()));

    // Procesar cada producto del catálogo
    const productSales: ProductSalesData[] = [];

    products.forEach(product => {
      const category = categories?.find(cat => cat.id === product.category_id);
      
      let totalQuantity = 0;
      let totalRevenue = 0;
      const variants: ProductSalesData['variants'] = [];

      if (product.variants && product.variants.length > 0) {
        // Producto con variantes
        product.variants.forEach(variant => {
          const salesData = salesMap.get(variant.sku);
          const quantity = salesData?.quantity || 0;
          const revenue = salesData?.revenue || 0;

          totalQuantity += quantity;
          totalRevenue += revenue;

          variants.push({
            variantId: variant.sku,
            variantName: variant.name,
            quantity,
            revenue
          });
        });
      } else {
        // Producto sin variantes
        const salesData = salesMap.get(product.id);
        const quantity = salesData?.quantity || 0;
        const revenue = salesData?.revenue || 0;

        totalQuantity = quantity;
        totalRevenue = revenue;

        variants.push({
          variantId: product.id,
          variantName: "Sin variación",
          quantity,
          revenue
        });
      }

      productSales.push({
        productId: product.id,
        productName: product.name,
        categoryId: product.category_id || '',
        categoryName: category?.name || 'Sin categoría',
        totalQuantity,
        totalRevenue,
        variants,
        hasVariants: product.variants && product.variants.length > 0
      });
    });

    console.log('Final product sales:', productSales);
    return productSales;
  }, [products, categories, filteredOrders]);

  // Calcular métricas generales
  const salesMetrics = useMemo(() => {
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
      dailyComparison,
      expensesByType: Object.values(expensesByType),
      paymentMethods: Object.values(paymentMethods)
    };
  }, [filteredOrders, filteredExpenses]);

  // Filtrar y procesar productos para mostrar
  const processedProducts = useMemo(() => {
    let filtered = productSalesData;
    // Filtrar por categoría
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }

    // Filtrar productos sin ventas si está deshabilitado
    if (!showZeroSales) {
      filtered = filtered.filter(product => product.totalQuantity > 0);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.productName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'name':
          aValue = a.productName;
          bValue = b.productName;
          break;
        case 'quantity':
          aValue = a.totalQuantity;
          bValue = b.totalQuantity;
          break;
        case 'revenue':
          aValue = a.totalRevenue;
          bValue = b.totalRevenue;
          break;
        default:
          aValue = a.totalQuantity;
          bValue = b.totalQuantity;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const multiplier = sortDirection === 'asc' ? 1 : -1;
        return aValue.localeCompare(bValue) * multiplier;
      } else {
        const multiplier = sortDirection === 'asc' ? 1 : -1;
        return ((aValue as number) - (bValue as number)) * multiplier;
      }
    });

    return filtered;
  }, [productSalesData, selectedCategory, showZeroSales, searchTerm, sortField, sortDirection]);

  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Hoja de resumen
    const summaryData = [
      ['Métrica', 'Valor'],
      ['Período', `${format(dateRange.from!, 'dd/MM/yyyy')} - ${format(dateRange.to!, 'dd/MM/yyyy')}`],
      ['Total Ingresos', salesMetrics.totalRevenue.toString()],
      ['Total Gastos', salesMetrics.totalExpenses.toString()],
      ['Ganancia Neta', salesMetrics.netProfit.toString()],
      ['Margen de Ganancia (%)', salesMetrics.profitMargin.toFixed(2)],
      ['Total Órdenes', salesMetrics.totalOrders.toString()],
      ['Ticket Promedio', salesMetrics.averageTicket.toString()],
      ['Total Productos Vendidos', salesMetrics.totalProducts.toString()]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // Hoja de ventas por productos
    const productsData = [
      ['Producto', 'Categoría', 'Variación', 'Cantidad Vendida', 'Ingresos']
    ];
    productSalesData.forEach(product => {
      product.variants.forEach(variant => {
        productsData.push([
          product.productName,
          product.categoryName,
          variant.variantName,
          variant.quantity.toString(),
          variant.revenue.toString()
        ]);
      });
    });
    const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Ventas por Productos');

    // Descargar archivo
    const fileName = `reporte-ventas-productos-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
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
            <div className="text-lg sm:text-2xl font-bold text-green-600">${salesMetrics.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Gastos Totales</CardTitle>
            <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-red-600">${salesMetrics.totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Ganancia Neta</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-lg sm:text-2xl font-bold ${salesMetrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${salesMetrics.netProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Margen (%)</CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-lg sm:text-2xl font-bold ${salesMetrics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {salesMetrics.profitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Órdenes</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{salesMetrics.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Ticket Promedio</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">${Math.round(salesMetrics.averageTicket).toLocaleString()}</div>
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
              <ComposedChart data={salesMetrics.dailyComparison}>
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
                  data={salesMetrics.expensesByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {salesMetrics.expensesByType.map((entry, index) => (
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
                  data={salesMetrics.paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {salesMetrics.paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Mapa de Calor de Horarios - Nuevo componente */}
      <SalesHeatmap orders={filteredOrders} />

      {/* Grid de ventas por productos con tabs por categorías */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ventas por Productos</CardTitle>
          <CardDescription>
            Análisis de ventas por producto y variación ({processedProducts.length} productos)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controles de búsqueda y filtros */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <Button
                  variant={showZeroSales ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowZeroSales(!showZeroSales)}
                >
                  {showZeroSales ? 'Ocultar sin ventas' : 'Mostrar sin ventas'}
                </Button>
                <Button
                  variant={sortField === 'quantity' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSortField('quantity');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Por Cantidad
                </Button>
                <Button
                  variant={sortField === 'revenue' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSortField('revenue');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Por Ingresos
                </Button>
                <Button
                  variant={sortField === 'name' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSortField('name');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Por Nombre
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs por categorías */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 mb-6">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {categories?.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-0">
              {/* Grid de productos */}
              {processedProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No hay productos para mostrar</p>
                  <p className="text-sm">
                    {searchTerm ? 'No se encontraron productos que coincidan con la búsqueda' : 
                     !showZeroSales ? 'No hay productos con ventas en este período' : 
                     'No hay productos en esta categoría'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {processedProducts.map((product) => (
                    <Card key={product.productId} className={`${product.totalQuantity === 0 ? 'opacity-60' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base line-clamp-2">{product.productName}</CardTitle>
                          {product.hasVariants && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleProductExpansion(product.productId)}
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              {expandedProducts.has(product.productId) ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                              }
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{product.categoryName}</p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {/* Totales del producto */}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Cantidad Total:</span>
                            <span className={`font-semibold ${product.totalQuantity === 0 ? 'text-gray-400' : 'text-blue-600'}`}>
                              {product.totalQuantity}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Ingresos Total:</span>
                            <span className={`font-semibold ${product.totalQuantity === 0 ? 'text-gray-400' : 'text-green-600'}`}>
                              ${product.totalRevenue.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Desglose de variantes */}
                        {product.hasVariants && expandedProducts.has(product.productId) && (
                          <div className="border-t pt-3 space-y-2">
                            <p className="text-xs font-medium text-gray-700 mb-2">Desglose por variantes:</p>
                            {product.variants.map((variant) => (
                              <div key={variant.variantId} className="bg-gray-50 p-2 rounded text-xs">
                                <div className="font-medium mb-1">{variant.variantName}</div>
                                <div className="flex justify-between">
                                  <span>Cantidad: <span className="font-semibold">{variant.quantity}</span></span>
                                  <span>Ingresos: <span className="font-semibold text-green-600">${variant.revenue.toLocaleString()}</span></span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Para productos sin variantes pero expandido */}
                        {!product.hasVariants && expandedProducts.has(product.productId) && (
                          <div className="border-t pt-3">
                            <div className="bg-gray-50 p-2 rounded text-xs">
                              <div className="font-medium mb-1">{product.variants[0]?.variantName}</div>
                              <div className="flex justify-between">
                                <span>Cantidad: <span className="font-semibold">{product.variants[0]?.quantity}</span></span>
                                <span>Ingresos: <span className="font-semibold text-green-600">${product.variants[0]?.revenue.toLocaleString()}</span></span>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Lista de órdenes recientes con paginación */}
      <RecentOrdersList dateRange={dateRange} />
    </div>
  );
};
