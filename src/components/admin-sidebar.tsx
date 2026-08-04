"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Waves, LayoutDashboard, Database, LogOut, Eye, Bell, Menu, X, ShoppingBag, Star, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useFirestoreNullable, useCollection, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { collectionGroup, query, where } from "firebase/firestore";
import { useState, useEffect, useRef, Suspense } from "react";
import { formatDistanceToNow } from "date-fns";

const mainNav = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/inventory", icon: Database, label: "Inventory" },
];

const dashboardTabs = [
  { tab: "bookings",  icon: ShoppingBag,     label: "Reservations" },
  { tab: "reviews",   icon: Star,             label: "Reviews" },
  { tab: "users",     icon: Users,            label: "Users" },
  { tab: "settings",  icon: Settings,         label: "Settings" },
];

function AdminSidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "home";
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestoreNullable();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("admin_seen_notifs") ?? "[]")); } catch { return new Set(); }
  });
  const bellRef = useRef<HTMLDivElement>(null);

  const uploadedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    try { return query(collectionGroup(firestore, "bookings"), where("status", "==", "Payment Uploaded")); }
    catch { return null; }
  }, [firestore]);
  const { data: uploadedBookings } = useCollection(uploadedQuery);
  const unread = uploadedBookings?.filter((b: any) => !seenIds.has(b.id)).length ?? 0;

  useEffect(() => {
    const stored = localStorage.getItem("admin_review_count");
    if (stored) setReviewCount(Number(stored));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBellOpen = () => {
    setBellOpen(prev => !prev);
    if (!bellOpen && uploadedBookings) {
      const newSeen = new Set([...seenIds, ...uploadedBookings.map((b: any) => b.id)]);
      setSeenIds(newSeen);
      localStorage.setItem("admin_seen_notifs", JSON.stringify([...newSeen]));
    }
  };

  const handleSignOut = () => {
    signOut(auth).then(() => { router.push("/"); router.refresh(); });
  };

  const isDashboard = pathname === "/admin/dashboard";

  const [lastActiveTab, setLastActiveTab] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_active_tab") ?? null;
  });

  // Sync lastActiveTab from URL when on dashboard
  useEffect(() => {
    if (isDashboard && activeTab) {
      setLastActiveTab(activeTab);
      localStorage.setItem("admin_active_tab", activeTab);
    }
  }, [isDashboard, activeTab]);

  const SidebarContent = ({ onNav }: { onNav: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 border-b border-slate-100">
        <button onClick={() => { onNav(); setTimeout(() => router.push("/admin/dashboard?tab=home"), 150); }}
          className="flex items-center gap-2.5 group text-left">
          <div className="bg-primary/10 p-2 rounded-xl transition-colors group-hover:bg-primary/20">
            <Waves className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-headline text-base font-bold text-primary leading-tight">Balatasan</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-tight">Admin Panel</p>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Pages</p>
        {mainNav.map(({ href, icon: Icon, label }) => (
          <button key={href}
            onClick={() => {
              if (href === "/admin/dashboard") {
                setLastActiveTab("home");
                localStorage.setItem("admin_active_tab", "home");
                onNav();
                setTimeout(() => router.push("/admin/dashboard?tab=home"), 150);
              } else {
                onNav();
                setTimeout(() => router.push(href), 150);
              }
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left",
              (pathname === href && (href !== "/admin/dashboard" || activeTab === "home"))
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />{label}
          </button>
        ))}

        {/* Dashboard sub-sections — show on all admin pages */}
        <div className="pt-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Sections</p>
          {dashboardTabs.map(({ tab, icon: Icon, label }) => (
            <button key={tab}
              onClick={() => { 
                setLastActiveTab(tab);
                localStorage.setItem("admin_active_tab", tab);
                onNav(); 
                setTimeout(() => router.push(`/admin/dashboard?tab=${tab}`), 150); 
              }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left",
                  isDashboard && activeTab === tab
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {tab === "reviews" && reviewCount > 0 && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{reviewCount}</span>
              )}
              {tab === "bookings" && unread > 0 && (
                <span className="bg-rose-100 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </button>
          ))}
        </div>

        <div className="pt-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Quick Actions</p>
          <Link href="/?preview=user" target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-teal-600 hover:bg-teal-50 transition-colors">
            <Eye className="h-4 w-4 shrink-0" />View as User
          </Link>
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-slate-100 space-y-1">
        <div className="relative" ref={bellRef}>
          <button onClick={handleBellOpen}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
            <div className="relative">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
            <span>Notifications</span>
            {unread > 0 && <span className="ml-auto bg-rose-100 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>}
          </button>

          {bellOpen && (
            <div className="absolute bottom-full left-0 mb-2 z-50 w-72 rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                <p className="text-sm font-bold text-slate-800">Payment Receipts</p>
                <span className="text-[10px] text-slate-400">{uploadedBookings?.length ?? 0} uploaded</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                {!uploadedBookings || uploadedBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
                    <Bell className="h-6 w-6 opacity-30" />
                    <p className="text-xs">No receipts yet</p>
                  </div>
                ) : uploadedBookings.map((b: any) => (
                  <div key={b.id}
                    className={cn("flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors", !seenIds.has(b.id) && "bg-primary/5")}
                    onClick={() => { router.push("/admin/dashboard?tab=bookings"); setBellOpen(false); setMobileOpen(false); }}>
                    <div className="h-2 w-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{b.itemName}</p>
                      <p className="text-xs text-amber-700 font-semibold">Receipt uploaded</p>
                      <p className="text-[10px] text-slate-400">{b.createdAt ? formatDistanceToNow(new Date(b.createdAt), { addSuffix: true }) : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t bg-slate-50/50">
                <button className="text-xs text-primary font-semibold hover:underline w-full text-center"
                  onClick={() => { router.push("/admin/dashboard?tab=bookings"); setBellOpen(false); }}>
                  View all in Dashboard →
                </button>
              </div>
            </div>
          )}
        </div>

        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-colors">
          <LogOut className="h-4 w-4 shrink-0" />Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-slate-100 min-h-screen sticky top-0 h-screen shadow-sm z-40">
        <SidebarContent onNav={() => {}} />
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 h-14 bg-white border-b border-slate-100 shadow-sm">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-lg"><Waves className="h-5 w-5 text-primary" /></div>
          <span className="font-headline text-base font-bold text-primary">
            Balatasan <span className="text-slate-400 text-xs font-medium">Admin</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {/* Bell on mobile top bar */}
          <div className="relative" ref={bellRef}>
            <button onClick={handleBellOpen} className="relative flex items-center justify-center h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                  <p className="text-sm font-bold text-slate-800">Payment Receipts</p>
                  <span className="text-[10px] text-slate-400">{uploadedBookings?.length ?? 0} uploaded</span>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                  {!uploadedBookings || uploadedBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
                      <Bell className="h-6 w-6 opacity-30" /><p className="text-xs">No receipts yet</p>
                    </div>
                  ) : uploadedBookings.map((b: any) => (
                    <div key={b.id}
                      className={cn("flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50", !seenIds.has(b.id) && "bg-primary/5")}
                      onClick={() => { router.push("/admin/dashboard?tab=bookings"); setBellOpen(false); }}>
                      <div className="h-2 w-2 rounded-full bg-amber-400 mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{b.itemName}</p>
                        <p className="text-xs text-amber-700 font-semibold">Receipt uploaded</p>
                        <p className="text-[10px] text-slate-400">{b.createdAt ? formatDistanceToNow(new Date(b.createdAt), { addSuffix: true }) : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-72 bg-white h-full shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
              <Link href="/admin/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <div className="bg-primary/10 p-1.5 rounded-lg"><Waves className="h-5 w-5 text-primary" /></div>
                <span className="font-headline text-base font-bold text-primary">Balatasan <span className="text-slate-400 text-xs font-medium">Admin</span></span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Mobile bottom tab bar (all admin pages) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex">
          {dashboardTabs.map(({ tab, icon: Icon, label }) => (
            <Link
              key={tab}
              href={`/admin/dashboard?tab=${tab}`}
              onClick={() => { 
                setLastActiveTab(tab);
                localStorage.setItem("admin_active_tab", tab);
                setMobileOpen(false); 
              }}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors relative",
                activeTab === tab ? "text-primary" : "text-slate-400"
              )}
            >
              {activeTab === tab && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-full" />
              )}
              <div className="relative">
                <Icon className="h-5 w-5" />
                {tab === "reviews" && reviewCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-amber-400 text-white text-[8px] font-bold">{reviewCount}</span>
                )}
                {tab === "bookings" && unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[8px] font-bold">{unread}</span>
                )}
              </div>
              <span className="leading-tight">{label}</span>
            </Link>
          ))}
        </div>
    </>
  );
}

export function AdminSidebar() {
  return (
    <Suspense fallback={
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-slate-100 min-h-screen sticky top-0 h-screen shadow-sm z-40">
        <div className="px-6 py-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-2 rounded-xl"><Waves className="h-5 w-5 text-primary" /></div>
            <div>
              <div className="h-4 w-20 bg-primary/10 rounded animate-pulse" />
              <div className="h-2.5 w-16 bg-slate-100 rounded animate-pulse mt-1" />
            </div>
          </div>
        </div>
      </aside>
    }>
      <AdminSidebarInner />
    </Suspense>
  );
}
