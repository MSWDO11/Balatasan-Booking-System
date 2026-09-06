"use client";

import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { AdminNavbar } from "@/components/admin-navbar";
import { Navbar } from "@/components/navbar";
import { useSearchParams, usePathname } from "next/navigation";
import { Suspense } from "react";

/** Skeleton navbar shown while auth state resolves — prevents black-screen flash */
function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo placeholder */}
        <div className="h-6 w-32 rounded-md bg-primary/10 animate-pulse" />
        {/* Nav links placeholder */}
        <div className="hidden md:flex items-center gap-6">
          {[80, 72, 64, 88].map((w) => (
            <div key={w} className="h-4 rounded-md bg-primary/10 animate-pulse" style={{ width: w }} />
          ))}
        </div>
        {/* CTA placeholder */}
        <div className="h-8 w-24 rounded-full bg-primary/10 animate-pulse" />
      </div>
    </header>
  );
}

function SmartNavbarInner() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Check ?preview=user in URL - this is synchronous so no flash
  const isPreview = searchParams.get("preview") === "user";

  const adminDocRef = useMemoFirebase(() => {
    if (!user || !firestore || isPreview) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [user, firestore, isPreview]);

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminDocRef);

  const isDesignatedAdmin = user?.email?.toLowerCase() === "admin@gmail.com";
  const isAdmin = isDesignatedAdmin || !!adminRole;

  // Preview mode — always show regular user navbar regardless of admin status
  if (isPreview) return <Navbar />;

  // On admin pages the sidebar handles all navigation — hide the top navbar
  if (pathname.startsWith("/admin")) return null;

  // On login page, never show admin navbar
  if (pathname.startsWith("/login")) return <Navbar />;

  // Show skeleton while auth resolves instead of null (prevents black-screen)
  if (isUserLoading) return <NavbarSkeleton />;
  if (user && isAdmin) return <AdminNavbar />;
  if (user && isAdminLoading) return <NavbarSkeleton />;
  return <Navbar />;
}

export function SmartNavbar() {
  return (
    <Suspense fallback={<NavbarSkeleton />}>
      <SmartNavbarInner />
    </Suspense>
  );
}
