"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { naira } from "@/lib/format";
import { useCart } from "./cart-context";

type Product = {
  id: string; name: string; description: string | null;
  price_kobo: number; category: string | null; emoji: string | null;
};

const CATS = ["All", "Musical Instruments", "Home & Utensils", "Machines", "Furniture"];
const TILE: Record<string, string> = {
  "Musical Instruments": "from-purple-100 to-purple-200",
  "Home & Utensils": "from-amber-100 to-amber-200",
  "Machines": "from-sky-100 to-sky-200",
  "Furniture": "from-emerald-100 to-emerald-200",
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("featured");
  const [added, setAdded] = useState<string | null>(null);
  const { add } = useCart();

  useEffect(() => {
    supabase.from("products").select("*").eq("in_stock", true).then(({ data, error }) => {
      if (error) setError(error.message);
      else setProducts(data || []);
      setLoading(false);
    });
  }, []);

  const shown = useMemo(() => {
    let list = products.filter(
      (p) =>
        (cat === "All" || p.category === cat) &&
        (p.name + " " + (p.description ?? "")).toLowerCase().includes(query.toLowerCase())
    );
    if (sort === "low") list = [...list].sort((a, b) => a.price_kobo - b.price_kobo);
    if (sort === "high") list = [...list].sort((a, b) => b.price_kobo - a.price_kobo);
    return list;
  }, [products, cat, query, sort]);

  const handleAdd = (p: Product) => {
    add({ id: p.id, name: p.name, price_kobo: p.price_kobo });
    setAdded(p.id);
    setTimeout(() => setAdded(null), 1200);
  };

  return (
    <div>
      <section className="rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-600 text-white p-6 sm:p-10 mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold">Alaba Online Marketplace</h1>
        <p className="mt-2 text-indigo-100 max-w-xl">
          Musical instruments, machines, furniture and home essentials from trusted Alaba traders.
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search guitars, generators, sofas..."
          className="mt-5 w-full max-w-lg rounded-lg px-4 py-3 text-slate-900 bg-white outline-none"
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-1.5 rounded-full text-sm border ${
                cat === c ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-slate-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-white">
          <option value="featured">Featured</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-slate-500">Loading products...</p>}
      {!loading && !shown.length && <p className="text-slate-500">No products match your search.</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {shown.map((p) => (
          <div key={p.id} className="bg-white border rounded-xl overflow-hidden flex flex-col hover:shadow-lg transition">
            <div className={`h-32 sm:h-40 grid place-items-center text-6xl bg-gradient-to-br ${TILE[p.category ?? ""] ?? "from-slate-100 to-slate-200"}`}>
              {p.emoji}
            </div>
            <div className="p-4 flex flex-col flex-1">
              <span className="text-xs text-indigo-600 font-medium">{p.category}</span>
              <h2 className="font-semibold text-slate-900">{p.name}</h2>
              <p className="text-sm text-slate-500 flex-1 mt-1">{p.description}</p>
              <p className="font-bold text-lg my-3">{naira(p.price_kobo)}</p>
              <button
                onClick={() => handleAdd(p)}
                className={`rounded-lg py-2 text-white text-sm font-medium ${
                  added === p.id ? "bg-green-600" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {added === p.id ? "Added ✓" : "Add to cart"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}