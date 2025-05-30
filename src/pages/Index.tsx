import { useState } from "react";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { OrderSummary } from "@/components/pos/OrderSummary";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { OrdersHistory } from "@/components/pos/OrdersHistory";
import { Header } from "@/components/pos/Header";
import { LoginForm } from "@/components/pos/LoginForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface CartItem {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  customerName: string;
  cashReceived?: number;
  photoEvidence?: string;
  createdAt: Date;
  status: string;
}

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("pos");

  const handleLogin = (username: string, password: string) => {
    // Demo login - en producción esto se conectaría a MedusaJS
    if (username === "admin" && password === "lasfritas2024") {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCartItems([]);
    setActiveTab("pos");
  };

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.sku === item.sku);
      
      if (existingItem) {
        return prevItems.map(cartItem =>
          cartItem.sku === item.sku
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (sku: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(prevItems => prevItems.filter(item => item.sku !== sku));
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.sku === sku ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeFromCart = (sku: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.sku !== sku));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePayment = (paymentMethod: string, customerName: string, cashReceived?: number, photoEvidence?: File) => {
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      items: [...cartItems],
      total: calculateTotal(),
      paymentMethod,
      customerName,
      cashReceived,
      photoEvidence: photoEvidence ? URL.createObjectURL(photoEvidence) : undefined,
      createdAt: new Date(),
      status: "Completado"
    };

    setOrders(prevOrders => [newOrder, ...prevOrders]);
    clearCart();
    
    // Aquí se enviaría la orden a MedusaJS
    console.log("Orden enviada a MedusaJS:", newOrder);
  };

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50">
      <Header onLogout={handleLogout} />
      
      <div className="container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="pos" className="text-lg font-semibold">
              Punto de Venta
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-lg font-semibold">
              Órdenes ({orders.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pos" className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
              <div className="lg:col-span-2">
                <ProductGrid onAddToCart={addToCart} />
              </div>
              
              <div className="lg:col-span-1">
                <OrderSummary
                  items={cartItems}
                  total={calculateTotal()}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeFromCart}
                  onClearCart={clearCart}
                  onProceedToPayment={handlePayment}
                  lastOrder={orders[0]}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="orders" className="space-y-0">
            <OrdersHistory orders={orders} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
