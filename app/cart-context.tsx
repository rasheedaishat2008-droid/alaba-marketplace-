"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CartItem = { id: string; name: string; price_kobo: number; quantity: number };
type Ctx = {
  items: CartItem[];
  add: (p: Omit<CartItem, "quantity">) => void;
  remove: (id: string) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartCtx = createContext<Ctx>(null!);
export const useCart = () => useContext(CartCtx);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("cart");
      if (s) setItems(JSON.parse(s));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("cart", JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  const add = (p: Omit<CartItem, "quantity">) =>
    setItems((prev) => {
      const found = prev.find((i) => i.id === p.id);
      if (found) return prev.map((i) => (i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { ...p, quantity: 1 }];
    });

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);
  const total = items.reduce((s, i) => s + i.price_kobo * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return <CartCtx.Provider value={{ items, add, remove, clear, total, count }}>{children}</CartCtx.Provider>;
}