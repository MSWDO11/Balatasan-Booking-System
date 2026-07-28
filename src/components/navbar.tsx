"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Waves, ShoppingBag, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { Suspense } from "react";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Cottages", href: "/accommodations" },
  { name: "Island Hopping", href: "/tours?category=island-hopping" },
  { name: "Water Activities", href: "/tours?category=water-activities" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

function NavbarInner() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "user";
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const withPreview = (href: string) => {
    if (!isPreview) return href;
    const sep = href.includes("?") ? "&" : "?";
    return `${href}${sep}preview=user`;
  };

  const handleSignOut = () => signOut(auth);

  return (
    <>
      {/* Admin preview banner — only shows when viewing as user */}
      {isPreview && (
        <div className="bg-primary text-white px-4 py-2 flex items-center justify-between text-sm">
          <span className="font-semibold flex items-center gap-2">
            👁 You are previewing as a regular user
          </span>
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 bg-white text-primary font-bold px-3 py-1 rounded-full text-xs hover:bg-primary/10 transition-colors"
          >
            ← Back to Admin
          </Link>
        </div>
      )}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={withPreview("/")} className="flex items-center gap-2 group">
          <div className="bg-primary/10 p-1.5 rounded-lg transition-colors group-hover:bg-primary/20">
            <Waves className="h-6 w-6 text-primary" />
          </div>
          <span className="font-headline text-xl font-bold tracking-tight text-primary">
            Balatasan <span className="text-accent-foreground">Stay</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex md:items-center md:gap-8">
          <div className="flex items-center gap-6 pr-6 border-r border-slate-100">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={withPreview(link.href)}
                className={cn(
                  "text-sm font-semibold transition-colors hover:text-primary",
                  pathname === link.href.split("?")[0] ? "text-primary" : "text-slate-500"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            {!user && !isUserLoading && (
              <Link href={withPreview("/login")}>
                <Button size="sm" className="px-6 font-bold">Sign In</Button>
              </Link>
            )}
            {user && (
              <div className="flex items-center gap-3">
                <Link href={withPreview("/my-bookings")}>
                  <Button variant="ghost" size="sm" className="gap-2 font-bold text-slate-600 hover:bg-primary/5 hover:text-primary rounded-full px-4">
                    <ShoppingBag className="h-4 w-4" />
                    My Bookings
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out" className="rounded-full h-9 w-9 text-slate-400 hover:text-rose-500 hover:bg-rose-50">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 text-slate-500 hover:text-primary">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t bg-white px-4 py-6 space-y-4 shadow-xl">
          {navLinks.map((link) => (
            <Link key={link.name} href={withPreview(link.href)} className="block text-base font-bold text-slate-600 hover:text-primary transition-colors px-2" onClick={() => setIsOpen(false)}>
              {link.name}
            </Link>
          ))}
          {!user && !isUserLoading && (
            <Link href={withPreview("/login")} onClick={() => setIsOpen(false)} className="block text-base font-bold text-slate-600 px-2">Sign In</Link>
          )}
          {user && (
            <div className="pt-4 border-t border-slate-50 space-y-3">
              <Link href={withPreview("/my-bookings")} onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3 font-bold text-slate-600">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  My Bookings
                </Button>
              </Link>
              <Button variant="ghost" className="w-full justify-start gap-3 font-bold text-rose-500 hover:bg-rose-50 rounded-xl" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarInner />
    </Suspense>
  );
}
