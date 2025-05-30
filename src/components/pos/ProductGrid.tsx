
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { CartItem } from "@/types";

interface ProductOption {
  id: string;
  name: string;
  values: string[];
  isRequired: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  image?: string;
  options: ProductOption[];
  isActive: boolean;
  createdAt: Date;
}

interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  optionValues: Record<string, string>;
  isActive: boolean;
  stock?: number;
}

interface ProductGridProps {
  onAddToCart: (item: Omit<CartItem, "quantity">) => void;
}

// Mock data for demonstration
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Papas Fritas",
    description: "Deliciosas papas fritas crujientes",
    categoryId: "cat1",
    image: "/placeholder.svg",
    options: [
      {
        id: "opt1",
        name: "Tamaño",
        values: ["Pequeño", "Mediano", "Grande"],
        isRequired: true
      },
      {
        id: "opt2", 
        name: "Salsa",
        values: ["Rosada", "Ajo", "Sin Salsa"],
        isRequired: false
      }
    ],
    isActive: true,
    createdAt: new Date()
  },
  {
    id: "2",
    name: "Hamburguesa Clásica",
    description: "Hamburguesa con carne, lechuga y tomate",
    categoryId: "cat2",
    image: "/placeholder.svg",
    options: [
      {
        id: "opt3",
        name: "Tamaño",
        values: ["Simple", "Doble"],
        isRequired: true
      }
    ],
    isActive: true,
    createdAt: new Date()
  },
  {
    id: "3",
    name: "Gaseosa",
    description: "Bebida refrescante",
    categoryId: "cat3",
    image: "/placeholder.svg",
    options: [
      {
        id: "opt4",
        name: "Tamaño",
        values: ["300ml", "500ml", "1L"],
        isRequired: true
      }
    ],
    isActive: true,
    createdAt: new Date()
  }
];

export const ProductGrid = ({ onAddToCart }: ProductGridProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products] = useState<Product[]>(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (products) {
      setFilteredProducts(products);
    }
  }, [products]);

  useEffect(() => {
    if (products) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const handleAddToCart = (product: Product, variant: ProductVariant) => {
    const item = {
      id: product.id,
      productName: product.name,
      variantName: variant.name,
      sku: variant.sku,
      price: variant.price,
      image: product.image,
    };
    onAddToCart(item);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-32 object-cover mb-4 rounded-md"
                />
              )}
              <div className="variants space-y-2">
                {product.options.length > 0 ? (
                  product.options.map(option => (
                    <div key={option.id} className="text-sm">
                      <p className="font-semibold">{option.name}:</p>
                      <div className="flex flex-wrap gap-2">
                        {option.values.map(value => (
                          <Button key={value} variant="outline" size="sm">
                            {value}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No hay opciones disponibles.</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-center">
              {product.options.length === 0 ? (
                <Button onClick={() => handleAddToCart(product, {
                  id: product.id,
                  productId: product.id,
                  sku: product.id,
                  name: product.name,
                  price: 5000,
                  optionValues: {},
                  isActive: true,
                })}
                >
                  Agregar al carrito - $5.000
                </Button>
              ) : (
                <p className="text-gray-500 text-center">Seleccione las opciones para agregar al carrito.</p>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
