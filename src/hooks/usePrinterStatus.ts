
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
  const CHECK_INTERVAL = 30000; // 30 segundos
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);
  const mountedRef = useRef(true);
  const hasInitialCheckRef = useRef(false);
  
  // Refs para mantener el estado actual - CRÍTICO para printInvoice
  const statusRef = useRef(status);

  // Actualizar ref cada vez que cambie el estado
  useEffect(() => {
    statusRef.current = status;
    console.log('🔄 Estado de impresora actualizado:', {
      isConnected: status.isConnected,
      printerName: status.printerName,
      isChecking: status.isChecking,
      lastCheck: status.lastCheck
    });
  }, [status]);

  const clearCheckInterval = useCallback(() => {
    if (intervalRef.current) {
      console.log('🔄 Deteniendo verificaciones periódicas de impresora');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCheckInterval = useCallback(() => {
    clearCheckInterval();
    
    console.log('🔄 Iniciando verificaciones periódicas de impresora (cada 30s)');
    intervalRef.current = setInterval(() => {
      if (!isCheckingRef.current && mountedRef.current) {
        checkPrinterStatus();
      }
    }, CHECK_INTERVAL);
  }, []);

  const checkPrinterStatus = useCallback(async () => {
    if (isCheckingRef.current || !mountedRef.current) {
      console.log('⏸️ Verificación saltada - ya en curso o componente desmontado');
      return;
    }

    isCheckingRef.current = true;
    
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
        console.log('📄 Respuesta de impresoras:', printers);
        
        // Simplificado: solo verificar si hay impresoras disponibles
        const isConnected = Array.isArray(printers) && printers.length > 0;
        const printerName = isConnected ? (typeof printers[0] === 'string' ? printers[0] : printers[0]?.nombre || printers[0]) : null;
        
        console.log('✅ Estado calculado:', {
          isConnected,
          printerName,
          printers
        });
        
        const newStatus = {
          isConnected,
          printerName,
          isChecking: false,
          lastCheck: new Date(),
        };
        
        setStatus(newStatus);
        
        // Detener verificaciones si está conectada
        if (isConnected) {
          console.log('🎯 Impresora conectada - deteniendo verificaciones periódicas');
          clearCheckInterval();
        }
        // Si no está conectada, continuar verificando
        else if (!intervalRef.current) {
          console.log('❌ Impresora no conectada - iniciando verificaciones periódicas');
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
    console.log('🖨️ === INICIANDO PROCESO DE IMPRESIÓN ===');
    console.log('📊 Estado actual del statusRef:', statusRef.current);
    
    // Usar el estado del ref que siempre está actualizado
    const currentStatus = statusRef.current;
    
    // VALIDACIÓN SIMPLIFICADA: Solo verificar conexión
    if (!currentStatus.isConnected) {
      console.error('❌ Impresora no conectada - isConnected:', currentStatus.isConnected);
      throw new Error('Impresora no conectada');
    }

    try {
      console.log(`📝 Imprimiendo factura ${type} para orden:`, orderData.order_number);
      console.log('🖨️ Usando impresora:', currentStatus.printerName || 'Primera disponible');
      
      const invoiceData = {
        impresora: currentStatus.printerName || 'lasfritas',
        serial: "",
        operaciones: [
          // Header
          { nombre: "EscribirTexto", argumentos: ['='.repeat(32)] },
          { nombre: "EscribirTexto", argumentos: ['LAS FRITAS MOR'] },
          { nombre: "EscribirTexto", argumentos: ['='.repeat(32)] },
          { nombre: "EscribirTexto", argumentos: [`FACTURA - ${type.toUpperCase()}`] },
          { nombre: "EscribirTexto", argumentos: ['-'.repeat(32)] },
          
          // Información de la orden
          { nombre: "EscribirTexto", argumentos: [`Orden: ${orderData.order_number}`] },
          { nombre: "EscribirTexto", argumentos: [`Cliente: ${orderData.customer_name}`] },
          { nombre: "EscribirTexto", argumentos: [`Fecha: ${new Date(orderData.created_at).toLocaleString('es-ES')}`] },
          { nombre: "EscribirTexto", argumentos: [`Pago: ${orderData.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}`] },
          { nombre: "EscribirTexto", argumentos: ['-'.repeat(32)] },
          
          // Items
          { nombre: "EscribirTexto", argumentos: ['PRODUCTOS:'] },
          ...orderData.order_items.map((item: any) => [
            { nombre: "EscribirTexto", argumentos: [`${item.product_name}`] },
            { nombre: "EscribirTexto", argumentos: [`  ${item.variant_name}`] },
            { nombre: "EscribirTexto", argumentos: [`  ${item.quantity} x $${item.price.toLocaleString()} = $${(item.quantity * item.price).toLocaleString()}`] },
          ]).flat(),
          
          { nombre: "EscribirTexto", argumentos: ['-'.repeat(32)] },
          
          // Totales
          { nombre: "EscribirTexto", argumentos: [`Subtotal: $${orderData.subtotal.toLocaleString()}`] },
          ...(orderData.total_discount > 0 ? [
            { nombre: "EscribirTexto", argumentos: [`Descuentos: -$${orderData.total_discount.toLocaleString()}`] }
          ] : []),
          { nombre: "EscribirTexto", argumentos: [`TOTAL: $${orderData.total.toLocaleString()}`] },
          
          // Información de pago
          ...(orderData.payment_method === 'cash' && orderData.cash_received ? [
            { nombre: "EscribirTexto", argumentos: [`Recibido: $${orderData.cash_received.toLocaleString()}`] },
            { nombre: "EscribirTexto", argumentos: [`Cambio: $${(orderData.cash_received - orderData.total).toLocaleString()}`] },
          ] : []),
          
          { nombre: "EscribirTexto", argumentos: ['='.repeat(32)] },
          { nombre: "EscribirTexto", argumentos: [type === 'cliente' ? '¡Gracias por su compra!' : 'COPIA TIENDA'] },
          { nombre: "EscribirTexto", argumentos: ['='.repeat(32)] },
          
          // Espacios en blanco y corte
          { nombre: "EscribirTexto", argumentos: [''] },
          { nombre: "EscribirTexto", argumentos: [''] },
          { nombre: "Cortar", argumentos: ['3'] },
        ]
      };

      console.log('📤 Enviando datos de impresión a:', `${PRINTER_API_URL}/imprimir`);
      console.log('📤 Datos de impresión:', JSON.stringify(invoiceData, null, 2));

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

      const responseData = await response.text();
      console.log(`✅ Factura ${type} impresa exitosamente. Respuesta:`, responseData);
      return true;
      
    } catch (error) {
      console.error(`❌ Error al imprimir factura ${type}:`, error);
      throw error;
    }
  }, []);

  // Efecto para la verificación inicial
  useEffect(() => {
    console.log('🔄 Inicializando usePrinterStatus...');
    mountedRef.current = true;
    
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
  }, []);

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
