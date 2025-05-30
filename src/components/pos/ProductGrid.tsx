
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CartItem } from "@/pages/Index";

// Importar iconos apropiados - usando iconos disponibles en lucide-react
import { ChefHat, UtensilsCrossed, Beef } from "lucide-react";

// Simulación de datos de MedusaJS con estructura mejorada para variantes
const categories = [
  { id: "papas", name: "Papas Fritas", color: "bg-yellow-100 text-yellow-800", icon: UtensilsCrossed },
  { id: "hamburguesas", name: "Hamburguesas", color: "bg-red-100 text-red-800", icon: ChefHat },
  { id: "pinchos", name: "Pinchos", color: "bg-green-100 text-green-800", icon: Beef }
];

// Datos base de productos con configuración de variantes
const baseProducts = {
  papas: [
    { 
      id: "papas-tradicionales", 
      name: "Papas Tradicionales", 
      basePrice: 3500,
      sizes: [
        { id: "pequena", name: "Pequeña", multiplier: 1 },
        { id: "mediana", name: "Mediana", multiplier: 1.3 },
        { id: "grande", name: "Grande", multiplier: 1.6 }
      ],
      sauces: [
        { id: "sin-salsa", name: "Sin Salsa", price: 0 },
        { id: "salsa-rosada", name: "Salsa Rosada", price: 500 },
        { id: "salsa-bbq", name: "Salsa BBQ", price: 500 },
        { id: "todas-salsas", name: "Todas las Salsas", price: 800 }
      ]
    },
    { 
      id: "papas-premium", 
      name: "Papas Premium", 
      basePrice: 4000,
      sizes: [
        { id: "pequena", name: "Pequeña", multiplier: 1 },
        { id: "mediana", name: "Mediana", multiplier: 1.3 },
        { id: "grande", name: "Grande", multiplier: 1.6 }
      ],
      sauces: [
        { id: "sin-salsa", name: "Sin Salsa", price: 0 },
        { id: "salsa-rosada", name: "Salsa Rosada", price: 500 },
        { id: "salsa-bbq", name: "Salsa BBQ", price: 500 },
        { id: "todas-salsas", name: "Todas las Salsas", price: 800 }
      ]
    }
    // Continuar con los otros 4 tipos...
  ],
  hamburguesas: [
    { id: "hamburguesa-simple", productName: "Hamburguesa", variantName: "Simple", sku: "HAM-SIM", price: 8000 },
    { id: "hamburguesa-queso", productName: "Hamburguesa", variantName: "Con Queso", sku: "HAM-QUE", price: 9000 },
    { id: "hamburguesa-doble", productName: "Hamburguesa", variantName: "Doble Carne", sku: "HAM-DOB", price: 12000 },
    { id: "hamburguesa-especial", productName: "Hamburguesa", variantName: "Especial de la Casa", sku: "HAM-ESP", price: 15000 }
  ],
  pinchos: [
    { id: "pincho-pollo", productName: "Pincho", variantName: "de Pollo", sku: "PIN-POL", price: 6000 },
    { id: "pincho-carne", productName: "Pincho", variantName: "de Carne", sku: "PIN-CAR", price: 7000 },
    { id: "pincho-mixto", productName: "Pincho", variantName: "Mixto", sku: "PIN-MIX", price: 8000 },
    { id: "pincho-vegetariano", productName: "Pincho", variantName: "Vegetariano", sku: "PIN-VEG", price: 5500 }
  ]
};

interface ProductGridProps {
  onAddToCart: (item: Omit<CartItem, "quantity">) => void;
}

export const ProductGrid = ({ onAddToCart }: ProductGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState("papas");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedSauce, setSelectedSauce] = useState<string>("");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleAddVariantToCart = (product: any, size: any, sauce: any) => {
    const finalPrice = Math.round((product.basePrice * size.multiplier) + sauce.price);
    const variantName = `${size.name} - ${sauce.name}`;
    const sku = `${product.id.toUpperCase()}-${size.id.toUpperCase()}-${sauce.id.toUpperCase()}`;

    onAddToCart({
      id: sku,
      productName: product.name,
      variantName: variantName,
      sku: sku,
      price: finalPrice
    });

    // Reset selections
    setSelectedProduct(null);
    setSelectedSize("");
    setSelectedSauce("");
  };

  const handleDirectAddToCart = (product: any) => {
    onAddToCart(product);
  };

  const calculateVariantPrice = () => {
    if (!selectedProduct || !selectedSize || !selectedSauce) return 0;
    
    const product = selectedProduct;
    const size = product.sizes.find((s: any) => s.id === selectedSize);
    const sauce = product.sauces.find((s: any) => s.id === selectedSauce);
    
    if (!size || !sauce) return 0;
    
    return Math.round((product.basePrice * size.multiplier) + sauce.price);
  };

  const getSizeColor = (variantName: string) => {
    if (variantName.includes("Pequeña")) return "bg-blue-100 text-blue-800";
    if (variantName.includes("Mediana")) return "bg-orange-100 text-orange-800";
    if (variantName.includes("Grande")) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-yellow-50 to-red-50">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Seleccionar Productos</h2>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSelectedProduct(null);
                  setSelectedSize("");
                  setSelectedSauce("");
                }}
                className={`h-20 flex flex-col space-y-2 text-lg font-semibold ${
                  selectedCategory === category.id 
                    ? "bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600 text-white" 
                    : "hover:bg-gradient-to-r hover:from-yellow-50 hover:to-red-50"
                }`}
              >
                <IconComponent className="h-8 w-8" />
                <span className="text-sm">{category.name}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {selectedCategory === "papas" ? (
          <div className="space-y-6">
            {/* Variant Configuration for Papas */}
            {selectedProduct ? (
              <div className="bg-gradient-to-r from-yellow-50 to-red-50 rounded-lg p-4 border-2 border-yellow-200">
                <h3 className="text-lg font-bold mb-4">{selectedProduct.name}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Tamaño:</label>
                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tamaño" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProduct.sizes.map((size: any) => (
                          <SelectItem key={size.id} value={size.id}>
                            {size.name} - {formatPrice(selectedProduct.basePrice * size.multiplier)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Salsa:</label>
                    <Select value={selectedSauce} onValueChange={setSelectedSauce}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar salsa" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProduct.sauces.map((sauce: any) => (
                          <SelectItem key={sauce.id} value={sauce.id}>
                            {sauce.name} {sauce.price > 0 && `+${formatPrice(sauce.price)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-lg font-bold text-red-600">
                    Total: {selectedSize && selectedSauce ? formatPrice(calculateVariantPrice()) : "---"}
                  </div>
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedProduct(null);
                        setSelectedSize("");
                        setSelectedSauce("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => {
                        if (selectedSize && selectedSauce) {
                          const size = selectedProduct.sizes.find((s: any) => s.id === selectedSize);
                          const sauce = selectedProduct.sauces.find((s: any) => s.id === selectedSauce);
                          handleAddVariantToCart(selectedProduct, size, sauce);
                        }
                      }}
                      disabled={!selectedSize || !selectedSauce}
                      className="bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600"
                    >
                      Agregar al Pedido
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {baseProducts[selectedCategory].map((product) => (
                  <Button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="h-32 p-4 text-left justify-start bg-white border-2 border-gray-200 hover:border-yellow-300 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-red-50 text-gray-800"
                    variant="outline"
                  >
                    <div className="w-full">
                      <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">Desde {formatPrice(product.basePrice)}</p>
                      <Badge className="bg-blue-100 text-blue-800">6 variantes</Badge>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Original grid for other categories
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {baseProducts[selectedCategory as keyof typeof baseProducts]?.map((product) => (
              <Button
                key={product.id}
                onClick={() => handleDirectAddToCart(product)}
                className="h-auto p-4 text-left justify-start bg-white border-2 border-gray-200 hover:border-yellow-300 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-red-50 text-gray-800"
                variant="outline"
              >
                <div className="w-full">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm leading-tight">
                      {product.productName}
                    </h3>
                    <Badge className={getSizeColor(product.variantName)}>
                      {product.variantName.includes("Pequeña") ? "P" : 
                       product.variantName.includes("Mediana") ? "M" :
                       product.variantName.includes("Grande") ? "G" : ""}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{product.variantName}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-red-600">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-xs text-gray-500">SKU: {product.sku}</span>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
