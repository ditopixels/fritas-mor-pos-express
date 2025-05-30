
import { useState } from "react";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { OrderSummary } from "@/components/pos/OrderSummary";
import { OrdersHistory } from "@/components/pos/OrdersHistory";
import { Header } from "@/components/pos/Header";
import { LoginForm } from "@/components/pos/LoginForm";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CartItem, Order, User } from "@/types";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("pos");
  const [currentView, setCurrentView] = useState("pos");

  const handleLogin = (userData: User) => {
    setUser(userData);
    if (userData.role === 'cashier') {
      setCurrentView('pos');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCartItems([]);
    setActiveTab("pos");
    setCurrentView("pos");
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (view === 'pos') {
      setActiveTab("pos");
    }
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
    const subtotal = calculateTotal();
    const totalDiscount = 0; // Se calculará con promociones
    const total = subtotal - totalDiscount;

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      items: [...cartItems],
      total,
      subtotal,
      totalDiscount,
      paymentMethod,
      customerName,
      cashReceived,
      photoEvidence: photoEvidence ? URL.createObjectURL(photoEvidence) : undefined,
      createdAt: new Date(),
      status: "Completado"
    };

    setOrders(prevOrders => [newOrder, ...prevOrders]);
    clearCart();
    
    console.log("Orden procesada:", newOrder);
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50">
      <Header 
        user={user} 
        currentView={currentView}
        onLogout={handleLogout} 
        onNavigate={user.role === 'admin' ? handleNavigate : undefined}
      />
      
      <div className="container mx-auto p-4">
        {currentView === 'admin' && user.role === 'admin' ? (
          <AdminDashboard orders={orders} />
        ) : (
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
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="orders" className="space-y-0">
              <OrdersHistory orders={orders} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Index;
