
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Order } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SalesHeatmapProps {
  orders: Order[];
}

type HeatmapMode = 'orders' | 'revenue' | 'avgTicket';

interface HeatmapCell {
  day: number;
  hour: number;
  dayName: string;
  orders: number;
  revenue: number;
  avgTicket: number;
  ordersList: Order[];
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const SalesHeatmap = ({ orders }: SalesHeatmapProps) => {
  const [mode, setMode] = useState<HeatmapMode>('orders');

  // Procesar datos del heatmap
  const heatmapData = useMemo(() => {
    // Crear matriz 7x24
    const matrix: HeatmapCell[][] = [];
    
    for (let day = 0; day < 7; day++) {
      matrix[day] = [];
      for (let hour = 0; hour < 24; hour++) {
        matrix[day][hour] = {
          day,
          hour,
          dayName: DAYS[day],
          orders: 0,
          revenue: 0,
          avgTicket: 0,
          ordersList: []
        };
      }
    }

    // Procesar órdenes
    orders.forEach(order => {
      const date = order.createdAt;
      const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
      const hour = date.getHours();
      
      const cell = matrix[dayOfWeek][hour];
      cell.orders += 1;
      cell.revenue += order.total;
      cell.ordersList.push(order);
    });

    // Calcular promedios
    matrix.forEach(dayRow => {
      dayRow.forEach(cell => {
        if (cell.orders > 0) {
          cell.avgTicket = cell.revenue / cell.orders;
        }
      });
    });

    return matrix;
  }, [orders]);

  // Calcular valores máximos para normalizar colores
  const maxValues = useMemo(() => {
    let maxOrders = 0;
    let maxRevenue = 0;
    let maxAvgTicket = 0;

    heatmapData.forEach(dayRow => {
      dayRow.forEach(cell => {
        maxOrders = Math.max(maxOrders, cell.orders);
        maxRevenue = Math.max(maxRevenue, cell.revenue);
        maxAvgTicket = Math.max(maxAvgTicket, cell.avgTicket);
      });
    });

    return { maxOrders, maxRevenue, maxAvgTicket };
  }, [heatmapData]);

  // Función para obtener intensidad de color (0-1)
  const getIntensity = (cell: HeatmapCell): number => {
    switch (mode) {
      case 'orders':
        return maxValues.maxOrders > 0 ? cell.orders / maxValues.maxOrders : 0;
      case 'revenue':
        return maxValues.maxRevenue > 0 ? cell.revenue / maxValues.maxRevenue : 0;
      case 'avgTicket':
        return maxValues.maxAvgTicket > 0 ? cell.avgTicket / maxValues.maxAvgTicket : 0;
      default:
        return 0;
    }
  };

  // Función para obtener el color basado en intensidad
  const getColor = (intensity: number): string => {
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 0.2) return 'bg-green-100';
    if (intensity < 0.4) return 'bg-green-200';
    if (intensity < 0.6) return 'bg-green-300';
    if (intensity < 0.8) return 'bg-green-400';
    return 'bg-green-500';
  };

  // Función para obtener el color del texto
  const getTextColor = (intensity: number): string => {
    return intensity > 0.6 ? 'text-white' : 'text-gray-700';
  };

  // Función para formatear valores
  const formatValue = (cell: HeatmapCell): string => {
    switch (mode) {
      case 'orders':
        return cell.orders.toString();
      case 'revenue':
        return cell.revenue > 0 ? `$${Math.round(cell.revenue / 1000)}k` : '0';
      case 'avgTicket':
        return cell.avgTicket > 0 ? `$${Math.round(cell.avgTicket / 1000)}k` : '0';
      default:
        return '0';
    }
  };

  // Función para obtener el título del tooltip
  const getTooltipTitle = (): string => {
    switch (mode) {
      case 'orders':
        return 'Órdenes';
      case 'revenue':
        return 'Ingresos';
      case 'avgTicket':
        return 'Ticket Promedio';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div>
            <CardTitle className="text-lg">Mapa de Calor de Ventas</CardTitle>
            <CardDescription className="text-sm">
              Patrones de actividad por día de la semana y hora del día
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={mode === 'orders' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('orders')}
            >
              Órdenes
            </Button>
            <Button
              variant={mode === 'revenue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('revenue')}
            >
              Ingresos
            </Button>
            <Button
              variant={mode === 'avgTicket' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('avgTicket')}
            >
              Ticket Prom.
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Encabezado de horas */}
              <div className="grid grid-cols-25 gap-1 mb-2">
                <div className="text-xs font-medium text-center py-1"></div>
                {HOURS.map(hour => (
                  <div key={hour} className="text-xs font-medium text-center py-1">
                    {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour-12}p`}
                  </div>
                ))}
              </div>
              
              {/* Filas de días */}
              {heatmapData.map((dayRow, dayIndex) => (
                <div key={dayIndex} className="grid grid-cols-25 gap-1 mb-1">
                  {/* Etiqueta del día */}
                  <div className="text-xs font-medium text-center py-2 flex items-center justify-center">
                    {DAYS[dayIndex]}
                  </div>
                  
                  {/* Celdas de horas */}
                  {dayRow.map((cell, hourIndex) => {
                    const intensity = getIntensity(cell);
                    const colorClass = getColor(intensity);
                    const textColorClass = getTextColor(intensity);
                    
                    return (
                      <Tooltip key={hourIndex}>
                        <TooltipTrigger asChild>
                          <div
                            className={`
                              ${colorClass} ${textColorClass}
                              border border-gray-200 rounded text-xs
                              h-8 flex items-center justify-center
                              cursor-pointer hover:opacity-80 transition-opacity
                              font-medium
                            `}
                          >
                            {formatValue(cell)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <div className="font-medium">
                              {cell.dayName} {cell.hour}:00 - {cell.hour + 1}:00
                            </div>
                            <div className="space-y-1 mt-2">
                              <div>Órdenes: <span className="font-medium">{cell.orders}</span></div>
                              <div>Ingresos: <span className="font-medium">${cell.revenue.toLocaleString()}</span></div>
                              {cell.orders > 0 && (
                                <div>Ticket Prom: <span className="font-medium">${Math.round(cell.avgTicket).toLocaleString()}</span></div>
                              )}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
              
              {/* Leyenda */}
              <div className="mt-4 flex items-center justify-center space-x-4">
                <span className="text-xs text-gray-600">Menos actividad</span>
                <div className="flex space-x-1">
                  <div className="w-4 h-4 bg-gray-100 border rounded"></div>
                  <div className="w-4 h-4 bg-green-100 border rounded"></div>
                  <div className="w-4 h-4 bg-green-200 border rounded"></div>
                  <div className="w-4 h-4 bg-green-300 border rounded"></div>
                  <div className="w-4 h-4 bg-green-400 border rounded"></div>
                  <div className="w-4 h-4 bg-green-500 border rounded"></div>
                </div>
                <span className="text-xs text-gray-600">Más actividad</span>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};
