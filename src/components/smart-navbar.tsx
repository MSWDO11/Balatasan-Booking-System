"use client";

import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { AdminNavbar } from "@/components/admin-navbar";
import { Navbar } from "@/components/navbar";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SmartNavbarInner() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "user";

  const adminDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, "roles_admin", user.uid);
  }, [user, firestore]);

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminDocRef);

  const isDesignatedAdmin = user?.email?.toLowerCase() === "admin@gmail.com";
  const isAdmin = isDesignatedAdmin || !!adminRole;

  // If ?preview=user is in URL, always show regular navbar
  if (isPreview) return <Navbar />;

  // While loading auth, show nothing to avoid flash
  if (isUserLoading) return null;

  // If logged in and confirmed admin — show admin navbar
  if (user && isAdmin) return <AdminNavbar />;

  // If logged in but admin role still loading — wait
  if (user && isAdminLoading) return null;

  // Regular user or not logged in
  return <Navbar />;
}

export function SmartNavbar() {
  return (
    <Suspense fallback={null}>
      <SmartNavbarInner />
    </Suspense>
  );
}
