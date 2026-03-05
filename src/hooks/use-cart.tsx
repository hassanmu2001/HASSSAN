import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  serviceId: string;
  title: string;
  providerName: string;
  providerId: string;
  priceMin: number | null;
  priceMax: number | null;
  photo: string | null;
  city: string | null;
}

export interface AppliedCoupon {
  id: string;
  code: string;
  discountPercent: number;
  description: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (serviceId: string) => void;
  clearCart: () => void;
  isInCart: (serviceId: string) => boolean;
  totalMin: number;
  totalMax: number;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string) => Promise<string | null>;
  removeCoupon: () => void;
  discountedTotalMin: number;
  discountedTotalMax: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.find((i) => i.serviceId === item.serviceId)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((serviceId: string) => {
    setItems((prev) => prev.filter((i) => i.serviceId !== serviceId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
  }, []);

  const isInCart = useCallback(
    (serviceId: string) => items.some((i) => i.serviceId === serviceId),
    [items]
  );

  const totalMin = items.reduce((sum, i) => sum + (i.priceMin ?? 0), 0);
  const totalMax = items.reduce((sum, i) => sum + (i.priceMax ?? 0), 0);

  const discountPercent = appliedCoupon?.discountPercent ?? 0;
  const discountedTotalMin = totalMin * (1 - discountPercent / 100);
  const discountedTotalMax = totalMax * (1 - discountPercent / 100);

  const applyCoupon = useCallback(async (code: string): Promise<string | null> => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return "أدخل كود الخصم";

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", trimmed)
      .eq("is_active", true)
      .is("provider_id", null)
      .maybeSingle();

    if (error || !data) return "كود الخصم غير صالح";
    if (data.expires_at && new Date(data.expires_at) < new Date()) return "كود الخصم منتهي الصلاحية";
    if (data.max_uses && data.used_count >= data.max_uses) return "تم استنفاد عدد الاستخدامات لهذا الكود";

    setAppliedCoupon({
      id: data.id,
      code: data.code,
      discountPercent: data.discount_percent,
      description: data.description,
    });
    return null;
  }, []);

  const removeCoupon = useCallback(() => setAppliedCoupon(null), []);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, clearCart, isInCart,
      totalMin, totalMax,
      appliedCoupon, applyCoupon, removeCoupon,
      discountedTotalMin, discountedTotalMax,
    }}>
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
