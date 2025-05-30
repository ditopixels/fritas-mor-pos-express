import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useAllCategories, useAllProducts, Product as ProductType, Category } from "@/hooks/useProducts";
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const CatalogManagement = () => {
  const { data: products, isLoading: isLoadingProducts } = useAllProducts();
  const { data: categories, isLoading: isLoadingCategories } = useAllCategories();
  const [isCreating, setIsCreating] = useState(false);
  const [newProduct, setNewProduct] = useState<Omit<ProductType, 'id' | 'created_at'>>({
    name: '',
    description: '',
    category_id: '',
    image: '',
    is_active: true,
    display_order: 0,
  });
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleCreateProduct = async () => {
    try {
      await createProduct.mutateAsync(newProduct);
      setNewProduct({
        name: '',
        description: '',
        category_id: '',
        image: '',
        is_active: true,
        display_order: 0,
      });
      setIsCreating(false);
      toast({
        title: "Producto creado",
        description: "El producto se ha creado correctamente.",
      });
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el producto.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async (product: ProductType) => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        updates: {
          name: product.name,
          description: product.description,
          category_id: product.category_id,
          image: product.image,
          is_active: product.is_active,
          display_order: product.display_order,
        },
      });
      setEditingProduct(null);
      toast({
        title: "Producto actualizado",
        description: "El producto se ha actualizado correctamente.",
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (deletingProductId) {
      try {
        await deleteProduct.mutateAsync(deletingProductId);
        setDeletingProductId(null);
        toast({
          title: "Producto eliminado",
          description: "El producto se ha eliminado correctamente.",
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el producto.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoadingProducts || isLoadingCategories) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Catálogo</CardTitle>
          <CardDescription>
            Administra tus productos y categorías
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Producto
            </Button>
          </div>

          <Table>
            <TableCaption>Lista de productos</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category?.name}</TableCell>
                  <TableCell>{product.is_active ? 'Sí' : 'No'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-500">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. ¿Eliminar el producto {product.name}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction onClick={() => setDeletingProductId(product.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Creación */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Producto</CardTitle>
            <CardDescription>
              Completa el formulario para crear un nuevo producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Nombre del Producto</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select onValueChange={(value) => setNewProduct({ ...newProduct, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="image">URL de la Imagen</Label>
                <Input
                  id="image"
                  type="url"
                  value={newProduct.image}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, image: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="active">Activo</Label>
                <Switch
                  id="active"
                  checked={newProduct.is_active}
                  onCheckedChange={(checked) =>
                    setNewProduct({ ...newProduct, is_active: checked })
                  }
                />
              </div>
              <div>
                <Label htmlFor="display_order">Orden de Visualización</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={newProduct.display_order}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      display_order: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateProduct}>Crear</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Edición */}
      {editingProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Editar Producto</CardTitle>
            <CardDescription>
              Modifica los campos del producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Nombre del Producto</Label>
                <Input
                  id="name"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select onValueChange={(value) => setEditingProduct({ ...editingProduct, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" defaultValue={editingProduct.category_id} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="image">URL de la Imagen</Label>
                <Input
                  id="image"
                  type="url"
                  value={editingProduct.image || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, image: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="active">Activo</Label>
                <Switch
                  id="active"
                  checked={editingProduct.is_active}
                  onCheckedChange={(checked) =>
                    setEditingProduct({ ...editingProduct, is_active: checked })
                  }
                />
              </div>
              <div>
                <Label htmlFor="display_order">Orden de Visualización</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={editingProduct.display_order}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      display_order: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setEditingProduct(null)}>
                Cancelar
              </Button>
              <Button onClick={() => handleUpdateProduct(editingProduct)}>
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmación de Borrado */}
      <AlertDialog open={deletingProductId !== null} onOpenChange={(open) => {
        if (!open) {
          setDeletingProductId(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
