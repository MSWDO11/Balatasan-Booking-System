"use client";

import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { AdminNavbar } from "@/components/admin-navbar";
import { Navbar } from "@/components/navbar";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SmartNavbarInner() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const previewParam = searchParams.get("preview");

  // Use sessionStorage - it IS per-tab in browsers
  const [isPreview, setIsPreview] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("bls_preview") === "1";
    }
    return false;
  });

  useEffect(() => {
    if (previewParam === "user") {
      sessionStorage.setItem("bls_preview", "1");
      setIsPreview(true);
    }
  }, [previewParam]);

  const adminDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [user, firestore]);

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminDocRef);

  const isDesignatedAdmin = user?.email?.toLowerCase() === "admin@gmail.com";
  const isAdmin = isDesignatedAdmin || !!adminRole;

  // Preview mode — show regular user navbar
  if (isPreview) return <Navbar />;

  if (isUserLoading) return null;
  if (user && isAdmin) return <AdminNavbar />;
  if (user && isAdminLoading) return null;
  return <Navbar />;
}

export function SmartNavbar() {
  return (
    <Suspense fallback={null}>
      <SmartNavbarInner />
    </Suspense>
  );
}
