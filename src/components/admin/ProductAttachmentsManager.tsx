
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { ProductAttachment } from "@/types";
import { Product } from "@/hooks/useProducts";

interface ProductAttachmentsManagerProps {
  product: Product;
  onUpdateAttachments: (attachments: ProductAttachment[]) => void;
}

export const ProductAttachmentsManager = ({ product, onUpdateAttachments }: ProductAttachmentsManagerProps) => {
  const [attachments, setAttachments] = useState<ProductAttachment[]>([]);
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentValue, setNewAttachmentValue] = useState("");

  useEffect(() => {
    // Inicializar con attachments existentes del producto
    if (product?.attachments) {
      setAttachments(product.attachments);
    }
  }, [product?.id]);

  useEffect(() => {
    onUpdateAttachments(attachments);
  }, [attachments, onUpdateAttachments]);

  const addAttachment = () => {
    if (!newAttachmentName.trim()) return;

    const newAttachment: ProductAttachment = {
      id: `temp-${Date.now()}`,
      name: newAttachmentName,
      values: [],
      isRequired: false,
    };

    setAttachments([...attachments, newAttachment]);
    setNewAttachmentName("");
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const updateAttachment = (index: number, field: keyof ProductAttachment, value: any) => {
    const updated = [...attachments];
    updated[index] = { ...updated[index], [field]: value };
    setAttachments(updated);
  };

  const addValueToAttachment = (attachmentIndex: number) => {
    if (!newAttachmentValue.trim()) return;

    const updated = [...attachments];
    updated[attachmentIndex] = {
      ...updated[attachmentIndex],
      values: [...updated[attachmentIndex].values, newAttachmentValue]
    };
    setAttachments(updated);
    setNewAttachmentValue("");
  };

  const removeValueFromAttachment = (attachmentIndex: number, valueIndex: number) => {
    const updated = [...attachments];
    updated[attachmentIndex] = {
      ...updated[attachmentIndex],
      values: updated[attachmentIndex].values.filter((_, i) => i !== valueIndex)
    };
    setAttachments(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Elementos Adicionales del Producto (Attachments)</CardTitle>
        <p className="text-sm text-gray-600">
          Los attachments permiten selección múltiple sin costo adicional (ej: salsas, extras)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agregar nuevo attachment */}
        <div className="flex gap-2">
          <Input
            placeholder="Nombre del attachment (ej: Salsas)"
            value={newAttachmentName}
            onChange={(e) => setNewAttachmentName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={addAttachment} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>

        {/* Lista de attachments */}
        {attachments.map((attachment, attachmentIndex) => (
          <Card key={attachment.id} className="border-l-4 border-l-purple-500">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label>Nombre del Attachment</Label>
                      <Input
                        value={attachment.name}
                        onChange={(e) => updateAttachment(attachmentIndex, 'name', e.target.value)}
                        placeholder="Ej: Salsas"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={attachment.isRequired}
                        onCheckedChange={(checked) => updateAttachment(attachmentIndex, 'isRequired', checked)}
                      />
                      <Label>Requerido</Label>
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeAttachment(attachmentIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Valores del attachment */}
              <div className="space-y-2">
                <Label>Valores disponibles (selección múltiple)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar valor (ej: Ketchup, Mayonesa)"
                    value={newAttachmentValue}
                    onChange={(e) => setNewAttachmentValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addValueToAttachment(attachmentIndex);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => addValueToAttachment(attachmentIndex)}
                  >
                    Agregar
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {attachment.values.map((value, valueIndex) => (
                    <Badge
                      key={valueIndex}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => removeValueFromAttachment(attachmentIndex, valueIndex)}
                    >
                      {value}
                      <Trash2 className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {attachments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay attachments configurados. Los attachments permiten seleccionar múltiples elementos sin costo adicional.
          </div>
        )}

        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          <strong>Info:</strong> Los attachments permiten selección múltiple sin precio adicional.
          Ejemplos: Salsas (Ketchup, Mayonesa, BBQ), Extras (Sin cebolla, Extra queso).
        </div>
      </CardContent>
    </Card>
  );
};
