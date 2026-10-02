import "./globals.css";
import { CartProvider } from "./cart-context";
import Header from "./header";

export const metadata = {
  title: "Alaba Online Marketplace",
  description: "Musical instruments, machines, furniture and home utilities, all in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <CartProvider>
          <Header />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">{children}</main>
          <footer className="border-t bg-white text-center text-sm text-slate-500 py-6">
            © {new Date().getFullYear()} Alaba Online Marketplace · Lagos, Nigeria
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}