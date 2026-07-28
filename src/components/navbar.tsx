"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Waves, ShoppingBag, LogOut, LayoutDashboard, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useUser, useAuth, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { signOut } from "firebase/auth";

const ADMIN_CACHE_KEY = "bls_is_admin";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Cottages", href: "/accommodations" },
  { name: "Island Hopping", href: "/tours?category=island-hopping" },
  { name: "Water Activities", href: "/tours?category=water-activities" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  // Initialize from cache to avoid flash
  const [cachedAdmin, setCachedAdmin] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ADMIN_CACHE_KEY) === "true";
    }
    return false;
  });

  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();

  const adminDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [user, firestore]);

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminDocRef);

  const isDesignatedAdmin = user?.email?.toLowerCase() === "admin@gmail.com";
  const hasAdminAccess = isDesignatedAdmin || !!adminRole;

  // Cache admin state in localStorage as soon as we know
  useEffect(() => {
    if (!isUserLoading && !isAdminLoading) {
      if (!user) {
        localStorage.removeItem(ADMIN_CACHE_KEY);
        setCachedAdmin(false);
      } else if (hasAdminAccess) {
        localStorage.setItem(ADMIN_CACHE_KEY, "true");
        setCachedAdmin(true);
      } else {
        localStorage.removeItem(ADMIN_CACHE_KEY);
        setCachedAdmin(false);
      }
    }
  }, [hasAdminAccess, isUserLoading, isAdminLoading, user]);

  // Use cached value while loading to prevent flash
  const showAdminNav = cachedAdmin || hasAdminAccess;

  const handleSignOut = () => {
    localStorage.removeItem(ADMIN_CACHE_KEY);
    setCachedAdmin(false);
    signOut(auth);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-1.5 rounded-lg transition-colors group-hover:bg-primary/20">
              <Waves className="h-6 w-6 text-primary" />
            </div>
            <span className="font-headline text-xl font-bold tracking-tight text-primary">
              Balatasan <span className="text-accent-foreground">Stay</span>
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {/* If admin: show Dashboard + Inventory. Regular users: show nav links */}
          {showAdminNav ? (
            <div className="flex items-center gap-2 pr-6 border-r border-slate-100">
              <Link
                href="/admin/dashboard"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors",
                  pathname === "/admin/dashboard"
                    ? "bg-primary text-white shadow-md"
                    : "text-slate-600 hover:bg-primary/10 hover:text-primary"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/admin/inventory"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors",
                  pathname === "/admin/inventory"
                    ? "bg-primary text-white shadow-md"
                    : "text-slate-600 hover:bg-primary/10 hover:text-primary"
                )}
              >
                <Database className="h-4 w-4" />
                Inventory
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-6 pr-6 border-r border-slate-100">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "text-sm font-semibold transition-colors hover:text-primary",
                    pathname === link.href ? "text-primary" : "text-slate-500"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-4">
            {!user && !isUserLoading && (
              <Link href="/login">
                <Button size="sm" className="px-6 font-bold">
                  Sign In
                </Button>
              </Link>
            )}

            {user && (
              <div className="flex items-center gap-3">
                <Link href="/my-bookings">
                  <Button variant="ghost" size="sm" className="gap-2 font-bold text-slate-600 hover:bg-primary/5 hover:text-primary rounded-full px-4">
                    <ShoppingBag className="h-4 w-4" />
                    My Bookings
                  </Button>
                </Link>

                {!showAdminNav && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleSignOut} 
                    title="Sign Out"
                    className="rounded-full h-9 w-9 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
                {showAdminNav && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="gap-2 font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl px-4"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Nav Toggle */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center p-2 text-slate-500 hover:text-primary"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t bg-white px-4 py-6 space-y-4 shadow-xl">
          {showAdminNav ? (
            <>
              <Link href="/admin/dashboard" className="block text-base font-bold text-slate-600 hover:text-primary px-2" onClick={() => setIsOpen(false)}>Dashboard</Link>
              <Link href="/admin/inventory" className="block text-base font-bold text-slate-600 hover:text-primary px-2" onClick={() => setIsOpen(false)}>Inventory</Link>
            </>
          ) : (
            navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="block text-base font-bold text-slate-600 hover:text-primary transition-colors px-2" onClick={() => setIsOpen(false)}>
                {link.name}
              </Link>
            ))
          )}
          {!user && !isUserLoading && (
            <Link 
              href="/login" 
              onClick={() => setIsOpen(false)} 
              className="block text-base font-bold text-slate-600 px-2"
            >
              Sign In
            </Link>
          )}
          {user && (
            <div className="pt-4 border-t border-slate-50 space-y-3">
              <Link href="/my-bookings" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3 font-bold text-slate-600">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  My Bookings
                </Button>
              </Link>
              {showAdminNav && (
                <div className="bg-slate-50 rounded-2xl p-2 space-y-1">
                  <Link href="/admin/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3 font-bold text-slate-600">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                      Admin Dashboard
                    </Button>
                  </Link>
                  <Link href="/admin/inventory" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3 font-bold text-slate-600">
                      <Database className="h-5 w-5 text-primary" />
                      Inventory Management
                    </Button>
                  </Link>
                </div>
              )}
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 font-bold text-rose-500 hover:bg-rose-50 rounded-xl" 
                onClick={handleSignOut}
              >
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
