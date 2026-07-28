"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Waves, LayoutDashboard, Database, LogOut, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";

export function AdminNavbar() {
  const pathname = usePathname();
  const auth = useAuth();

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/admin/dashboard" className="flex items-center gap-2 group">
          <div className="bg-primary/10 p-1.5 rounded-lg transition-colors group-hover:bg-primary/20">
            <Waves className="h-6 w-6 text-primary" />
          </div>
          <span className="font-headline text-xl font-bold tracking-tight text-primary">
            Balatasan <span className="text-slate-500 text-sm font-medium">Admin</span>
          </span>
        </Link>

        {/* Admin Nav Links */}
        <div className="hidden md:flex items-center gap-2">
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
          {/* View as User button */}
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-teal-600 border border-teal-200 bg-teal-50 hover:bg-teal-100 transition-colors ml-2"
          >
            <Eye className="h-4 w-4" />
            View as User
          </Link>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {/* Mobile bottom nav for admin */}
      <div className="md:hidden flex border-t bg-white">
        <Link
          href="/admin/dashboard"
          className={cn(
            "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold transition-colors",
            pathname === "/admin/dashboard" ? "text-primary border-t-2 border-primary" : "text-slate-400"
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </Link>
        <Link
          href="/admin/inventory"
          className={cn(
            "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold transition-colors",
            pathname === "/admin/inventory" ? "text-primary border-t-2 border-primary" : "text-slate-400"
          )}
        >
          <Database className="h-5 w-5" />
          Inventory
        </Link>
        <Link
          href="/"
          target="_blank"
          className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold text-teal-500"
        >
          <Eye className="h-5 w-5" />
          View Site
        </Link>
        <button
          onClick={handleSignOut}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold text-rose-400"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
