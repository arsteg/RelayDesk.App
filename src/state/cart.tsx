import React, { createContext, useContext, useMemo, useState } from "react";

export interface CartLine {
  productId: string;
  name: string;
  priceMinor: number;
  unit: string; // pricing/billing unit
  orderUnit: string; // the unit the customer is ordering in
  isVariableMeasure: boolean;
  quantity: number; // supports decimals
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotalMinor: number;
  add: (item: Omit<CartLine, "quantity">, qty?: number) => void;
  setQuantity: (productId: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotalMinor = lines.reduce((s, l) => s + Math.round(l.priceMinor * l.quantity), 0);
    return {
      lines,
      count,
      subtotalMinor,
      add(item, qty = 1) {
        setLines((prev) => {
          const existing = prev.find((l) => l.productId === item.productId);
          if (existing) return prev.map((l) => (l.productId === item.productId ? { ...l, quantity: l.quantity + qty } : l));
          return [...prev, { ...item, quantity: qty }];
        });
      },
      setQuantity(productId, qty) {
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => l.productId !== productId)
            : prev.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l)),
        );
      },
      clear() {
        setLines([]);
      },
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
