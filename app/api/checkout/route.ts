import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { naira } from "@/lib/format";

export async function POST(req: Request) {
  // 1. Verify who is checking out
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const { data: u, error: uErr } = await admin.auth.getUser(token);
  if (uErr || !u.user) return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
  const user = u.user;

  // 2. Re-price the cart from the database (never trust prices from the browser)
  const body = await req.json();
  const cart: { id: string; quantity: number }[] = body.items ?? [];
  if (!cart.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

  const { data: products } = await admin
    .from("products")
    .select("id,name,price_kobo")
    .in("id", cart.map((c) => c.id))
    .eq("in_stock", true);

  const lines = cart.flatMap((c) => {
    const p = products?.find((x) => x.id === c.id);
    const qty = Math.min(99, Math.max(1, Math.floor(Number(c.quantity) || 1)));
    return p ? [{ name: p.name, price: p.price_kobo, qty }] : [];
  });
  if (!lines.length) return NextResponse.json({ error: "Items unavailable. Clear your cart and add items again." }, { status: 400 });
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  // 3. Save the order
  const { data: order, error: oErr } = await admin
    .from("orders")
    .insert({ user_id: user.id, total_kobo: total })
    .select()
    .single();
  if (oErr || !order) return NextResponse.json({ error: oErr?.message ?? "Could not save order" }, { status: 500 });

  const { error: iErr } = await admin.from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id,
      product_name: l.name,
      unit_price_kobo: l.price,
      quantity: l.qty,
    }))
  );
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  // 4. Send the confirmation email (a failure here must not undo the order)
  const orderRef = order.id.slice(0, 8).toUpperCase();
  const name = (user.user_metadata?.full_name as string) || "there";
  const rows = lines
    .map(
      (l) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee">${l.name} × ${l.qty}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right">${naira(l.price * l.qty)}</td>
      </tr>`
    )
    .join("");

  const html = `
  <div style="background:#f3f4f6;padding:24px;font-family:Arial,sans-serif">
    <div style="max-width:520px;margin:auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#4f46e5;color:#fff;padding:20px 24px">
        <h1 style="margin:0;font-size:20px">Alaba Online Marketplace</h1>
      </div>
      <div style="padding:24px">
        <h2 style="margin-top:0">Thanks for your order, ${name}!</h2>
        <p style="color:#555">Order reference: <b>#${orderRef}</b></p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
          <tr>
            <td style="padding:14px 0;font-weight:bold">Total</td>
            <td style="padding:14px 0;font-weight:bold;text-align:right">${naira(total)}</td>
          </tr>
        </table>
        <p style="color:#555;font-size:14px">We're preparing your items now. You can view all your orders any time on the website.</p>
      </div>
    </div>
  </div>`;

  let emailSent = false;
  try {
    const form = new URLSearchParams({
      from: `Alaba Online Marketplace <postmaster@${process.env.MAILGUN_DOMAIN}>`,
      to: user.email!,
      subject: `Order confirmed #${orderRef}`,
      html,
      text: `Thanks for your order #${orderRef}. Total: ${naira(total)}.`,
    });
    const res = await fetch(`${process.env.MAILGUN_BASE_URL}/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from("api:" + process.env.MAILGUN_API_KEY).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    emailSent = res.ok;
    if (!res.ok) console.error("Mailgun error:", res.status, await res.text());
  } catch (e) {
    console.error("Mailgun failed:", e);
  }

  return NextResponse.json({ orderId: order.id, emailSent });
}