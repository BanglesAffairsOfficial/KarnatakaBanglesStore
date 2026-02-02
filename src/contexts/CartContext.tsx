import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  banglesId: string;
  name: string;
  price: number;
  imageUrl?: string;
  size: string;
  color: string;
  colorHex: string;
  quantity: number;
  orderType?: "retail" | "wholesale";
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (banglesId: string, size: string, color: string) => void;
  updateQuantity: (banglesId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    const itemToAdd = { ...newItem, orderType: newItem.orderType ?? "retail" } as CartItem;
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.banglesId === itemToAdd.banglesId && i.size === itemToAdd.size && i.color === itemToAdd.color
      );
      if (existing) {
        return prev.map((i) =>
          i.banglesId === itemToAdd.banglesId && i.size === itemToAdd.size && i.color === itemToAdd.color
            ? { ...i, quantity: i.quantity + itemToAdd.quantity }
            : i
        );
      }
      return [...prev, itemToAdd];
    });
  };

  const removeItem = (banglesId: string, size: string, color: string) => {
    setItems((prev) => prev.filter(
      (i) => !(i.banglesId === banglesId && i.size === size && i.color === color)
    ));
  };

  const updateQuantity = (banglesId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(banglesId, size, color);
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.banglesId === banglesId && i.size === size && i.color === color
            ? { ...i, quantity }
            : i
        )
      );
    }
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
