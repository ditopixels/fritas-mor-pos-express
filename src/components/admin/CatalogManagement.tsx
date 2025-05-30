
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Settings } from "lucide-react";
import { 
  useAllCategories, 
  useAllProducts, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUpdateCategoryOrder,
  useUpdateProductOrder
} from "@/hooks/useProducts";
import { ProductOptionsManager } from "./ProductOptionsManager";
import { useToast } from "@/hooks/use-toast";

export const CatalogManagement = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    description: '',
    image: '',
    is_active: true,
  });
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    description: '',
    category_id: '',
    image: '',
    base_price: 5000,
    is_active: true,
  });
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isOptionsDialogOpen, setIsOptionsDialogOpen] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading } = useAllCategories();
  const { data: products = [], isLoading: productsLoading } = useAllProducts();
  const { toast } = useToast();

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const updateCategoryOrderMutation = useUpdateCategoryOrder();
  const updateProductOrderMutation = useUpdateProductOrder();

  const resetCategoryForm = () => {
    setCategoryForm({
      id: '',
      name: '',
      description: '',
      image: '',
      is_active: true,
    });
  };

  const resetProductForm = () => {
    setProductForm({
      id: '',
      name: '',
      description: '',
      category_id: '',
      image: '',
      base_price: 5000,
      is_active: true,
    });
  };

  const handleCategorySubmit = async () => {
    try {
      if (categoryForm.id) {
        await updateCategoryMutation.mutateAsync({
          id: categoryForm.id,
          updates: {
            name: categoryForm.name,
            description: categoryForm.description,
            image: categoryForm.image,
            is_active: categoryForm.is_active,
          }
        });
        toast({ title: "Categoría actualizada exitosamente" });
      } else {
        await createCategoryMutation.mutateAsync({
          name: categoryForm.name,
          description: categoryForm.description,
          image: categoryForm.image,
          is_active: categoryForm.is_active,
        });
        toast({ title: "Categoría creada exitosamente" });
      }
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la categoría",
        variant: "destructive",
      });
    }
  };

  const handleProductSubmit = async () => {
    try {
      if (productForm.id) {
        await updateProductMutation.mutateAsync({
          id: productForm.id,
          updates: {
            name: productForm.name,
            description: productForm.description,
            category_id: productForm.category_id,
            image: productForm.image,
            base_price: productForm.base_price,
            is_active: productForm.is_active,
          }
        });
        toast({ title: "Producto actualizado exitosamente" });
      } else {
        await createProductMutation.mutateAsync({
          name: productForm.name,
          description: productForm.description,
          category_id: productForm.category_id,
          image: productForm.image,
          is_active: productForm.is_active,
        });
        toast({ title: "Producto creado exitosamente" });
      }
      setIsProductDialogOpen(false);
      resetProductForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el producto",
        variant: "destructive",
      });
    }
  };

  const editCategory = (category) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      is_active: category.is_active,
    });
    setIsCategoryDialogOpen(true);
  };

  const editProduct = (product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      image: product.image || '',
      base_price: product.base_price || 5000,
      is_active: product.is_active,
    });
    setIsProductDialogOpen(true);
  };

  const toggleCategoryActive = async (category) => {
    try {
      await updateCategoryMutation.mutateAsync({
        id: category.id,
        updates: { is_active: !category.is_active }
      });
      toast({ 
        title: category.is_active ? "Categoría desactivada" : "Categoría activada",
        description: `La categoría "${category.name}" ha sido ${category.is_active ? 'desactivada' : 'activada'}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de la categoría",
        variant: "destructive",
      });
    }
  };

  const toggleProductActive = async (product) => {
    try {
      await updateProductMutation.mutateAsync({
        id: product.id,
        updates: { is_active: !product.is_active }
      });
      toast({ 
        title: product.is_active ? "Producto desactivado" : "Producto activado",
        description: `El producto "${product.name}" ha sido ${product.is_active ? 'desactivado' : 'activado'}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del producto",
        variant: "destructive",
      });
    }
  };

  const moveCategoryOrder = async (categoryId, direction) => {
    const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);
    const currentIndex = sortedCategories.findIndex(c => c.id === categoryId);
    
    if (direction === 'up' && currentIndex > 0) {
      const newOrder = sortedCategories[currentIndex - 1].display_order;
      await updateCategoryOrderMutation.mutateAsync({ id: categoryId, newOrder });
    } else if (direction === 'down' && currentIndex < sortedCategories.length - 1) {
      const newOrder = sortedCategories[currentIndex + 1].display_order;
      await updateCategoryOrderMutation.mutateAsync({ id: categoryId, newOrder });
    }
  };

  const moveProductOrder = async (productId, direction) => {
    const sortedProducts = [...products].sort((a, b) => a.display_order - b.display_order);
    const currentIndex = sortedProducts.findIndex(p => p.id === productId);
    
    if (direction === 'up' && currentIndex > 0) {
      const newOrder = sortedProducts[currentIndex - 1].display_order;
      await updateProductOrderMutation.mutateAsync({ id: productId, newOrder });
    } else if (direction === 'down' && currentIndex < sortedProducts.length - 1) {
      const newOrder = sortedProducts[currentIndex + 1].display_order;
      await updateProductOrderMutation.mutateAsync({ id: productId, newOrder });
    }
  };

  if (categoriesLoading || productsLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión del Catálogo</CardTitle>
          <CardDescription>
            Administra categorías, productos, opciones y variantes
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Categorías</CardTitle>
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetCategoryForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Categoría
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {categoryForm.id ? 'Editar' : 'Nueva'} Categoría
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="category-name">Nombre</Label>
                        <Input
                          id="category-name"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category-description">Descripción</Label>
                        <Textarea
                          id="category-description"
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category-image">URL de Imagen</Label>
                        <Input
                          id="category-image"
                          value={categoryForm.image}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, image: e.target.value }))}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={categoryForm.is_active}
                          onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label>Categoría activa</Label>
                      </div>
                      <Button onClick={handleCategorySubmit} className="w-full">
                        {categoryForm.id ? 'Actualizar' : 'Crear'} Categoría
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-gray-500">{category.description}</div>
                      </div>
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveCategoryOrder(category.id, 'up')}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveCategoryOrder(category.id, 'down')}
                      >
                        <ArrowDown className="h-4 w-4" />
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
                        variant={category.is_active ? "outline" : "default"}
                        onClick={() => toggleCategoryActive(category)}
                      >
                        {category.is_active ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Productos</CardTitle>
                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetProductForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Producto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {productForm.id ? 'Editar' : 'Nuevo'} Producto
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="product-name">Nombre</Label>
                        <Input
                          id="product-name"
                          value={productForm.name}
                          onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="product-description">Descripción</Label>
                        <Textarea
                          id="product-description"
                          value={productForm.description}
                          onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="product-category">Categoría</Label>
                        <Select
                          value={productForm.category_id}
                          onValueChange={(value) => setProductForm(prev => ({ ...prev, category_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.filter(c => c.is_active).map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="product-price">Precio Base</Label>
                        <Input
                          id="product-price"
                          type="number"
                          value={productForm.base_price}
                          onChange={(e) => setProductForm(prev => ({ ...prev, base_price: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="product-image">URL de Imagen</Label>
                        <Input
                          id="product-image"
                          value={productForm.image}
                          onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={productForm.is_active}
                          onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label>Producto activo</Label>
                      </div>
                      <Button onClick={handleProductSubmit} className="w-full">
                        {productForm.id ? 'Actualizar' : 'Crear'} Producto
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {products
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.category?.name || 'Sin categoría'} • ${(product.base_price || 0).toLocaleString()}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-400">{product.description}</div>
                        )}
                      </div>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveProductOrder(product.id, 'up')}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveProductOrder(product.id, 'down')}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsOptionsDialogOpen(true);
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
                        variant={product.is_active ? "outline" : "default"}
                        onClick={() => toggleProductActive(product)}
                      >
                        {product.is_active ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para opciones y variantes de productos */}
      <Dialog open={isOptionsDialogOpen} onOpenChange={setIsOptionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Configurar Opciones y Variantes</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductOptionsManager
              product={selectedProduct}
              onClose={() => {
                setIsOptionsDialogOpen(false);
                setSelectedProduct(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
