
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
  const { data: orders, addOrderToLocal, forceRefresh } = useOptimizedOrders(25);
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
        return [...prevItems, { ...item, quantity: 1, selectedSauces: [] }];
      }
    });
  };

  const updateQuantity = (sku: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(prevItems => prevItems.filter(item => item.sku !== sku));
    } else {
      setCartItems(prevItems =>
        prevItems.map(item => {
          if (item.sku === sku) {
            const updatedItem = { ...item, quantity: newQuantity };
            
            // Ajustar el array de salsas al nuevo quantity
            if (updatedItem.selectedSauces) {
              if (newQuantity > updatedItem.selectedSauces.length) {
                // Agregar arrays vacíos para las nuevas unidades
                const newSauces = [...updatedItem.selectedSauces];
                while (newSauces.length < newQuantity) {
                  newSauces.push([]);
                }
                updatedItem.selectedSauces = newSauces;
              } else {
                // Recortar el array si se reduce la cantidad
                updatedItem.selectedSauces = updatedItem.selectedSauces.slice(0, newQuantity);
              }
            }
            
            return updatedItem;
          }
          return item;
        })
      );
    }
  };

  const updateItemSauces = (sku: string, sauces: string[][]) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.sku === sku ? { ...item, selectedSauces: sauces } : item
      )
    );
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
      
      <div className="container mx-auto p-4">
        {currentView === 'admin' && profile.role === 'admin' ? (
          <AdminDashboard orders={orders || []} />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="pos" className="text-lg font-semibold">
                Punto de Venta
              </TabsTrigger>
              <TabsTrigger value="orders" className="text-lg font-semibold">
                Órdenes ({orders?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pos" className="space-y-0">
              {/* Estado de la impresora */}
              <div className="mb-4">
                <PrinterStatus />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
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
                    onUpdateItemSauces={updateItemSauces}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="orders" className="space-y-0">
              <OrdersHistory orders={orders || []} onRefresh={forceRefresh} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Index;
