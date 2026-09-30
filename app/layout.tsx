import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/store-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { Toaster } from "@/components/toaster";

export const metadata: Metadata = {
  title: {
    default: "Maison & Market — Modern Commerce",
    template: "%s — Maison & Market",
  },
  description:
    "A refined commerce experience for considered essentials, modern living and everyday upgrades.",
  openGraph: {
    title: "Maison & Market",
    description: "Considered essentials for modern living.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <Header />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
          <CartDrawer />
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}