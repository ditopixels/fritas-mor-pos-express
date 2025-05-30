
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, FolderOpen, Plus, Edit, Trash2, ChevronUp, ChevronDown, Settings } from "lucide-react";
import { useAllCategories, useAllProducts, useCreateCategory, useUpdateCategory, useDeleteCategory, useCreateProduct, useUpdateProduct, useDeleteProduct, useUpdateCategoryOrder, useUpdateProductOrder, Category, Product } from "@/hooks/useProducts";
import { ProductOptionsManager } from "./ProductOptionsManager";
import { useToast } from "@/hooks/use-toast";

export const CatalogManagement = () => {
  const [activeTab, setActiveTab] = useState("categories");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showOptionsManager, setShowOptionsManager] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useAllCategories();
  const { data: products = [], isLoading: productsLoading } = useAllProducts();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateCategoryOrder = useUpdateCategoryOrder();
  const updateProductOrder = useUpdateProductOrder();
  const { toast } = useToast();

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    image: "",
    is_active: true,
  });

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    category_id: "",
    image: "",
    is_active: true,
  });

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          updates: categoryForm,
        });
        toast({ title: "Categoría actualizada exitosamente" });
      } else {
        const maxOrder = Math.max(...categories.map(c => c.display_order), 0);
        await createCategory.mutateAsync({
          ...categoryForm,
          display_order: maxOrder + 1,
        });
        toast({ title: "Categoría creada exitosamente" });
      }
      resetCategoryForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al procesar la categoría",
        variant: "destructive",
      });
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          updates: productForm,
        });
        toast({ title: "Producto actualizado exitosamente" });
      } else {
        const categoryProducts = products.filter(p => p.category_id === productForm.category_id);
        const maxOrder = Math.max(...categoryProducts.map(p => p.display_order), 0);
        await createProduct.mutateAsync({
          ...productForm,
          display_order: maxOrder + 1,
        });
        toast({ title: "Producto creado exitosamente" });
      }
      resetProductForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al procesar el producto",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`¿Estás seguro de que quieres desactivar la categoría "${category.name}"?`)) {
      return;
    }
    try {
      await deleteCategory.mutateAsync(category.id);
      toast({ title: "Categoría desactivada exitosamente" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al desactivar la categoría",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`¿Estás seguro de que quieres desactivar el producto "${product.name}"?`)) {
      return;
    }
    try {
      await deleteProduct.mutateAsync(product.id);
      toast({ title: "Producto desactivado exitosamente" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al desactivar el producto",
        variant: "destructive",
      });
    }
  };

  const handleMoveCategoryOrder = async (categoryId: string, direction: 'up' | 'down') => {
    const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);
    const currentIndex = sortedCategories.findIndex(c => c.id === categoryId);
    
    if (direction === 'up' && currentIndex > 0) {
      const targetCategory = sortedCategories[currentIndex - 1];
      await updateCategoryOrder.mutateAsync({ id: categoryId, newOrder: targetCategory.display_order });
      await updateCategoryOrder.mutateAsync({ id: targetCategory.id, newOrder: sortedCategories[currentIndex].display_order });
    } else if (direction === 'down' && currentIndex < sortedCategories.length - 1) {
      const targetCategory = sortedCategories[currentIndex + 1];
      await updateCategoryOrder.mutateAsync({ id: categoryId, newOrder: targetCategory.display_order });
      await updateCategoryOrder.mutateAsync({ id: targetCategory.id, newOrder: sortedCategories[currentIndex].display_order });
    }
  };

  const handleMoveProductOrder = async (productId: string, direction: 'up' | 'down') => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const categoryProducts = products.filter(p => p.category_id === product.category_id)
      .sort((a, b) => a.display_order - b.display_order);
    const currentIndex = categoryProducts.findIndex(p => p.id === productId);
    
    if (direction === 'up' && currentIndex > 0) {
      const targetProduct = categoryProducts[currentIndex - 1];
      await updateProductOrder.mutateAsync({ id: productId, newOrder: targetProduct.display_order });
      await updateProductOrder.mutateAsync({ id: targetProduct.id, newOrder: categoryProducts[currentIndex].display_order });
    } else if (direction === 'down' && currentIndex < categoryProducts.length - 1) {
      const targetProduct = categoryProducts[currentIndex + 1];
      await updateProductOrder.mutateAsync({ id: productId, newOrder: targetProduct.display_order });
      await updateProductOrder.mutateAsync({ id: targetProduct.id, newOrder: categoryProducts[currentIndex].display_order });
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", description: "", image: "", is_active: true });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const resetProductForm = () => {
    setProductForm({ name: "", description: "", category_id: "", image: "", is_active: true });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const editCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      image: category.image || "",
      is_active: category.is_active,
    });
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const editProduct = (product: Product) => {
    setProductForm({
      name: product.name,
      description: product.description || "",
      category_id: product.category_id,
      image: product.image || "",
      is_active: product.is_active,
    });
    setEditingProduct(product);
    setShowProductForm(true);
  };

  if (categoriesLoading || productsLoading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
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
            Administra las categorías, productos y sus opciones
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Categorías</CardTitle>
                <Button onClick={() => setShowCategoryForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Categoría
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showCategoryForm && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>
                      {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCategorySubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="categoryName">Nombre</Label>
                        <Input
                          id="categoryName"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoryDescription">Descripción</Label>
                        <Textarea
                          id="categoryDescription"
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoryImage">URL de Imagen</Label>
                        <Input
                          id="categoryImage"
                          value={categoryForm.image}
                          onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={categoryForm.is_active}
                          onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })}
                        />
                        <Label>Activa</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Button type="submit">
                          {editingCategory ? "Actualizar" : "Crear"}
                        </Button>
                        <Button type="button" variant="outline" onClick={resetCategoryForm}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4">
                {categories.sort((a, b) => a.display_order - b.display_order).map((category) => (
                  <Card key={category.id} className={!category.is_active ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{category.name}</h3>
                            <Badge variant={category.is_active ? "default" : "secondary"}>
                              {category.is_active ? "Activa" : "Inactiva"}
                            </Badge>
                          </div>
                          {category.description && (
                            <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                          )}
                          <div className="text-xs text-gray-400">
                            Orden: {category.display_order}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoveCategoryOrder(category.id, 'up')}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoveCategoryOrder(category.id, 'down')}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Productos</CardTitle>
                <Button onClick={() => setShowProductForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showProductForm && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>
                      {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="productName">Nombre</Label>
                        <Input
                          id="productName"
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="productCategory">Categoría</Label>
                        <Select
                          value={productForm.category_id}
                          onValueChange={(value) => setProductForm({ ...productForm, category_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.filter(c => c.is_active).map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="productDescription">Descripción</Label>
                        <Textarea
                          id="productDescription"
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="productImage">URL de Imagen</Label>
                        <Input
                          id="productImage"
                          value={productForm.image}
                          onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={productForm.is_active}
                          onCheckedChange={(checked) => setProductForm({ ...productForm, is_active: checked })}
                        />
                        <Label>Activo</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Button type="submit">
                          {editingProduct ? "Actualizar" : "Crear"}
                        </Button>
                        <Button type="button" variant="outline" onClick={resetProductForm}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4">
                {products.sort((a, b) => a.display_order - b.display_order).map((product) => (
                  <Card key={product.id} className={!product.is_active ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{product.name}</h3>
                            <Badge variant={product.is_active ? "default" : "secondary"}>
                              {product.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                            <Badge variant="outline">
                              {product.category?.name || "Sin categoría"}
                            </Badge>
                          </div>
                          {product.description && (
                            <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                          )}
                          <div className="text-xs text-gray-400">
                            Orden: {product.display_order} | Opciones: {product.options?.length || 0} | Variantes: {product.variants?.length || 0}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoveProductOrder(product.id, 'up')}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoveProductOrder(product.id, 'down')}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowOptionsManager(true);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showOptionsManager && selectedProduct && (
        <ProductOptionsManager
          product={selectedProduct}
          onClose={() => {
            setShowOptionsManager(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};
