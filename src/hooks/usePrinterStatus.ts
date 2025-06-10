
import { useState, useEffect, useCallback, useRef } from 'react';
import qz from 'qz-tray';

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

  const PREFERRED_PRINTER = 'lasfritas';
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

  const initializeQZ = useCallback(async () => {
    try {
      console.log('🔧 Inicializando QZ Tray...');
      
      // Verificar si QZ Tray está disponible
      if (!qz.websocket.isActive()) {
        console.log('🔌 Conectando a QZ Tray...');
        await qz.websocket.connect();
        console.log('✅ Conectado a QZ Tray exitosamente');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error al conectar con QZ Tray:', error);
      return false;
    }
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
      console.log('🔍 Verificando estado de impresora con QZ Tray...');
      
      // Inicializar QZ Tray
      const qzInitialized = await initializeQZ();
      if (!qzInitialized) {
        throw new Error('No se pudo conectar con QZ Tray');
      }
      
      // Obtener lista de impresoras
      const printers = await qz.printers.find();
      console.log('📄 Impresoras disponibles:', printers);
      
      let selectedPrinter = null;
      
      if (Array.isArray(printers) && printers.length > 0) {
        // Buscar impresora preferida
        selectedPrinter = printers.find((printerName: string) => 
          printerName.toLowerCase().includes(PREFERRED_PRINTER.toLowerCase())
        );
        
        // Si no encuentra la preferida, usar la primera disponible
        if (!selectedPrinter) {
          selectedPrinter = printers[0];
        }
        
        console.log('🎯 Impresora seleccionada:', selectedPrinter);
      }
      
      // CORREGIR: Asegurar que tanto isConnected como printerName se establezcan correctamente
      const isConnected = !!(selectedPrinter);
      const printerName = selectedPrinter || null;
      
      const newStatus = {
        isConnected,
        printerName,
        isChecking: false,
        lastCheck: new Date(),
      };
      
      console.log('✅ Nuevo estado calculado:', {
        isConnected,
        printerName,
        selectedPrinter: selectedPrinter
      });
      
      if (mountedRef.current) {
        setStatus(newStatus);
      }
      
      // Solo detener verificaciones si realmente está conectada CON nombre
      if (isConnected && printerName) {
        console.log('🎯 Impresora conectada correctamente - deteniendo verificaciones periódicas');
        clearCheckInterval();
      }
      // Si no está conectada correctamente, continuar verificando
      else if (!intervalRef.current) {
        console.log('❌ Impresora no conectada correctamente - iniciando verificaciones periódicas');
        startCheckInterval();
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
  }, [clearCheckInterval, startCheckInterval, initializeQZ]);

  const printInvoice = useCallback(async (orderData: any, type: 'cliente' | 'tienda') => {
    console.log('🖨️ === INICIANDO PROCESO DE IMPRESIÓN CON QZ TRAY ===');
    console.log('📊 Estado actual del statusRef:', statusRef.current);
    console.log('📊 Estado del hook:', status);
    
    // Usar el estado del ref que siempre está actualizado
    const currentStatus = statusRef.current;
    
    // VALIDACIÓN MEJORADA: Verificar tanto conexión como nombre de impresora
    if (!currentStatus.isConnected) {
      console.error('❌ Impresora no conectada - isConnected:', currentStatus.isConnected);
      throw new Error('Impresora no conectada');
    }
    
    if (!currentStatus.printerName) {
      console.error('❌ Nombre de impresora no disponible - printerName:', currentStatus.printerName);
      throw new Error('Nombre de impresora no disponible');
    }

    try {
      console.log(`📝 Imprimiendo factura ${type} para orden:`, orderData.order_number);
      console.log('🖨️ Usando impresora:', currentStatus.printerName);
      
      // Inicializar QZ Tray
      const qzInitialized = await initializeQZ();
      if (!qzInitialized) {
        throw new Error('No se pudo conectar con QZ Tray');
      }

      // Crear configuración de impresión
      const config = qz.configs.create(currentStatus.printerName);
      
      // Preparar datos de impresión en formato ESC/POS
      const printData = [
        // Header
        '\x1B\x40', // Inicializar impresora
        '\x1B\x61\x01', // Centrar texto
        '================================\n',
        '\x1B\x45\x01', // Negrita ON
        'LAS FRITAS MOR\n',
        '\x1B\x45\x00', // Negrita OFF
        '================================\n',
        `FACTURA - ${type.toUpperCase()}\n`,
        '\x1B\x61\x00', // Alinear izquierda
        '--------------------------------\n',
        
        // Información de la orden
        `Orden: ${orderData.order_number}\n`,
        `Cliente: ${orderData.customer_name}\n`,
        `Fecha: ${new Date(orderData.created_at).toLocaleString('es-ES')}\n`,
        `Pago: ${orderData.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}\n`,
        '--------------------------------\n',
        
        // Items
        '\x1B\x45\x01', // Negrita ON
        'PRODUCTOS:\n',
        '\x1B\x45\x00', // Negrita OFF
      ];

      // Agregar items
      orderData.order_items.forEach((item: any) => {
        printData.push(`${item.product_name}\n`);
        printData.push(`  ${item.variant_name}\n`);
        printData.push(`  ${item.quantity} x $${item.price.toLocaleString()} = $${(item.quantity * item.price).toLocaleString()}\n`);
      });

      // Totales
      printData.push('--------------------------------\n');
      printData.push(`\x1B\x61\x02Subtotal: $${orderData.subtotal.toLocaleString()}\n`); // Alinear derecha
      
      if (orderData.total_discount > 0) {
        printData.push(`Descuentos: -$${orderData.total_discount.toLocaleString()}\n`);
      }
      
      printData.push('\x1B\x45\x01'); // Negrita ON
      printData.push(`TOTAL: $${orderData.total.toLocaleString()}\n`);
      printData.push('\x1B\x45\x00'); // Negrita OFF

      // Información de pago
      if (orderData.payment_method === 'cash' && orderData.cash_received) {
        printData.push(`Recibido: $${orderData.cash_received.toLocaleString()}\n`);
        printData.push(`Cambio: $${(orderData.cash_received - orderData.total).toLocaleString()}\n`);
      }

      // Footer
      printData.push('\x1B\x61\x01'); // Centrar
      printData.push('================================\n');
      printData.push(type === 'cliente' ? '¡Gracias por su compra!\n' : 'COPIA TIENDA\n');
      printData.push('================================\n');
      printData.push('\x1B\x61\x00'); // Alinear izquierda
      printData.push('\n\n\n'); // Espacios en blanco
      printData.push('\x1D\x56\x42\x03'); // Cortar papel

      console.log('📤 Enviando datos de impresión a QZ Tray...');

      // Imprimir usando QZ Tray
      await qz.print(config, printData);

      console.log(`✅ Factura ${type} impresa exitosamente con QZ Tray`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error al imprimir factura ${type} con QZ Tray:`, error);
      throw error;
    }
  }, [initializeQZ]);

  // Efecto para la verificación inicial
  useEffect(() => {
    console.log('🔄 Inicializando usePrinterStatus con QZ Tray...');
    mountedRef.current = true;
    
    if (!hasInitialCheckRef.current) {
      hasInitialCheckRef.current = true;
      console.log('🎯 Realizando verificación inicial de impresora con QZ Tray...');
      checkPrinterStatus();
    }

    return () => {
      console.log('🧹 Limpiando usePrinterStatus...');
      mountedRef.current = false;
      clearCheckInterval();
      isCheckingRef.current = false;
      
      // Desconectar QZ Tray si está conectado
      if (qz.websocket.isActive()) {
        qz.websocket.disconnect().catch(console.error);
      }
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
