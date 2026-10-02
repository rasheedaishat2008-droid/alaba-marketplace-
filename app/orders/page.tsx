"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { naira } from "@/lib/format";

type Order = {
  id: string;
  total_kobo: number;
  status: string;
  created_at: string;
  order_items: { product_name: string; unit_price_kobo: number; quantity: number }[];
};

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const params = useSearchParams();

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.auth.getSession();
      setSignedIn(!!s.session);
      if (!s.session) {
        setOrders([]);
        return;
      }
      const { data } = await supabase
        .from("orders")
        .select("id,total_kobo,status,created_at,order_items(product_name,unit_price_kobo,quantity)")
        .order("created_at", { ascending: false });
      setOrders((data as Order[]) || []);
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, []);

  if (signedIn === null) return <p className="my-8">Loading...</p>;
  if (!signedIn) return <p className="my-8">Please sign in with Google to see your orders.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold my-4">My Orders</h1>
      {params.get("placed") && (
        <div className="bg-green-100 text-green-800 rounded p-3 mb-4">
          Order placed!{" "}
          {params.get("email") === "1"
            ? "A confirmation email is on its way."
            : "We couldn't send the confirmation email, but your order is saved."}
        </div>
      )}
      {!orders.length && <p>No orders yet.</p>}
      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>#{o.id.slice(0, 8).toUpperCase()}</span>
              <span>{new Date(o.created_at).toLocaleString("en-NG")}</span>
            </div>
            <ul className="my-2 text-sm">
              {o.order_items.map((i, idx) => (
                <li key={idx}>{i.product_name} × {i.quantity} — {naira(i.unit_price_kobo * i.quantity)}</li>
              ))}
            </ul>
            <p className="font-bold">Total: {naira(o.total_kobo)} ({o.status})</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="my-8">Loading...</p>}>
      <Orders />
    </Suspense>
  );
}