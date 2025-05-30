import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  useProducts,
  useCategories,
  Product as ProductType,
  Category as CategoryType,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useUpdateCategoryOrder,
  useUpdateProductOrder,
} from "@/hooks/useProducts";
import { ProductOptionsManager } from "./ProductOptionsManager";
import { ProductVariantsManager } from "./ProductVariantsManager";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  image?: string;
  base_price?: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  options?: ProductOption[];
}

interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  values: string[];
  is_required: boolean;
  created_at: string;
}

const CatalogManagement = () => {
  const { toast } = useToast();
  const { data: products, isLoading: isProductsLoading } = useProducts();
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();
  const [categoriesState, setCategoriesState] = useState<CategoryType[]>([]);
  const [productsState, setProductsState] = useState<ProductType[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductCategoryId, setNewProductCategoryId] = useState("");
  const [newProductBasePrice, setNewProductBasePrice] = useState<number | undefined>(undefined);
  const [isCategoryActive, setIsCategoryActive] = useState(true);
  const [isProductActive, setIsProductActive] = useState(true);
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const updateCategoryOrderMutation = useUpdateCategoryOrder();
  const updateProductOrderMutation = useUpdateProductOrder();

  useEffect(() => {
    if (categories) {
      setCategoriesState(categories);
    }
  }, [categories]);

  useEffect(() => {
    if (products) {
      setProductsState(products);
    }
  }, [products]);

  const handleReorderCategories = (newOrder: CategoryType[]) => {
    setCategoriesState(newOrder);
    const orderUpdates = newOrder.map((category, index) => ({
      id: category.id,
      display_order: index
    }));
    updateCategoryOrderMutation.mutate(orderUpdates);
  };

  const handleReorderProducts = (categoryId: string, newOrder: ProductType[]) => {
    setProductsState(prev => 
      prev.map(product => {
        const reorderedProduct = newOrder.find(p => p.id === product.id);
        return reorderedProduct || product;
      })
    );
    
    const orderUpdates = newOrder.map((product, index) => ({
      id: product.id,
      display_order: index
    }));
    updateProductOrderMutation.mutate(orderUpdates);
  };

  const onDragEndCategory = (result: any) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(categoriesState);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    handleReorderCategories(items);
  };

  const onDragEndProduct = (result: any, categoryId: string) => {
    if (!result.destination) {
      return;
    }

    const currentProducts = productsState.filter(product => product.category_id === categoryId);
    const items = Array.from(currentProducts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    handleReorderProducts(categoryId, items);
  };

  const handleOpenCategoryDialog = () => {
    setSelectedCategory(null);
    setNewCategoryName("");
    setNewCategoryDescription("");
    setIsCategoryActive(true);
    setIsCategoryDialogOpen(true);
  };

  const handleOpenProductDialog = () => {
    setSelectedProduct(null);
    setNewProductName("");
    setNewProductDescription("");
    setNewProductCategoryId(categoriesState[0]?.id || "");
    setNewProductBasePrice(undefined);
    setIsProductActive(true);
    setIsProductDialogOpen(true);
  };

  const handleEditCategory = (category: CategoryType) => {
    setSelectedCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryDescription(category.description || "");
    setIsCategoryActive(category.is_active);
    setIsCategoryDialogOpen(true);
  };

  const handleEditProduct = (product: ProductType) => {
    setSelectedProduct(product);
    setNewProductName(product.name);
    setNewProductDescription(product.description || "");
    setNewProductCategoryId(product.category_id);
    setNewProductBasePrice(product.base_price);
    setIsProductActive(product.is_active);
    setIsProductDialogOpen(true);
  };

  const handleDeleteCategory = (category: CategoryType) => {
    setSelectedCategory(category);
    setIsDeleteConfirmationOpen(true);
  };

  const handleDeleteProduct = (product: ProductType) => {
    setSelectedProduct(product);
    setIsDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedCategory) {
      await deleteCategoryMutation.mutateAsync(selectedCategory.id);
      toast({
        title: "Categoría eliminada",
        description: `La categoría ${selectedCategory.name} ha sido eliminada.`,
      });
    } else if (selectedProduct) {
      await deleteProductMutation.mutateAsync(selectedProduct.id);
      toast({
        title: "Producto eliminado",
        description: `El producto ${selectedProduct.name} ha sido eliminado.`,
      });
    }
    setIsDeleteConfirmationOpen(false);
    setSelectedCategory(null);
    setSelectedProduct(null);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría es requerido.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCategoryMutation.mutateAsync({
        name: newCategoryName,
        description: newCategoryDescription,
        is_active: isCategoryActive,
        display_order: categoriesState.length,
      });

      toast({
        title: "Categoría creada",
        description: `La categoría ${newCategoryName} ha sido creada.`,
      });
      setIsCategoryDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear la categoría.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría es requerido.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCategory) return;

    try {
      await updateCategoryMutation.mutateAsync({
        id: selectedCategory.id,
        updates: {
          name: newCategoryName,
          description: newCategoryDescription,
          is_active: isCategoryActive,
        },
      });

      toast({
        title: "Categoría actualizada",
        description: `La categoría ${newCategoryName} ha sido actualizada.`,
      });
      setIsCategoryDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la categoría.",
        variant: "destructive",
      });
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim() || !newProductCategoryId) {
      toast({
        title: "Error",
        description: "Nombre y categoría son requeridos.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createProductMutation.mutateAsync({
        name: newProductName,
        description: newProductDescription,
        category_id: newProductCategoryId,
        base_price: newProductBasePrice,
        is_active: isProductActive,
        display_order: productsState.length,
      });

      toast({
        title: "Producto creado",
        description: `El producto ${newProductName} ha sido creado.`,
      });
      setIsProductDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear el producto.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!newProductName.trim() || !newProductCategoryId) {
      toast({
        title: "Error",
        description: "Nombre y categoría son requeridos.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProduct) return;

    try {
      await updateProductMutation.mutateAsync({
        id: selectedProduct.id,
        updates: {
          name: newProductName,
          description: newProductDescription,
          category_id: newProductCategoryId,
          base_price: newProductBasePrice,
          is_active: isProductActive,
          options: selectedProduct.options,
        },
      });

      toast({
        title: "Producto actualizado",
        description: `El producto ${newProductName} ha sido actualizado.`,
      });
      setIsProductDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el producto.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Administración del Catálogo</h2>
        <div>
          <Button onClick={handleOpenCategoryDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
          <Button onClick={handleOpenProductDialog} className="ml-2">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Categorías</CardTitle>
              <CardDescription>
                Administra las categorías de tus productos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isCategoriesLoading ? (
                <p>Cargando categorías...</p>
              ) : (
                <DragDropContext onDragEnd={onDragEndCategory}>
                  <Droppable droppableId="categories">
                    {(provided) => (
                      <Table {...provided.droppableProps} ref={provided.innerRef}>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Orden</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoriesState.map((category, index) => (
                            <Draggable key={category.id} draggableId={category.id} index={index}>
                              {(provided) => (
                                <TableRow 
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  ref={provided.innerRef}
                                >
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>{category.name}</TableCell>
                                  <TableCell>
                                    {category.is_active ? "Activa" : "Inactiva"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditCategory(category)}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Editar
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteCategory(category)}
                                      className="text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Borrar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Draggable>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {categoriesState.map(category => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>Productos en {category.name}</CardTitle>
                <CardDescription>
                  Administra los productos de esta categoría.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isProductsLoading ? (
                  <p>Cargando productos...</p>
                ) : (
                  <DragDropContext 
                    onDragEnd={(result) => onDragEndProduct(result, category.id)}
                  >
                    <Droppable droppableId={`products-${category.id}`}>
                      {(provided) => (
                        <Table {...provided.droppableProps} ref={provided.innerRef}>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Orden</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Precio Base</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {productsState
                              .filter(product => product.category_id === category.id)
                              .map((product, index) => (
                                <Draggable key={product.id} draggableId={product.id} index={index}>
                                  {(provided) => (
                                    <TableRow
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      ref={provided.innerRef}
                                    >
                                      <TableCell>{index + 1}</TableCell>
                                      <TableCell>{product.name}</TableCell>
                                      <TableCell>${product.base_price?.toLocaleString()}</TableCell>
                                      <TableCell>
                                        {product.is_active ? "Activo" : "Inactivo"}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditProduct(product)}
                                        >
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Editar
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteProduct(product)}
                                          className="text-red-500"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Borrar
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Draggable>
                              ))}
                          </TableBody>
                        </Table>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Product Form Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
            <DialogDescription>
              Administra la información del producto.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="product-name">Nombre</Label>
              <Input
                id="product-name"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="product-category">Categoría</Label>
              <select
                id="product-category"
                className="w-full rounded-md border border-gray-200 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                value={newProductCategoryId}
                onChange={(e) => setNewProductCategoryId(e.target.value)}
              >
                {categoriesState.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="product-base-price">Precio Base</Label>
              <Input
                id="product-base-price"
                type="number"
                value={newProductBasePrice === undefined ? '' : newProductBasePrice.toString()}
                onChange={(e) => setNewProductBasePrice(Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="product-status">Estado</Label>
              <Switch
                id="product-status"
                checked={isProductActive}
                onCheckedChange={setIsProductActive}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="product-description">Descripción</Label>
            <Textarea
              id="product-description"
              value={newProductDescription}
              onChange={(e) => setNewProductDescription(e.target.value)}
            />
          </div>
          
          <Separator />
          
          {selectedProduct && (
            <ProductOptionsManager 
              product={selectedProduct}
              onUpdateOptions={(options) => {
                setSelectedProduct(prev => prev ? { ...prev, options } : null);
              }}
            />
          )}

          {selectedProduct && (
            <ProductVariantsManager 
              product={selectedProduct}
              options={selectedProduct.options || []}
              variants={selectedProduct.variants || []}
              onUpdateVariants={(variants) => {
                setSelectedProduct(prev => prev ? { ...prev, variants } : null);
              }}
            />
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsProductDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={selectedProduct ? handleUpdateProduct : handleCreateProduct}
            >
              {selectedProduct ? "Actualizar Producto" : "Crear Producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Form Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
            <DialogDescription>
              Administra la información de la categoría.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="category-name">Nombre</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="category-description">Descripción</Label>
              <Textarea
                id="category-description"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="category-status">Estado</Label>
              <Switch
                id="category-status"
                checked={isCategoryActive}
                onCheckedChange={setIsCategoryActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCategoryDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={selectedCategory ? handleUpdateCategory : handleCreateCategory}
            >
              {selectedCategory ? "Actualizar Categoría" : "Crear Categoría"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmationOpen} onOpenChange={setIsDeleteConfirmationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar este{" "}
              {selectedCategory ? "categoría" : "producto"}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CatalogManagement;
