
import { useState, useEffect, useCallback } from 'react';

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
  const CHECK_INTERVAL = 10000; // 10 segundos

  const checkPrinterStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, isChecking: true }));
    
    try {
      // Verificar si el servicio está disponible
      const response = await fetch(`${PRINTER_API_URL}/impresoras`, {
        method: 'GET',
        timeout: 3000,
      } as any);
      
      if (response.ok) {
        const printers = await response.json();
        console.log('Impresoras disponibles:', printers);
        
        // Buscar la impresora preferida o usar la primera disponible
        let selectedPrinter = printers.find((p: any) => 
          p.nombre?.toLowerCase().includes(PREFERRED_PRINTER.toLowerCase())
        );
        
        if (!selectedPrinter && printers.length > 0) {
          selectedPrinter = printers[0];
        }
        
        setStatus({
          isConnected: !!selectedPrinter,
          printerName: selectedPrinter?.nombre || null,
          isChecking: false,
          lastCheck: new Date(),
        });
      } else {
        throw new Error('Servicio no disponible');
      }
    } catch (error) {
      console.log('Error al verificar impresora:', error);
      setStatus({
        isConnected: false,
        printerName: null,
        isChecking: false,
        lastCheck: new Date(),
      });
    }
  }, []);

  const printInvoice = useCallback(async (orderData: any, type: 'cliente' | 'tienda') => {
    if (!status.isConnected) {
      throw new Error('Impresora no conectada');
    }

    try {
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

      const response = await fetch(`${PRINTER_API_URL}/imprimir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error('Error al imprimir');
      }

      console.log(`Factura ${type} impresa exitosamente`);
      return true;
    } catch (error) {
      console.error(`Error al imprimir factura ${type}:`, error);
      throw error;
    }
  }, [status.isConnected, status.printerName]);

  // Verificar estado periódicamente
  useEffect(() => {
    checkPrinterStatus();
    const interval = setInterval(checkPrinterStatus, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkPrinterStatus]);

  return {
    status,
    checkPrinterStatus,
    printInvoice,
  };
};
