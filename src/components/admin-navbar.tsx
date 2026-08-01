"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Waves, LayoutDashboard, Database, LogOut, Eye, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useFirestoreNullable, useCollection, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { collectionGroup, query, where } from "firebase/firestore";
import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";

export function AdminNavbar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestoreNullable();
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("admin_seen_notifs") ?? "[]")); } catch { return new Set(); }
  });
  const panelRef = useRef<HTMLDivElement>(null);

  // Watch for Payment Uploaded bookings — only attempt if firestore is ready
  // Wrapped in a try via null guard so a permission error doesn't crash the app
  const uploadedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    try {
      return query(collectionGroup(firestore, "bookings"), where("status", "==", "Payment Uploaded"));
    } catch {
      return null;
    }
  }, [firestore]);
  const { data: uploadedBookings } = useCollection(uploadedQuery);

  const unread = uploadedBookings?.filter((b: any) => !seenIds.has(b.id)).length ?? 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(prev => !prev);
    if (!open && uploadedBookings) {
      const newSeen = new Set([...seenIds, ...uploadedBookings.map((b: any) => b.id)]);
      setSeenIds(newSeen);
      localStorage.setItem("admin_seen_notifs", JSON.stringify([...newSeen]));
    }
  };

  const handleSignOut = () => {
    signOut(auth).then(() => { router.push("/"); router.refresh(); });
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

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/admin/dashboard" className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors",
            pathname === "/admin/dashboard" ? "bg-primary text-white shadow-md" : "text-slate-600 hover:bg-primary/10 hover:text-primary"
          )}>
            <LayoutDashboard className="h-4 w-4" />Dashboard
          </Link>
          <Link href="/admin/inventory" className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors",
            pathname === "/admin/inventory" ? "bg-primary text-white shadow-md" : "text-slate-600 hover:bg-primary/10 hover:text-primary"
          )}>
            <Database className="h-4 w-4" />Inventory
          </Link>
          <Link href="/?preview=user" target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-teal-600 border border-teal-200 bg-teal-50 hover:bg-teal-100 transition-colors ml-2">
            <Eye className="h-4 w-4" />View as User
          </Link>
        </div>

        {/* Right side: Bell + Sign Out */}
        <div className="flex items-center gap-1">
          {/* Admin Notification Bell */}
          <div className="relative" ref={panelRef}>
            <button
              onClick={handleOpen}
              className="relative flex items-center justify-center h-9 w-9 rounded-full text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors"
              aria-label="Admin Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                  <p className="text-sm font-bold text-slate-800">Payment Receipts</p>
                  <span className="text-[10px] text-slate-400">{uploadedBookings?.length ?? 0} uploaded</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {!uploadedBookings || uploadedBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                      <Bell className="h-7 w-7 opacity-30" />
                      <p className="text-xs font-medium">No payment receipts yet</p>
                    </div>
                  ) : (
                    uploadedBookings.map((b: any) => (
                      <div
                        key={b.id}
                        className={cn("flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors", !seenIds.has(b.id) && "bg-primary/5")}
                        onClick={() => { router.push("/admin/dashboard"); setOpen(false); }}
                      >
                        <div className="h-2 w-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{b.itemName}</p>
                          <p className="text-xs text-amber-700 font-semibold">Receipt uploaded — awaiting review</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Guest: {b.guestName} · ₱{b.totalPrice?.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {b.createdAt ? formatDistanceToNow(new Date(b.createdAt), { addSuffix: true }) : ""}
                          </p>
                        </div>
                        {!seenIds.has(b.id) && <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 border-t bg-slate-50/50">
                  <button
                    className="text-xs text-primary font-semibold hover:underline w-full text-center"
                    onClick={() => { router.push("/admin/dashboard"); setOpen(false); }}
                  >
                    View all in Dashboard →
                  </button>
                </div>
              </div>
            )}
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
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden flex border-t bg-white">
        <Link href="/admin/dashboard" className={cn(
          "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold transition-colors",
          pathname === "/admin/dashboard" ? "text-primary border-t-2 border-primary" : "text-slate-400"
        )}>
          <LayoutDashboard className="h-5 w-5" />Dashboard
        </Link>
        <Link href="/admin/inventory" className={cn(
          "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold transition-colors",
          pathname === "/admin/inventory" ? "text-primary border-t-2 border-primary" : "text-slate-400"
        )}>
          <Database className="h-5 w-5" />Inventory
        </Link>
        <Link href="/?preview=user" target="_blank"
          className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold text-teal-500">
          <Eye className="h-5 w-5" />View Site
        </Link>
        <button
          onClick={handleSignOut}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold text-rose-400"
        >
          <LogOut className="h-5 w-5" />Sign Out
        </button>
      </div>
    </nav>
  );
}
