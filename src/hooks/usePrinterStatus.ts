import { useState, useEffect, useCallback, useRef } from 'react';

interface PrinterStatus {
  isConnected: boolean;
  printerName: string | null;
  isChecking: boolean;
  lastCheck: Date | null;
}

export const usePrinterStatus = () => {
  const [status, setStatus] = useState<PrinterStatus>({
    isConnected: false,
    printerName: null,
    isChecking: false,
    lastCheck: null,
  });

  const PRINTER_API_URL = 'http://localhost:8000';
  const PREFERRED_PRINTER = 'lasfritas';
  const CHECK_INTERVAL = 30000; // 30 segundos
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);
  const mountedRef = useRef(true);
  const hasInitialCheckRef = useRef(false);

  const clearCheckInterval = useCallback(() => {
    if (intervalRef.current) {
      console.log('🔄 Deteniendo verificaciones periódicas de impresora');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCheckInterval = useCallback(() => {
    clearCheckInterval(); // Limpiar cualquier intervalo existente
    
    console.log('🔄 Iniciando verificaciones periódicas de impresora (cada 30s)');
    intervalRef.current = setInterval(() => {
      if (!isCheckingRef.current && mountedRef.current) {
        checkPrinterStatus();
      }
    }, CHECK_INTERVAL);
  }, []);

  const checkPrinterStatus = useCallback(async () => {
    // Evitar verificaciones simultáneas
    if (isCheckingRef.current || !mountedRef.current) {
      console.log('Verificación saltada - ya en curso o componente desmontado');
      return;
    }

    isCheckingRef.current = true;
    
    // Solo actualizar isChecking si el componente está montado
    if (mountedRef.current) {
      setStatus(prev => ({ ...prev, isChecking: true }));
    }
    
    try {
      console.log('🔍 Verificando estado de impresora...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${PRINTER_API_URL}/impresoras`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok && mountedRef.current) {
        const printers = await response.json();
        console.log('📄 Impresoras disponibles:', printers);
        
        let selectedPrinter = null;
        
        if (Array.isArray(printers) && printers.length > 0) {
          selectedPrinter = printers.find((p: any) => 
            p.nombre?.toLowerCase().includes(PREFERRED_PRINTER.toLowerCase())
          );
          
          if (!selectedPrinter) {
            selectedPrinter = printers[0];
          }
        }
        
        const isConnected = !!selectedPrinter;
        const newStatus = {
          isConnected,
          printerName: selectedPrinter?.nombre || null,
          isChecking: false,
          lastCheck: new Date(),
        };
        
        console.log('✅ Estado de impresora actualizado:', {
          connected: isConnected,
          printer: selectedPrinter?.nombre
        });
        
        setStatus(newStatus);
        
        // Si la impresora se conectó, detener verificaciones periódicas
        if (isConnected) {
          console.log('🎯 Impresora conectada - deteniendo verificaciones periódicas');
          clearCheckInterval();
        }
        // Si la impresora se desconectó y no hay intervalo activo, iniciarlo
        else if (!intervalRef.current) {
          console.log('❌ Impresora desconectada - iniciando verificaciones periódicas');
          startCheckInterval();
        }
        
      } else if (mountedRef.current) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log('❌ Error al verificar impresora:', error);
      if (mountedRef.current) {
        const disconnectedStatus = {
          isConnected: false,
          printerName: null,
          isChecking: false,
          lastCheck: new Date(),
        };
        
        setStatus(disconnectedStatus);
        
        // Si hay error y no hay intervalo activo, iniciarlo para reintentar
        if (!intervalRef.current) {
          console.log('❌ Error de conexión - iniciando verificaciones periódicas para reintentar');
          startCheckInterval();
        }
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [clearCheckInterval, startCheckInterval]);

  const printInvoice = useCallback(async (orderData: any, type: 'cliente' | 'tienda') => {
    console.log('🖨️ Iniciando printInvoice - Estado actual:', status);
    
    // Obtener el estado más actual directamente
    if (!status.isConnected || !status.printerName) {
      console.error('❌ Impresora no conectada:', { 
        connected: status.isConnected, 
        printer: status.printerName 
      });
      throw new Error('Impresora no conectada');
    }

    try {
      console.log(`📝 Imprimiendo factura ${type} para orden:`, orderData.order_number);
      console.log('🖨️ Usando impresora:', status.printerName);
      
      const invoiceData = {
        impresora: status.printerName,
        operaciones: [
          // Header
          { tipo: 'texto', texto: '='.repeat(32), alineacion: 'centro' },
          { tipo: 'texto', texto: 'LAS FRITAS MOR', alineacion: 'centro', negrita: true },
          { tipo: 'texto', texto: '='.repeat(32), alineacion: 'centro' },
          { tipo: 'texto', texto: `FACTURA - ${type.toUpperCase()}`, alineacion: 'centro' },
          { tipo: 'texto', texto: '-'.repeat(32) },
          
          // Información de la orden
          { tipo: 'texto', texto: `Orden: ${orderData.order_number}` },
          { tipo: 'texto', texto: `Cliente: ${orderData.customer_name}` },
          { tipo: 'texto', texto: `Fecha: ${new Date(orderData.created_at).toLocaleString('es-ES')}` },
          { tipo: 'texto', texto: `Pago: ${orderData.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}` },
          { tipo: 'texto', texto: '-'.repeat(32) },
          
          // Items
          { tipo: 'texto', texto: 'PRODUCTOS:', negrita: true },
          ...orderData.order_items.map((item: any) => [
            { tipo: 'texto', texto: `${item.product_name}` },
            { tipo: 'texto', texto: `  ${item.variant_name}` },
            { tipo: 'texto', texto: `  ${item.quantity} x $${item.price.toLocaleString()} = $${(item.quantity * item.price).toLocaleString()}`, alineacion: 'derecha' },
          ]).flat(),
          
          { tipo: 'texto', texto: '-'.repeat(32) },
          
          // Totales
          { tipo: 'texto', texto: `Subtotal: $${orderData.subtotal.toLocaleString()}`, alineacion: 'derecha' },
          ...(orderData.total_discount > 0 ? [
            { tipo: 'texto', texto: `Descuentos: -$${orderData.total_discount.toLocaleString()}`, alineacion: 'derecha' }
          ] : []),
          { tipo: 'texto', texto: `TOTAL: $${orderData.total.toLocaleString()}`, alineacion: 'derecha', negrita: true },
          
          // Información de pago
          ...(orderData.payment_method === 'cash' && orderData.cash_received ? [
            { tipo: 'texto', texto: `Recibido: $${orderData.cash_received.toLocaleString()}`, alineacion: 'derecha' },
            { tipo: 'texto', texto: `Cambio: $${(orderData.cash_received - orderData.total).toLocaleString()}`, alineacion: 'derecha' },
          ] : []),
          
          { tipo: 'texto', texto: '='.repeat(32), alineacion: 'centro' },
          { tipo: 'texto', texto: type === 'cliente' ? '¡Gracias por su compra!' : 'COPIA TIENDA', alineacion: 'centro' },
          { tipo: 'texto', texto: '='.repeat(32), alineacion: 'centro' },
          
          // Espacios en blanco y corte
          { tipo: 'texto', texto: '' },
          { tipo: 'texto', texto: '' },
          { tipo: 'corte', lineas: 3 },
        ]
      };

      console.log('📤 Enviando datos de impresión:', invoiceData);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${PRINTER_API_URL}/imprimir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta del servidor:', errorText);
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }

      console.log(`✅ Factura ${type} impresa exitosamente`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error al imprimir factura ${type}:`, error);
      throw error;
    }
  }, [status.isConnected, status.printerName]);

  // Efecto para la verificación inicial y manejo de intervalos
  useEffect(() => {
    console.log('🔄 Inicializando usePrinterStatus...');
    mountedRef.current = true;
    
    // Solo hacer verificación inicial si no se ha hecho antes
    if (!hasInitialCheckRef.current) {
      hasInitialCheckRef.current = true;
      console.log('🎯 Realizando verificación inicial de impresora...');
      checkPrinterStatus();
    }

    return () => {
      console.log('🧹 Limpiando usePrinterStatus...');
      mountedRef.current = false;
      clearCheckInterval();
      isCheckingRef.current = false;
    };
  }, []); // Array vacío para ejecutar solo una vez

  // Función manual para verificar estado (para el botón de refresh)
  const manualCheckPrinterStatus = useCallback(async () => {
    console.log('🔄 Verificación manual solicitada');
    await checkPrinterStatus();
  }, [checkPrinterStatus]);

  return {
    status,
    checkPrinterStatus: manualCheckPrinterStatus,
    printInvoice,
  };
};
