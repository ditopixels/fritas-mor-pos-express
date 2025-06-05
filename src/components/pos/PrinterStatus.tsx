
import { Printer, CheckCircle, XCircle, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePrinterStatus } from '@/hooks/usePrinterStatus';

export const PrinterStatus = () => {
  const { status, checkPrinterStatus } = usePrinterStatus();

  const getStatusColor = () => {
    if (status.isChecking) return 'bg-yellow-100 text-yellow-800';
    if (status.isConnected) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = () => {
    if (status.isChecking) return 'Verificando...';
    if (status.isConnected) return 'Conectada';
    return 'Desconectada';
  };

  const getStatusIcon = () => {
    if (status.isChecking) return <RotateCw className="h-3 w-3 animate-spin" />;
    if (status.isConnected) return <CheckCircle className="h-3 w-3" />;
    return <XCircle className="h-3 w-3" />;
  };

  return (
    <Card className="bg-white border">
      <CardContent className="p-3">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <Printer className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">Impresora:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={`text-xs px-2 py-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
            
            <Button
              onClick={checkPrinterStatus}
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={status.isChecking}
            >
              <RotateCw className={`h-3 w-3 ${status.isChecking ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {status.printerName && (
          <p className="text-xs text-gray-500 mt-1">
            {status.printerName}
          </p>
        )}
        
        {status.lastCheck && (
          <p className="text-xs text-gray-400 mt-1">
            Última verificación: {status.lastCheck.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
