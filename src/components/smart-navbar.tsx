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
