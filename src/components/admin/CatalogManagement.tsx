
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, Edit, Trash2 } from "lucide-react";
import { useCategories, useProducts } from "@/hooks/useProducts";

export const CatalogManagement = () => {
  const [activeTab, setActiveTab] = useState("categories");
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: products, isLoading: productsLoading } = useProducts();

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
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="options">Opciones</TabsTrigger>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorías</CardTitle>
              <CardDescription>Gestiona las categorías de productos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Lista de Categorías ({categories?.length || 0})</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Categoría
                </Button>
              </div>
              
              {categories && categories.length > 0 ? (
                <div className="grid gap-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{category.name}</h4>
                        <p className="text-sm text-gray-600">{category.description}</p>
                        <p className="text-xs text-gray-500">Estado: {category.is_active ? 'Activo' : 'Inactivo'}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
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
              <CardTitle>Productos</CardTitle>
              <CardDescription>Gestiona los productos del catálogo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Lista de Productos ({products?.length || 0})</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </div>
              
              {products && products.length > 0 ? (
                <div className="grid gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.description}</p>
                        <p className="text-xs text-gray-500">
                          Categoría: {product.category?.name || 'Sin categoría'} | 
                          Variantes: {product.variants?.length || 0} | 
                          Estado: {product.is_active ? 'Activo' : 'Inactivo'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
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
