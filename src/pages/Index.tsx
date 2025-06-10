
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { OptimizedProductGrid } from "@/components/pos/OptimizedProductGrid";
import { OrderSummary } from "@/components/pos/OrderSummary";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { TransferImageModal } from "@/components/pos/TransferImageModal";
import { OrdersHistory } from "@/components/pos/OrdersHistory";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Header } from "@/components/pos/Header";
import { LoginForm } from "@/components/pos/LoginForm";
import { TransferViewModal } from "@/components/pos/TransferViewModal";
import { PrinterStatus } from "@/components/pos/PrinterStatus";
import { useAuth } from "@/hooks/useAuth";
import { CartItem } from "@/types";
import { useOptimizedPromotionCalculator } from "@/hooks/useOptimizedPromotions";
import { useOrders } from "@/hooks/useOrders";

const Index = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<"pos" | "orders" | "admin">("pos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransferImageModal, setShowTransferImageModal] = useState(false);
  const [showTransferViewModal, setShowTransferViewModal] = useState(false);
  const [selectedTransferImage, setSelectedTransferImage] = useState<string | null>(null);
  
  const { calculatePromotions } = useOptimizedPromotionCalculator();
  const { data: orders = [], isLoading, error } = useOrders();

  console.log('🔍 Index - Orders data:', { 
    ordersCount: orders.length, 
    isLoading, 
    error, 
    firstOrder: orders[0],
    user: user?.role 
  });

  useEffect(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (cart.length > 0) {
      const { updatedItems, appliedPromotions, totalDiscount } = calculatePromotions(cart, subtotal);
      
      const hasChanges = updatedItems.some((updatedItem, index) => {
        const originalItem = cart[index];
        return originalItem && (
          updatedItem.price !== originalItem.price ||
          JSON.stringify(updatedItem.appliedPromotions) !== JSON.stringify(originalItem.appliedPromotions)
        );
      });

      if (hasChanges) {
        setCart(updatedItems);
      }
    }
  }, [cart.length, calculatePromotions]);

  if (!user) {
    return <LoginForm onLogin={() => {}} />;
  }

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    console.log('Index - Adding to cart:', item);
    
    const existingItemIndex = cart.findIndex(cartItem => 
      cartItem.sku === item.sku && 
      JSON.stringify(cartItem.selectedOptions) === JSON.stringify(item.selectedOptions) &&
      JSON.stringify(cartItem.selectedAttachments) === JSON.stringify(item.selectedAttachments)
    );

    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateCartItem = (sku: string, updates: Partial<CartItem>) => {
    setCart(cart.map(item => 
      item.sku === sku ? { ...item, ...updates } : item
    ));
  };

  const removeFromCart = (sku: string) => {
    setCart(cart.filter(item => item.sku !== sku));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setShowPaymentModal(false);
    setCurrentView("orders");
  };

  const handleTransferImageClick = (imageUrl: string) => {
    setSelectedTransferImage(imageUrl);
    setShowTransferViewModal(true);
  };

  const renderContent = () => {
    switch (currentView) {
      case "pos":
        return (
          <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6">
            <div className="flex-1 min-h-0">
              <OptimizedProductGrid onAddToCart={addToCart} />
            </div>
            <div className="w-full lg:w-96 flex-shrink-0">
              <OrderSummary
                items={cart}
                customerName={customerName}
                onCustomerNameChange={setCustomerName}
                onUpdateItem={updateCartItem}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                onCheckout={() => setShowPaymentModal(true)}
              />
            </div>
          </div>
        );
      
      case "orders":
        return <OrdersHistory orders={orders} onTransferImageClick={handleTransferImageClick} />;
      
      case "admin":
        return user.role === "admin" ? (
          <AdminDashboard orders={orders} />
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No tienes permisos para acceder al panel de administración</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        user={{
          id: user.id,
          username: user.username || user.email || '',
          role: user.role,
          name: user.name || user.username || user.email || ''
        }} 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onLogout={logout} 
      />
      
      <PrinterStatus />
      
      <main className="flex-1 p-2 sm:p-4 lg:p-6 overflow-hidden">
        {renderContent()}
      </main>

      {showPaymentModal && (
        <PaymentModal
          items={cart}
          customerName={customerName}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
          onShowTransferImage={() => setShowTransferImageModal(true)}
        />
      )}

      {showTransferImageModal && (
        <TransferImageModal
          isOpen={showTransferImageModal}
          onClose={() => setShowTransferImageModal(false)}
        />
      )}

      {showTransferViewModal && selectedTransferImage && (
        <TransferViewModal
          isOpen={showTransferViewModal}
          imageUrl={selectedTransferImage}
          customerName={customerName}
          onClose={() => {
            setShowTransferViewModal(false);
            setSelectedTransferImage(null);
          }}
        />
      )}
    </div>
  );
};

export default Index;
