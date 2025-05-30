
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Plus, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useCategories, useProducts, useCreateCategory, useUpdateCategory, useDeleteCategory, useCreateProduct, useUpdateProduct, useDeleteProduct, Category, Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";

export const CatalogManagement = () => {
  const [activeTab, setActiveTab] = useState("categories");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: products, isLoading: productsLoading } = useProducts();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { toast } = useToast();

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image: '',
    is_active: true,
  });

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category_id: '',
    image: '',
    is_active: true,
  });

  const handleCategorySubmit = async () => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          updates: categoryForm,
        });
        toast({ title: "Categoría actualizada exitosamente" });
      } else {
        await createCategory.mutateAsync(categoryForm);
        toast({ title: "Categoría creada exitosamente" });
      }
      setShowCategoryDialog(false);
      resetCategoryForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleProductSubmit = async () => {
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          updates: productForm,
        });
        toast({ title: "Producto actualizado exitosamente" });
      } else {
        await createProduct.mutateAsync(productForm);
        toast({ title: "Producto creado exitosamente" });
      }
      setShowProductDialog(false);
      resetProductForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`¿Estás seguro de eliminar "${category.name}"?`)) return;
    
    try {
      await deleteCategory.mutateAsync(category.id);
      toast({ title: "Categoría eliminada exitosamente" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`¿Estás seguro de eliminar "${product.name}"?`)) return;
    
    try {
      await deleteProduct.mutateAsync(product.id);
      toast({ title: "Producto eliminado exitosamente" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      image: '',
      is_active: true,
    });
    setEditingCategory(null);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      category_id: '',
      image: '',
      is_active: true,
    });
    setEditingProduct(null);
  };

  const editCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      is_active: category.is_active,
    });
    setEditingCategory(category);
    setShowCategoryDialog(true);
  };

  const editProduct = (product: Product) => {
    setProductForm({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      image: product.image || '',
      is_active: product.is_active,
    });
    setEditingProduct(product);
    setShowProductDialog(true);
  };

  if (categoriesLoading || productsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        <span className="ml-2">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Gestión de Catálogo</span>
          </CardTitle>
          <CardDescription>
            Administra categorías, productos, opciones y variantes
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Categorías</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Productos</span>
          </TabsTrigger>
          <TabsTrigger value="options" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Opciones</span>
          </TabsTrigger>
          <TabsTrigger value="variants" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Variantes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Categorías</CardTitle>
                  <CardDescription>Gestiona las categorías de productos</CardDescription>
                </div>
                <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={resetCategoryForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Categoría
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingCategory ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                          id="name"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                          placeholder="Nombre de la categoría"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                          id="description"
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                          placeholder="Descripción de la categoría"
                        />
                      </div>
                      <div>
                        <Label htmlFor="image">URL de Imagen</Label>
                        <Input
                          id="image"
                          value={categoryForm.image}
                          onChange={(e) => setCategoryForm({...categoryForm, image: e.target.value})}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="active"
                          checked={categoryForm.is_active}
                          onCheckedChange={(checked) => setCategoryForm({...categoryForm, is_active: checked})}
                        />
                        <Label htmlFor="active">Activa</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleCategorySubmit}
                        disabled={!categoryForm.name.trim()}
                      >
                        {editingCategory ? 'Actualizar' : 'Crear'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {categories && categories.length > 0 ? (
                <div className="grid gap-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {category.image && (
                          <img 
                            src={category.image} 
                            alt={category.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold">{category.name}</h4>
                          <p className="text-sm text-gray-600">{category.description}</p>
                          <p className="text-xs text-gray-500">
                            Estado: {category.is_active ? 'Activo' : 'Inactivo'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => editCategory(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  No hay categorías disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Productos</CardTitle>
                  <CardDescription>Gestiona los productos del catálogo</CardDescription>
                </div>
                <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={resetProductForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Producto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingProduct ? 'Modifica los datos del producto' : 'Crea un nuevo producto'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="productName">Nombre</Label>
                        <Input
                          id="productName"
                          value={productForm.name}
                          onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                          placeholder="Nombre del producto"
                        />
                      </div>
                      <div>
                        <Label htmlFor="productDescription">Descripción</Label>
                        <Textarea
                          id="productDescription"
                          value={productForm.description}
                          onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                          placeholder="Descripción del producto"
                        />
                      </div>
                      <div>
                        <Label htmlFor="categorySelect">Categoría</Label>
                        <Select
                          value={productForm.category_id}
                          onValueChange={(value) => setProductForm({...productForm, category_id: value})}
                        >
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
                        <Label htmlFor="productImage">URL de Imagen</Label>
                        <Input
                          id="productImage"
                          value={productForm.image}
                          onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="productActive"
                          checked={productForm.is_active}
                          onCheckedChange={(checked) => setProductForm({...productForm, is_active: checked})}
                        />
                        <Label htmlFor="productActive">Activo</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowProductDialog(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleProductSubmit}
                        disabled={!productForm.name.trim()}
                      >
                        {editingProduct ? 'Actualizar' : 'Crear'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {products && products.length > 0 ? (
                <div className="grid gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.description}</p>
                          <p className="text-xs text-gray-500">
                            Categoría: {product.category?.name || 'Sin categoría'} | 
                            Variantes: {product.variants?.length || 0} | 
                            Estado: {product.is_active ? 'Activo' : 'Inactivo'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => editProduct(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteProduct(product)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  No hay productos disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Opciones de Producto</CardTitle>
              <CardDescription>Define opciones como tamaño, tipo de salsa, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-gray-500 text-center py-8">
                Funcionalidad de gestión de opciones próximamente
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Variantes y SKUs</CardTitle>
              <CardDescription>Gestiona las variantes específicas con precios y SKUs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-gray-500 text-center py-8">
                Funcionalidad de gestión de variantes próximamente
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
