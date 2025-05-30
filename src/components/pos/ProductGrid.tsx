
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartItem } from "@/pages/Index";

// Simulación de datos de MedusaJS
const categories = [
  { id: "papas", name: "Papas Fritas", color: "bg-yellow-100 text-yellow-800" },
  { id: "hamburguesas", name: "Hamburguesas", color: "bg-red-100 text-red-800" },
  { id: "pinchos", name: "Pinchos", color: "bg-green-100 text-green-800" }
];

const products = {
  papas: [
    { id: "papas-sin-salsa-pequena", productName: "Papas Fritas", variantName: "Sin Salsa - Pequeña", sku: "PAP-SS-P", price: 3500 },
    { id: "papas-sin-salsa-mediana", productName: "Papas Fritas", variantName: "Sin Salsa - Mediana", sku: "PAP-SS-M", price: 4500 },
    { id: "papas-sin-salsa-grande", productName: "Papas Fritas", variantName: "Sin Salsa - Grande", sku: "PAP-SS-G", price: 5500 },
    { id: "papas-rosada-pequena", productName: "Papas Fritas", variantName: "Con Salsa Rosada - Pequeña", sku: "PAP-SR-P", price: 4000 },
    { id: "papas-rosada-mediana", productName: "Papas Fritas", variantName: "Con Salsa Rosada - Mediana", sku: "PAP-SR-M", price: 5000 },
    { id: "papas-rosada-grande", productName: "Papas Fritas", variantName: "Con Salsa Rosada - Grande", sku: "PAP-SR-G", price: 6000 },
    { id: "papas-todas-pequena", productName: "Papas Fritas", variantName: "Con Todas las Salsas - Pequeña", sku: "PAP-TS-P", price: 4500 },
    { id: "papas-todas-mediana", productName: "Papas Fritas", variantName: "Con Todas las Salsas - Mediana", sku: "PAP-TS-M", price: 5500 },
    { id: "papas-todas-grande", productName: "Papas Fritas", variantName: "Con Todas las Salsas - Grande", sku: "PAP-TS-G", price: 6500 }
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(price);
  };

  const getSizeColor = (variantName: string) => {
    if (variantName.includes("Pequeña")) return "bg-blue-100 text-blue-800";
    if (variantName.includes("Mediana")) return "bg-orange-100 text-orange-800";
    if (variantName.includes("Grande")) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Seleccionar Productos</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className={`${
                selectedCategory === category.id 
                  ? "bg-orange-500 hover:bg-orange-600" 
                  : "hover:bg-orange-50"
              }`}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {products[selectedCategory as keyof typeof products]?.map((product) => (
            <Button
              key={product.id}
              onClick={() => onAddToCart(product)}
              className="h-auto p-4 text-left justify-start bg-white border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-800"
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
                  <span className="text-lg font-bold text-orange-600">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs text-gray-500">SKU: {product.sku}</span>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
