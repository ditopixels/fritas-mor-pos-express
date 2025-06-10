
import { useState } from "react";
import { OptimizedProductGrid } from "@/components/pos/OptimizedProductGrid";
import { OrderSummary } from "@/components/pos/OrderSummary";
import { OrdersHistory } from "@/components/pos/OrdersHistory";
import { Header } from "@/components/pos/Header";
import { PrinterStatus } from "@/components/pos/PrinterStatus";
import { AuthPage } from "@/components/auth/AuthPage";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CartItem } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useOptimizedOrders } from "@/hooks/useOptimizedOrders";
import { usePromotionCalculator } from "@/hooks/usePromotionCalculator";

const Index = () => {
  const { user, profile, loading, signOut } = useAuth();
  const { data: orders, addOrderToLocal } = useOptimizedOrders(25);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState("pos");
  const [currentView, setCurrentView] = useState("pos");
  const { calculatePromotions } = usePromotionCalculator();

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
    if (cartItems.length === 0) return 0;
    
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const promotionResult = calculatePromotions(cartItems, subtotal);
    return promotionResult.newSubtotal;
  };

  const handlePayment = (paymentMethod: string, customerName: string, cashReceived?: number, photoEvidence?: File) => {
    // Esta función ahora es manejada por el hook useCreateOrder en OrderSummary
    // Pero la mantenemos para compatibilidad
    console.log("Pago procesado:", { paymentMethod, customerName, cashReceived });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        <span className="ml-2">Cargando...</span>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50">
      <Header 
        user={{
          id: profile.id,
          username: profile.username,
          role: profile.role,
          name: profile.name,
        }}
        currentView={currentView}
        onLogout={signOut} 
        onNavigate={profile.role === 'admin' ? handleNavigate : undefined}
      />
      
      <div className="container mx-auto p-2">
        {currentView === 'admin' && profile.role === 'admin' ? (
          <AdminDashboard orders={orders || []} />
        ) : (
          <div className="space-y-2">
            {/* Componente compacto de estado de impresora y tabs */}
            <div className="flex items-center justify-between gap-4 bg-white rounded-lg p-2 shadow-sm">
              <div className="flex-shrink-0">
                <PrinterStatus />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="pos" className="text-sm font-medium">
                    Punto de Venta
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="text-sm font-medium">
                    Órdenes ({orders?.length || 0})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="pos" className="space-y-0 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-180px)]">
                  <div className="lg:col-span-2">
                    <OptimizedProductGrid onAddToCart={addToCart} />
                  </div>
                  
                  <div className="lg:col-span-1">
                    <OrderSummary
                      items={cartItems}
                      total={calculateTotal()}
                      onUpdateQuantity={updateQuantity}
                      onRemoveItem={removeFromCart}
                      onClearCart={clearCart}
                      onProceedToPayment={handlePayment}
                      onOrderCreated={addOrderToLocal}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="orders" className="space-y-0 mt-0">
                <OrdersHistory orders={orders || []} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
