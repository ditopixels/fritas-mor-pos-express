import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Edit, Plus, GripVertical, Eye, EyeOff } from "lucide-react";
import { useAllCategories, useAllProducts, useCreateCategory, useUpdateCategory, useDeleteCategory, useCreateProduct, useUpdateProduct, useDeleteProduct, useUpdateCategoryOrder, useUpdateProductOrder, Category, Product } from "@/hooks/useProducts";
import { ProductOptionsManager } from "./ProductOptionsManager";
import { ProductVariantsManager } from "./ProductVariantsManager";
import { useToast } from "@/hooks/use-toast";

export const CatalogManagement = () => {
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    image: '',
    is_active: true,
    display_order: 0,
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category_id: '',
    image: '',
    is_active: true,
    display_order: 0,
    base_price: 0,
    options: [],
    variants: [],
  });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showInactiveCategories, setShowInactiveCategories] = useState(false);
  const [showInactiveProducts, setShowInactiveProducts] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useAllCategories();
  const { data: products, isLoading: productsLoading } = useAllProducts();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const updateCategoryOrderMutation = useUpdateCategoryOrder();
  const updateProductOrderMutation = useUpdateProductOrder();
  const { toast } = useToast();

  const handleCreateCategory = async () => {
    if (!newCategory.name) return;

    try {
      await createCategoryMutation.mutateAsync({
        ...newCategory,
        display_order: (categories?.length || 0) + 1,
      });

      setNewCategory({
        name: '',
        description: '',
        image: '',
        is_active: true,
        display_order: 0,
      });

      toast({
        title: "Categoría creada",
        description: "La categoría se ha creado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear la categoría",
        variant: "destructive",
      });
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.category_id) return;

    try {
      await createProductMutation.mutateAsync({
        name: newProduct.name,
        description: newProduct.description,
        category_id: newProduct.category_id,
        image: newProduct.image,
        is_active: newProduct.is_active,
        display_order: (products?.length || 0) + 1,
        base_price: newProduct.base_price,
      });

      setNewProduct({
        name: '',
        description: '',
        category_id: '',
        image: '',
        is_active: true,
        display_order: 0,
        base_price: 0,
        options: [],
        variants: [],
      });

      toast({
        title: "Producto creado",
        description: "El producto se ha creado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear el producto",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      await updateCategoryMutation.mutateAsync({
        id: editingCategory.id,
        updates: {
          name: editingCategory.name,
          description: editingCategory.description,
          image: editingCategory.image,
          is_active: editingCategory.is_active,
        }
      });
      setEditingCategory(null);
      toast({
        title: "Categoría actualizada",
        description: "Los cambios se han guardado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la categoría",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        updates: {
          name: editingProduct.name,
          description: editingProduct.description,
          category_id: editingProduct.category_id,
          image: editingProduct.image,
          is_active: editingProduct.is_active,
          base_price: editingProduct.base_price,
        }
      });
      setEditingProduct(null);
      toast({
        title: "Producto actualizado",
        description: "Los cambios se han guardado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el producto",
        variant: "destructive",
      });
    }
  };

  const handleToggleCategoryStatus = async (id: string, isActive: boolean) => {
    try {
      await updateCategoryMutation.mutateAsync({
        id,
        updates: { is_active: isActive }
      });
      toast({
        title: isActive ? "Categoría activada" : "Categoría desactivada",
        description: "El estado se ha actualizado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cambiar el estado",
        variant: "destructive",
      });
    }
  };

  const handleToggleProductStatus = async (id: string, isActive: boolean) => {
    try {
      await updateProductMutation.mutateAsync({
        id,
        updates: { is_active: isActive }
      });
      toast({
        title: isActive ? "Producto activado" : "Producto desactivado",
        description: "El estado se ha actualizado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cambiar el estado",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategoryOrder = async (id: string, newOrder: number) => {
    try {
      await updateCategoryOrderMutation.mutateAsync({ id, newOrder });
      toast({
        title: "Orden actualizada",
        description: "El orden de la categoría se ha actualizado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el orden",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProductOrder = async (id: string, newOrder: number) => {
    try {
      await updateProductOrderMutation.mutateAsync({ id, newOrder });
      toast({
        title: "Orden actualizada",
        description: "El orden del producto se ha actualizado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el orden",
        variant: "destructive",
      });
    }
  };

  const filteredCategories = categories?.filter(cat => 
    showInactiveCategories ? true : cat.is_active
  ) || [];

  const filteredProducts = products?.filter(prod => 
    showInactiveProducts ? true : prod.is_active
  ) || [];

  if (categoriesLoading || productsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        <span className="ml-2">Cargando catálogo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Categories Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gestión de Categorías</CardTitle>
            <div className="flex items-center space-x-2">
              <Switch
                checked={showInactiveCategories}
                onCheckedChange={setShowInactiveCategories}
              />
              <Label className="flex items-center space-x-2">
                {showInactiveCategories ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span>Mostrar inactivas</span>
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create Category Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="category-name">Nombre de la Categoría</Label>
              <Input
                id="category-name"
                placeholder="Ej: Hamburguesas"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="category-image">URL de la Imagen</Label>
              <Input
                id="category-image"
                placeholder="https://..."
                value={newCategory.image}
                onChange={(e) => setNewCategory(prev => ({ ...prev, image: e.target.value }))}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="category-description">Descripción</Label>
              <Textarea
                id="category-description"
                placeholder="Descripción de la categoría"
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="md:col-span-2">
              <Button 
                onClick={handleCreateCategory}
                disabled={!newCategory.name || createCategoryMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createCategoryMutation.isPending ? "Creando..." : "Crear Categoría"}
              </Button>
            </div>
          </div>

          {/* Categories List */}
          <div className="grid gap-4">
            {filteredCategories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{category.name}</h3>
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                    <p className="text-xs text-gray-500">Orden: {category.display_order}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingCategory(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleCategoryStatus(category.id, !category.is_active)}
                    className={category.is_active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                  >
                    {category.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gestión de Productos</CardTitle>
            <div className="flex items-center space-x-2">
              <Switch
                checked={showInactiveProducts}
                onCheckedChange={setShowInactiveProducts}
              />
              <Label className="flex items-center space-x-2">
                {showInactiveProducts ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span>Mostrar inactivos</span>
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create Product Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="product-name">Nombre del Producto</Label>
              <Input
                id="product-name"
                placeholder="Ej: Hamburguesa Clásica"
                value={newProduct.name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="product-category">Categoría</Label>
              <select
                id="product-category"
                className="w-full p-2 border rounded-md"
                value={newProduct.category_id}
                onChange={(e) => setNewProduct(prev => ({ ...prev, category_id: e.target.value }))}
              >
                <option value="">Seleccionar categoría</option>
                {filteredCategories.filter(cat => cat.is_active).map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="product-price">Precio Base</Label>
              <Input
                id="product-price"
                type="number"
                placeholder="0"
                value={newProduct.base_price || ''}
                onChange={(e) => setNewProduct(prev => ({ ...prev, base_price: Number(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="product-image">URL de la Imagen</Label>
              <Input
                id="product-image"
                placeholder="https://..."
                value={newProduct.image}
                onChange={(e) => setNewProduct(prev => ({ ...prev, image: e.target.value }))}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="product-description">Descripción</Label>
              <Textarea
                id="product-description"
                placeholder="Descripción del producto"
                value={newProduct.description}
                onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="md:col-span-2">
              <Button 
                onClick={handleCreateProduct}
                disabled={!newProduct.name || !newProduct.category_id || createProductMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createProductMutation.isPending ? "Creando..." : "Crear Producto"}
              </Button>
            </div>
          </div>

          {/* Products List */}
          <div className="grid gap-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{product.name}</h3>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    {product.description && (
                      <p className="text-sm text-gray-600">{product.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Categoría: {product.category?.name || 'Sin categoría'}</span>
                      <span>Precio base: ${product.base_price?.toLocaleString() || 'No definido'}</span>
                      <span>Orden: {product.display_order}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingProduct(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleProductStatus(product.id, !product.is_active)}
                    className={product.is_active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                  >
                    {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Category Modal */}
      {editingCategory && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Editar Categoría</h3>
            {/* Edit form similar to create form */}
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div>
                <Label>Imagen URL</Label>
                <Input
                  value={editingCategory.image || ''}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, image: e.target.value } : null)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingCategory(null)}>
                  Cancelar
                </Button>
                <Button onClick={() => handleUpdateCategory()}>
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Editar Producto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={editingProduct.category_id}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, category_id: e.target.value } : null)}
                >
                  {filteredCategories.filter(cat => cat.is_active).map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Precio Base</Label>
                <Input
                  type="number"
                  value={editingProduct.base_price || ''}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, base_price: Number(e.target.value) || 0 } : null)}
                />
              </div>
              <div>
                <Label>Imagen URL</Label>
                <Input
                  value={editingProduct.image || ''}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, image: e.target.value } : null)}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Descripción</Label>
                <Textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
            </div>

            {/* Product Options Manager */}
            <ProductOptionsManager
              product={editingProduct}
              options={editingProduct.options || []}
              onUpdateOptions={(options) => setEditingProduct(prev => prev ? { ...prev, options } : null)}
            />

            {/* Product Variants Manager */}
            <ProductVariantsManager
              product={editingProduct}
              options={editingProduct.options || []}
              variants={editingProduct.variants || []}
              onUpdateVariants={(variants) => setEditingProduct(prev => prev ? { ...prev, variants } : null)}
            />

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setEditingProduct(null)}>
                Cancelar
              </Button>
              <Button onClick={() => handleUpdateProduct()}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
