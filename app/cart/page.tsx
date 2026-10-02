"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { naira } from "@/lib/format";
import { useCart } from "../cart-context";

export default function CartPage() {
  const { items, remove, clear, total } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const checkout = async () => {
    setError("");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/cart" },
      });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ items: items.map((i) => ({ id: i.id, quantity: i.quantity })) }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Checkout failed");
      clear();
      router.push(`/orders?placed=1&email=${result.emailSent ? 1 : 0}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setBusy(false);
    }
  };

  if (!items.length) return <p className="my-8">Your cart is empty.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold my-4">Checkout</h1>
      <div className="bg-white border rounded-lg divide-y">
        {items.map((i) => (
          <div key={i.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{i.name}</p>
              <p className="text-sm text-gray-500">{naira(i.price_kobo)} × {i.quantity}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold">{naira(i.price_kobo * i.quantity)}</span>
              <button onClick={() => remove(i.id)} className="text-red-600 text-sm">Remove</button>
            </div>
          </div>
        ))}
        <div className="p-4 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{naira(total)}</span>
        </div>
      </div>
      {error && <p className="text-red-600 mt-3">{error}</p>}
      <button
        onClick={checkout}
        disabled={busy}
        className="mt-4 w-full bg-green-700 text-white rounded py-3 disabled:opacity-50"
      >
        {busy ? "Placing order..." : "Place order"}
      </button>
    </div>
  );
}