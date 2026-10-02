"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCart } from "./cart-context";

export default function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const { count } = useCart();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = () =>
    supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });

  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold grid place-items-center">A</span>
          <span className="font-bold text-slate-900 leading-tight">
            Alaba <span className="text-indigo-600">Online Marketplace</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          {email && <Link href="/orders" className="hover:text-indigo-600">My Orders</Link>}
          <Link href="/cart" className="relative border rounded-lg px-3 py-1.5 hover:bg-slate-50">
            🛒 Cart
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full min-w-5 h-5 px-1 grid place-items-center">
                {count}
              </span>
            )}
          </Link>
          {email ? (
            <button onClick={() => supabase.auth.signOut()} className="border rounded-lg px-3 py-1.5 hover:bg-slate-50">
              Log out
            </button>
          ) : (
            <button onClick={signIn} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5">
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}