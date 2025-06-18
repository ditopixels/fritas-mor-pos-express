import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import React from 'react';

interface PrinterStatus {
  isConnected: boolean;
  printerName: string | null;
  isChecking: boolean;
  lastCheck: Date | null;
}

interface PrinterContextType {
  status: PrinterStatus;
  checkPrinterStatus: () => Promise<void>;
  printInvoice: (orderData: any, type: 'cliente' | 'tienda') => Promise<boolean>;
}

// Declaraciones globales para QZ Tray
declare global {
  interface Window {
    qz: any;
  }
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

export const PrinterProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<PrinterStatus>({
    isConnected: false,
    printerName: null,
    isChecking: false,
    lastCheck: null,
  });

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

  // Función para inicializar QZ Tray
  const initializeQZ = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Inicializando QZ Tray...');
      
      // Verificar si QZ Tray está disponible
      if (typeof window.qz === 'undefined') {
        console.log('📦 Cargando QZ Tray desde CDN...');
        
        // Cargar QZ Tray desde CDN
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const qz = window.qz;
      
      if (!qz) {
        throw new Error('QZ Tray no se pudo cargar');
      }

      // Verificar si ya está conectado
      if (qz.websocket.isActive()) {
        console.log('✅ QZ Tray ya está conectado');
        return true;
      }

      // Conectar a QZ Tray
      console.log('🔌 Conectando a QZ Tray...');
      await qz.websocket.connect();
      
      console.log('✅ QZ Tray conectado exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error al inicializar QZ Tray:', error);
      return false;
    }
  }, []);

  const checkPrinterStatus = useCallback(async () => {
    if (!mountedRef.current) {
      console.log('⏸️ Verificación saltada - componente desmontado');
      return;
    }

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

      const qz = window.qz;
      
      // Obtener lista de impresoras
      const printers = await qz.printers.find();
      console.log('📄 Impresoras encontradas:', printers);
      
      if (mountedRef.current) {
        const isConnected = Array.isArray(printers) && printers.length > 0;
        const printerName = isConnected ? printers[0] : null;
        
        console.log('✅ Estado calculado:', {
          isConnected,
          printerName,
          totalPrinters: printers.length
        });
        
        const newStatus = {
          isConnected,
          printerName,
          isChecking: false,
          lastCheck: new Date(),
        };
        
        setStatus(newStatus);
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
      }
    }
  }, [initializeQZ]);

  const printInvoice = useCallback(async (orderData: any, type: 'cliente' | 'tienda') => {
    console.log('🖨️ === INICIANDO PROCESO DE IMPRESIÓN CON QZ TRAY ===');
    console.log('📊 Estado actual del statusRef:', statusRef.current);
    
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

      const qz = window.qz;

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
        '\x1B\x61\x00', // Alinear izquierda
        '--------------------------------\n',
        
        // Información de la orden
        `Orden: ${orderData.order_number}\n`,
        `Cliente: ${orderData.customer_name}\n`,
        `Fecha: ${new Date(orderData.created_at).toLocaleString('es-ES')}\n`,
        `Pago: ${orderData.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}\n`,
        `Domicilio: ${orderData.is_delivery ? 'SÍ' : 'NO'}\n`,
        '--------------------------------\n',
        
        // Items - Productos con fuente más grande
        '\x1B\x45\x01', // Negrita ON
        'PRODUCTOS:\n',
        '\x1B\x45\x00', // Negrita OFF
      ];

      orderData.order_items.forEach((item: any) => {
        // Producto principal con fuente doble
        printData.push('\x1D\x21\x11'); // Fuente doble tamaño
        printData.push(`${item.product_name}\n`);
        printData.push('\x1D\x21\x00'); // Volver a fuente normal
        if(item.variant_name && `${item.variant_name}`.toLowerCase() != `estándar`) {
          // Variante con fuente doble
          printData.push('\x1D\x21\x11'); // Fuente doble tamaño
          printData.push(`  ${item.variant_name}\n`);
          printData.push('\x1D\x21\x00'); // Volver a fuente normal
        }
        
        // Precio y cantidad en fuente normal
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
        const change = orderData.cash_received - orderData.total;
        if (change > 0) {
          printData.push(`Cambio: $${change.toLocaleString()}\n`);
        }
      }

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
    };
  }, []);

  const contextValue: PrinterContextType = {
    status,
    checkPrinterStatus,
    printInvoice,
  };

  return React.createElement(PrinterContext.Provider, { value: contextValue }, children);
};

export const usePrinterStatus = () => {
  const context = useContext(PrinterContext);
  if (context === undefined) {
    throw new Error('usePrinterStatus debe usarse dentro de PrinterProvider');
  }
  return context;
};
