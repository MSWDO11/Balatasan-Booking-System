"use client";

import { AdminSidebar } from "@/components/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Clock, TrendingUp, MoreVertical, Check, X, Loader2, ShieldAlert,
  MapPin, Wallet, Users as UsersIcon, ShoppingBag, Download,
  Search, Eye, UserPlus, Image as ImageIcon, Settings, Star, MessageSquare, Bell,
  Trash2, EyeOff, Reply, Calendar, Sun
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useUser, setDocumentNonBlocking, useDoc, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collectionGroup, query, doc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Spinner } from "@/components/spinner";

export default function AdminDashboard() {
  return (
    <Suspense fallback={null}>
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminDashboardContent() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingNote, setBookingNote] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [gcashNumber, setGcashNumber] = useState("");
  const [gcashName, setGcashName] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [cancellationHours, setCancellationHours] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [resortAddress, setResortAddress] = useState("");
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [chartRange, setChartRange] = useState<"month" | "3months" | "all">("all");
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "bookings";

  const adminDocRef = useMemoFirebase(() =>
    (firestore && user) ? doc(firestore, "roles_admin", user.uid) : null,
    [firestore, user]
  );
  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminDocRef);
  const isMasterAdminEmail = user?.email?.toLowerCase() === "admin@gmail.com";
  const hasAdminRecord = !!adminRole;
  const canLoadData = !isUserLoading && !isAdminRoleLoading && hasAdminRecord;

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !canLoadData) return null;
    return query(collectionGroup(firestore, "bookings"));
  }, [firestore, user, canLoadData]);

  const adminsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !canLoadData) return null;
    return collection(firestore, "roles_admin");
  }, [firestore, user, canLoadData]);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, "settings", "payment") : null, [firestore]);
  const { data: paymentSettings } = useDoc(settingsRef);

  const policyRef = useMemoFirebase(() => firestore ? doc(firestore, "settings", "policy") : null, [firestore]);
  const { data: policySettings } = useDoc(policyRef);

  const { data: rawBookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);
  const { data: adminsList, isLoading: isAdminsLoading } = useCollection(adminsQuery);

  // All reviews — no orderBy to avoid needing a Firestore index (sorted client-side)
  const allReviewsQuery = useMemoFirebase(() => {
    if (!firestore || !canLoadData) return null;
    return collection(firestore, "allReviews");
  }, [firestore, canLoadData]);
  const { data: rawAllReviews, isLoading: isReviewsLoading } = useCollection(allReviewsQuery);
  // Sort client-side — newest first
  const allReviews = rawAllReviews
    ? [...rawAllReviews].sort((a: any, b: any) =>
        (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
      )
    : null;

  // Sync review count to localStorage so sidebar badge stays updated
  useEffect(() => {
    if (allReviews !== null) {
      localStorage.setItem("admin_review_count", String(allReviews.length));
    }
  }, [allReviews]);

  // Rooms + tours for item name lookup in reviews tab
  const roomsListQuery = useMemoFirebase(() => firestore ? collection(firestore, "rooms") : null, [firestore]);
  const toursListQuery = useMemoFirebase(() => firestore ? collection(firestore, "tours") : null, [firestore]);
  const { data: roomsList } = useCollection(roomsListQuery);
  const { data: toursList } = useCollection(toursListQuery);
  const itemNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    roomsList?.forEach((r: any) => { map[r.id] = r.name || r.title || r.id; });
    toursList?.forEach((t: any) => { map[t.id] = t.name || t.title || t.id; });
    return map;
  }, [roomsList, toursList]);

  // Review management state
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Sync payment settings into local state for editing
  useEffect(() => {
    if (paymentSettings) {
      setGcashNumber(paymentSettings.gcashNumber || "");
      setGcashName(paymentSettings.gcashName || "");
    }
  }, [paymentSettings]);

  // Sync policy settings into local state for editing
  useEffect(() => {
    if (policySettings) {
      setCancellationHours(policySettings.cancellationHours ?? "");
      setContactNumber(policySettings.contactNumber || "");
      setResortAddress(policySettings.address || "");
    }
  }, [policySettings]);

  const handleSaveSettings = () => {
    if (!firestore) return;
    setIsSavingSettings(true);
    setDocumentNonBlocking(doc(firestore, "settings", "payment"), { gcashNumber, gcashName }, { merge: true });
    toast({ title: "Settings saved", description: "GCash details updated." });
    setIsSavingSettings(false);
  };

  const handleSavePolicy = () => {
    if (!firestore) return;
    setIsSavingPolicy(true);
    setDocumentNonBlocking(doc(firestore, "settings", "policy"), {
      cancellationHours: cancellationHours === "" ? "" : Number(cancellationHours),
      contactNumber,
      address: resortAddress,
    }, { merge: true });
    toast({ title: "Policy saved", description: "Resort policy updated." });
    setIsSavingPolicy(false);
  };

  const bookings = useMemo(() => {
    if (!rawBookings) return [];
    return [...rawBookings].sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
  }, [rawBookings]);

  // Derive selectedBooking from live bookings data for realtime updates
  const selectedBooking = selectedBookingId ? bookings.find(b => b.id === selectedBookingId) ?? null : null;

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = !searchQuery ||
        (b.guestName ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.itemName ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      let matchesStatus = true;
      if (statusFilter === "All") matchesStatus = true;
      else if (statusFilter === "Payment Uploaded") matchesStatus = !!b.paymentImageUrl;
      else matchesStatus = b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  // Monthly revenue chart data
  const revenueChartData = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now = new Date();
    const data = months.map((month, idx) => ({ month, revenue: 0, monthIdx: idx }));
    bookings.filter(b => b.status === "Confirmed").forEach(b => {
      if (b.startDate) {
        const d = new Date(b.startDate);
        const month = d.getMonth();
        const year = d.getFullYear();
        // Filter by chart range
        if (chartRange === "month") {
          if (year !== now.getFullYear() || month !== now.getMonth()) return;
        } else if (chartRange === "3months") {
          const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          if (d < cutoff) return;
        }
        data[month].revenue += b.totalPrice || 0;
      }
    });
    return data.filter(d => d.revenue > 0);
  }, [bookings, chartRange]);

  const updateStatus = (userId: string, bookingId: string, status: string, itemName?: string) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, "users", userId, "bookings", bookingId), { status });

    // Write a notification to the user's notifications subcollection
    const messageMap: Record<string, string> = {
      "Confirmed":  "Your booking has been confirmed! Please proceed to the resort on your scheduled date.",
      "Cancelled":  "Your booking has been cancelled. Please contact us if you have questions.",
      "Payment Uploaded": "Your payment receipt has been received and is under review.",
    };
    addDocumentNonBlocking(collection(firestore, "users", userId, "notifications"), {
      itemName: itemName || "Booking",
      status,
      message: messageMap[status] ?? `Your booking status was updated to: ${status}.`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    toast({ title: `Booking ${status}`, description: `Status updated to ${status}.` });
    if (selectedBooking?.id === bookingId) setSelectedBookingId((prev) => prev);
  };

  const handleSaveNote = () => {
    if (!firestore || !selectedBooking) return;
    updateDocumentNonBlocking(doc(firestore, "users", selectedBooking.userId, "bookings", selectedBooking.id), { adminNote: bookingNote });
    toast({ title: "Note saved" });
  };

  const handleExportCSV = () => {
    const exportData = filteredBookings.length ? filteredBookings : (rawBookings ?? []);
    if (!exportData.length) { toast({ title: "No bookings" }); return; }
    const headers = ["Ref ID","Guest Name","Contact","Item","Start Date","End Date","Guests","Status","Total Price","Created At"];
    const rows = (exportData as any[]).map(b => [
      String(b.id ?? "").slice(0,8).toUpperCase(),
      String(b.guestName ?? ""), String(b.contactNumber ?? ""), String(b.itemName ?? ""),
      String(b.startDate ?? ""), String(b.endDate ?? ""), String(b.guestCount ?? ""),
      String(b.status ?? ""), String(b.totalPrice ?? 0),
      b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "",
    ]);
    setCsvText([headers,...rows].map(r => r.map((v:any) => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n"));
    setShowExport(true);
  };

  const handleAddAdmin = () => {
    if (!firestore || !newAdminEmail.trim()) return;
    setIsAddingAdmin(true);
    addDocumentNonBlocking(collection(firestore, "pending_admins"), {
      email: newAdminEmail.trim().toLowerCase(),
      addedBy: user?.email,
      addedAt: new Date().toISOString(),
    });
    toast({ title: "Admin Invited", description: `${newAdminEmail} must sign up and you must initialize their admin record manually.` });
    setNewAdminEmail("");
    setIsAddingAdmin(false);
  };

  const handleInitializeAdmin = () => {
    if (!firestore || !user) return;
    setIsInitializing(true);
    setDocumentNonBlocking(doc(firestore, "roles_admin", user.uid), {
      email: user.email, assignedAt: new Date().toISOString(), role: 'admin'
    }, { merge: true });
    toast({ title: "Admin Initialized", description: "You now have full admin rights." });
    setIsInitializing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pending Payment': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Payment Uploaded': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isUserLoading || isAdminRoleLoading) return (
    <div className="flex flex-col md:flex-row min-h-screen"><AdminSidebar />
      <main className="flex-grow flex items-center justify-center">
        <Spinner size="lg" />
      </main>
    </div>
  );

  if (!isMasterAdminEmail && !hasAdminRecord) return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50"><AdminSidebar />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="max-w-md text-center border-none shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="pt-10 pb-6">
            <div className="mx-auto bg-destructive/10 p-6 rounded-full w-fit mb-4"><ShieldAlert className="h-12 w-12 text-destructive" /></div>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>You do not have administrative privileges.</CardDescription>
          </CardHeader>
          <CardContent className="pb-10"><Button onClick={() => window.location.href='/'}>Return Home</Button></CardContent>
        </Card>
      </main>
    </div>
  );

  if (isMasterAdminEmail && !hasAdminRecord) return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50"><AdminSidebar />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="max-w-md text-center border-none shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="pt-10 pb-6">
            <div className="mx-auto bg-primary/10 p-6 rounded-full w-fit mb-4"><ShieldAlert className="h-12 w-12 text-primary" /></div>
            <CardTitle>Admin Setup Required</CardTitle>
            <CardDescription>Welcome, {user?.email}. Initialize your admin record first.</CardDescription>
          </CardHeader>
          <CardContent className="pb-10 px-8">
            <Button onClick={handleInitializeAdmin} disabled={isInitializing} className="w-full">
              {isInitializing && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Initialize Admin Record
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );

  // Revenue growth calculation (improvement 4)
  const now = new Date();
  const currentMonthRevenue = bookings
    .filter(b => b.status === "Confirmed" && b.startDate)
    .filter(b => {
      const d = new Date(b.startDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((acc, b) => acc + (b.totalPrice || 0), 0);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthRevenue = bookings
    .filter(b => b.status === "Confirmed" && b.startDate)
    .filter(b => {
      const d = new Date(b.startDate);
      return d.getFullYear() === prevMonthDate.getFullYear() && d.getMonth() === prevMonthDate.getMonth();
    })
    .reduce((acc, b) => acc + (b.totalPrice || 0), 0);
  const revenueGrowthPct = prevMonthRevenue === 0
    ? (currentMonthRevenue > 0 ? null : 0)
    : Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100);
  const totalRevenue = bookings.filter(b => b.status === "Confirmed").reduce((acc, b) => acc + (b.totalPrice || 0), 0);

  const stats = [
    { label: "Total Bookings", value: bookings.length.toString(), icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50", sub: null },
    { label: "Confirmed", value: bookings.filter(b => b.status === "Confirmed").length.toString(), icon: Check, color: "text-emerald-600", bg: "bg-emerald-50", sub: null },
    { label: "Pending", value: bookings.filter(b => b.status === "Pending Payment" || b.status === "Payment Uploaded").length.toString(), icon: Clock, color: "text-amber-600", bg: "bg-amber-50", sub: null },
    { label: "Cancelled", value: bookings.filter(b => b.status === "Cancelled").length.toString(), icon: X, color: "text-rose-600", bg: "bg-rose-50", sub: null },
    {
      label: "Revenue",
      value: `₱${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      sub: revenueGrowthPct === null
        ? <span className="text-xs font-semibold text-emerald-600 mt-0.5">New this month</span>
        : revenueGrowthPct === 0 && currentMonthRevenue === 0
        ? null
        : <span className={`text-xs font-semibold mt-0.5 ${revenueGrowthPct >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{revenueGrowthPct >= 0 ? "+" : ""}{revenueGrowthPct}% vs last month</span>,
    },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FBFB]">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0">
      <main className="flex-grow">
        {/* Page Header */}
        <div className="bg-gradient-to-br from-primary/8 via-white to-transparent border-b border-slate-100 px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Admin Panel</p>
              <h1 className="text-4xl font-headline font-bold text-slate-900 tracking-tight">
                {activeTab === "bookings" ? "Dashboard"
                : activeTab === "reviews" ? "Reviews"
                : activeTab === "users" ? "Administrators"
                : activeTab === "settings" ? "Settings"
                : "Dashboard"}
              </h1>
              <p className="text-slate-500">
                {activeTab === "bookings" ? "Manage reservations and monitor resort growth."
                : activeTab === "reviews" ? "View and manage guest reviews."
                : activeTab === "users" ? "Manage admin access."
                : activeTab === "settings" ? "Configure payment and resort settings."
                : ""}
              </p>
            </div>
            <button type="button" onClick={handleExportCSV} className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 font-semibold shadow-sm hover:bg-slate-50 transition-colors text-sm cursor-pointer">
              <Download className="h-4 w-4" />
              {filteredBookings.length < bookings.length
                ? `Export (${filteredBookings.length} filtered)`
                : `Export (${bookings.length})`}
            </button>
          </div>
        </div>

        <div className="px-6 py-8 pb-24 md:pb-8 space-y-8">

        {/* Export Modal */}
        <Dialog open={showExport} onOpenChange={setShowExport}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Download className="h-5 w-5 text-primary" />Export Bookings</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground mb-3">Click in the box to select all, then copy and paste into Excel or Google Sheets.</p>
            <textarea readOnly value={csvText} className="w-full h-64 font-mono text-xs p-3 border rounded-xl bg-slate-50 resize-none" onClick={e => (e.target as HTMLTextAreaElement).select()} />
            <div className="flex gap-2 pt-2">
              <Button onClick={() => { navigator.clipboard.writeText(csvText); toast({ title: "Copied!" }); }} className="flex-1">Copy to Clipboard</Button>
              <Button variant="outline" onClick={() => setShowExport(false)} className="flex-1">Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Booking Detail Modal */}
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBookingId(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Booking Details</DialogTitle></DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                {/* Status progress indicator (improvement 3) */}
                {(() => {
                  const isCancelled = selectedBooking.status === "Cancelled";
                  const steps = isCancelled
                    ? ["Pending Payment", "Payment Uploaded", "Cancelled"]
                    : ["Pending Payment", "Payment Uploaded", "Confirmed"];
                  const stepColors = isCancelled
                    ? ["bg-amber-400", "bg-blue-400", "bg-rose-500"]
                    : ["bg-amber-400", "bg-blue-400", "bg-emerald-500"];
                  const currentIdx = steps.indexOf(selectedBooking.status);
                  return (
                    <div className="flex items-center gap-0 mb-2">
                      {steps.map((step, idx) => {
                        const isActive = idx === currentIdx;
                        const isPast = idx < currentIdx;
                        return (
                          <div key={step} className="flex items-center flex-1 min-w-0">
                            <div className="flex flex-col items-center min-w-0">
                              <div className={`h-3 w-3 rounded-full border-2 shrink-0 transition-all ${isActive || isPast ? stepColors[idx] + " border-transparent" : "bg-slate-200 border-slate-300"}`} />
                              <span className={`text-[9px] font-semibold mt-1 text-center leading-tight max-w-[56px] truncate ${isActive ? "text-slate-800" : isPast ? "text-slate-500" : "text-slate-300"}`}>{step}</span>
                            </div>
                            {idx < steps.length - 1 && (
                              <div className={`h-0.5 flex-1 mx-1 rounded ${isPast ? stepColors[idx] : "bg-slate-200"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground text-xs">Ref ID</p><p className="font-bold">{selectedBooking.id?.slice(0,8).toUpperCase()}</p></div>
                  <div><p className="text-muted-foreground text-xs">Status</p><Badge className={cn("text-xs border", getStatusColor(selectedBooking.status))}>{selectedBooking.status}</Badge></div>
                  <div><p className="text-muted-foreground text-xs">Guest</p><p className="font-semibold">{selectedBooking.guestName}</p></div>
                  <div><p className="text-muted-foreground text-xs">Contact</p><p className="font-semibold">{selectedBooking.contactNumber || "Not provided"}</p></div>
                  <div><p className="text-muted-foreground text-xs">Item</p><p className="font-semibold flex items-center gap-2">{selectedBooking.itemName}{selectedBooking.itemType === "tour" ? <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-2 py-0.5 font-bold border">Tour</Badge> : selectedBooking.itemType === "room" ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5 font-bold border">Cottage</Badge> : null}</p></div>
                  <div><p className="text-muted-foreground text-xs">Guests</p><p className="font-semibold">{selectedBooking.guestCount}</p></div>
                  <div><p className="text-muted-foreground text-xs">Dates</p><p className="font-semibold">{selectedBooking.startDate}{selectedBooking.endDate !== selectedBooking.startDate ? ` → ${selectedBooking.endDate}` : ""}</p></div>
                  <div><p className="text-muted-foreground text-xs">Total</p><p className="font-bold text-primary text-lg">₱{selectedBooking.totalPrice?.toLocaleString()}</p></div>
                </div>
                {/* Proof of Payment — always visible */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Proof of Payment
                  </p>
                  {selectedBooking.paymentImageUrl ? (
                    <div className="space-y-2">
                      <div className="relative w-full h-56 rounded-xl overflow-hidden border bg-slate-50">
                        <Image
                          src={selectedBooking.paymentImageUrl}
                          alt="Payment proof"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <a
                        href={selectedBooking.paymentImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                      >
                        <ImageIcon className="h-3 w-3" />
                        Open full image
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                      <div className="bg-slate-200 p-2 rounded-lg">
                        <ImageIcon className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500">No proof uploaded yet</p>
                        <p className="text-xs text-slate-400">Guest hasn&apos;t uploaded a payment receipt.</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Admin Notes</p>
                  <Textarea
                    placeholder="e.g. Paid via BDO, GCash receipt verified..."
                    value={bookingNote}
                    onChange={e => setBookingNote(e.target.value)}
                    className="text-sm min-h-[80px]"
                  />
                  <Button size="sm" variant="outline" onClick={handleSaveNote} className="w-full">Save Note</Button>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => { updateStatus(selectedBooking.userId, selectedBooking.id, "Confirmed", selectedBooking.itemName); setSelectedBookingId(null); }} className="flex-1">Confirm</Button>
                  <Button size="sm" variant="outline" onClick={() => { updateStatus(selectedBooking.userId, selectedBooking.id, "Cancelled", selectedBooking.itemName); setSelectedBookingId(null); }} className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50">Cancel</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Stats + Chart — only on Reservations tab */}
        {activeTab === "bookings" && (<>
        {/* Today's Check-ins Widget (improvement 1) */}
        {(() => {
          const todayStr = new Date().toISOString().slice(0, 10);
          const todayBookings = bookings.filter(b => b.startDate === todayStr);
          return (
            <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-gradient-to-br from-teal-50 to-amber-50 border border-teal-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-teal-100 shrink-0">
                    <Sun className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-0.5">Today&apos;s Check-ins</p>
                    <p className="text-2xl font-bold text-slate-900 leading-none">{todayBookings.length}</p>
                    {todayBookings.length > 0 ? (
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {todayBookings.map(b => b.guestName).filter(Boolean).join(", ")}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">No check-ins scheduled for today.</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <Calendar className="h-8 w-8 text-amber-400 opacity-60" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-md rounded-2xl overflow-hidden bg-white group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <CardContent className="p-0">
                <div className={cn("h-1 w-full", stat.color.replace("text-", "bg-").replace("-600","-400").replace("-500","-400"))} />
                <div className="p-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 leading-none">{stat.value}</p>
                    {stat.sub && <div className="mt-1">{stat.sub}</div>}
                  </div>
                  <div className={cn("p-3 rounded-xl shrink-0", stat.bg)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart */}
        {(revenueChartData.length > 0 || chartRange !== "all") && (
          <Card className="border-none shadow-md rounded-2xl bg-white">
            <CardHeader className="pb-0 pt-6 px-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base font-headline font-bold text-slate-900">Monthly Revenue</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Confirmed bookings only</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {([["month","This Month"],["3months","Last 3 Months"],["all","All Time"]] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setChartRange(val)} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors", chartRange === val ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40")}>
                      {label}
                    </button>
                  ))}
                  <TrendingUp className="h-5 w-5 text-primary opacity-60 ml-2" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-4 pt-2">
              {revenueChartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[180px] gap-3 text-slate-400">
                  <TrendingUp className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-semibold">No confirmed revenue in this period yet.</p>
                  <p className="text-xs opacity-70">Revenue will appear here once bookings are confirmed.</p>
                </div>
              ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#12AFAB" stopOpacity={1} />
                      <stop offset="100%" stopColor="#12AFAB" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v: number) => `\u20B1${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(18,175,171,0.05)" }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: "12px" }}
                    formatter={(v: number) => [`\u20B1${Number(v).toLocaleString()}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[8,8,0,0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}
        </>)}

        <div className="w-full space-y-6">
          {activeTab === "bookings" && (
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-slate-50">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-headline font-bold text-slate-900">Recent Reservations</CardTitle>
                    <CardDescription className="text-slate-500">Click a row to view full details.</CardDescription>
                  </div>
                  <div className="bg-primary/5 px-4 py-2 rounded-xl flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" /><span className="text-sm font-bold text-primary">Live Updates</span>
                  </div>
                </div>
                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by guest or item..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["All","Pending Payment","Payment Uploaded","Confirmed","Cancelled"].map(s => (
                      <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors", statusFilter === s ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40")}>
                        {s === "Pending Payment" ? "Pending" : s === "Payment Uploaded" ? "Receipt ✓" : s}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isBookingsLoading ? (
                  <div className="flex justify-center py-24"><Spinner size="lg" /></div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-24 text-slate-400 italic">No bookings found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-none">
                          {["Guest Details","Experience","Booking Dates","Status","Amount","Actions"].map(h => (
                            <TableHead key={h} className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px]">{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map((booking) => {
                          const todayStr = new Date().toISOString().slice(0, 10);
                          const isToday = booking.startDate === todayStr;
                          return (
                          <TableRow key={booking.id} className={cn("hover:bg-slate-50/40 transition-colors border-slate-50 cursor-pointer", isToday && "bg-amber-50/50")} onClick={() => { setSelectedBookingId(booking.id); setBookingNote(booking.adminNote || ""); }}>
                            <TableCell className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-bold text-primary uppercase leading-none">
                                    {(booking.guestName ?? "??").slice(0, 2)}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">{booking.guestName}</div>
                                  {booking.contactNumber && booking.contactNumber !== "Not provided"
                                    ? <div className="text-xs font-semibold text-slate-600">{booking.contactNumber}</div>
                                    : <div className="text-xs text-slate-400">No contact</div>
                                  }
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <MapPin className="h-3 w-3 text-primary/50 shrink-0" />
                                <span className="font-semibold text-slate-700 text-sm">{booking.itemName}</span>
                                {booking.itemType === "tour" && <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-2 py-0.5 font-bold border">Tour</Badge>}
                                {booking.itemType === "room" && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5 font-bold border">Cottage</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div>
                                  {booking.endDate && booking.endDate !== booking.startDate ? (
                                    <div className="text-sm font-bold text-slate-700">
                                      {new Date(booking.startDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                      {" → "}
                                      {new Date(booking.endDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </div>
                                  ) : (
                                    <div className="text-sm font-bold text-slate-700">{booking.startDate}</div>
                                  )}
                                </div>
                                {isToday && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-2 py-0.5 font-bold border">Today</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5">
                              <Badge className={cn("px-3 py-1 rounded-full text-[11px] font-bold border", getStatusColor(booking.status))}>{booking.status}</Badge>
                            </TableCell>
                            <TableCell className="px-6 py-5"><span className="font-bold text-primary">₱{booking.totalPrice?.toLocaleString()}</span></TableCell>
                            <TableCell className="px-6 py-5 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                {booking.paymentImageUrl && (
                                  <span title="Proof of payment uploaded">
                                    <ImageIcon className="h-4 w-4 text-green-500" />
                                  </span>
                                )}
                                {booking.status === "Pending Payment" && !booking.paymentImageUrl && (
                                  <span title="No proof uploaded yet">
                                    <ImageIcon className="h-4 w-4 text-slate-300" />
                                  </span>
                                )}
                                {/* Inline Confirm/Cancel for Payment Uploaded rows (improvement 2) */}
                                {booking.status === "Payment Uploaded" && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="h-7 px-2.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                                      onClick={() => updateStatus(booking.userId, booking.id, "Confirmed", booking.itemName)}
                                    >
                                      <Check className="h-3 w-3 mr-1" />Confirm
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg"
                                      onClick={() => updateStatus(booking.userId, booking.id, "Cancelled", booking.itemName)}
                                    >
                                      <X className="h-3 w-3 mr-1" />Cancel
                                    </Button>
                                  </>
                                )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl p-2 min-w-[160px]">
                                  <DropdownMenuItem onClick={() => { setSelectedBookingId(booking.id); setBookingNote(booking.adminNote || ""); }} className="rounded-lg cursor-pointer"><Eye className="mr-2 h-4 w-4 text-primary" /><span className="font-semibold">View Details</span></DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStatus(booking.userId, booking.id, "Confirmed", booking.itemName)} className="rounded-lg cursor-pointer"><Check className="mr-2 h-4 w-4 text-emerald-600" /><span className="font-semibold">Confirm</span></DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStatus(booking.userId, booking.id, "Cancelled", booking.itemName)} className="rounded-lg cursor-pointer text-rose-600 focus:bg-rose-50"><X className="mr-2 h-4 w-4" /><span className="font-semibold">Cancel</span></DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {activeTab === "reviews" && (
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-slate-50">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-2xl font-headline font-bold text-slate-900 flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                      Ratings &amp; Reviews
                    </CardTitle>
                    <CardDescription className="text-slate-500">All guest reviews across cottages and tours.</CardDescription>
                  </div>
                  {allReviews && allReviews.length > 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-full px-4 py-1.5">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-amber-700">
                        {(allReviews.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / allReviews.length).toFixed(1)} avg
                      </span>
                      <span className="text-xs text-amber-600">({allReviews.length} total)</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isReviewsLoading ? (
                  <div className="flex justify-center py-24"><Spinner size="lg" /></div>
                ) : !allReviews || allReviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                    <Star className="h-10 w-10 opacity-20" />
                    <p className="text-sm italic">No reviews yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {allReviews.map((review: any) => {
                      const itemType: string = review.itemType ?? "";
                      const itemId: string = review.itemId ?? "";
                      const itemName = review.itemName || itemNameMap[itemId] || (itemId ? itemId.slice(0, 8) : "—");
                      const isHidden = review.isHidden === true;
                      const isReplying = replyingReviewId === review.id;

                      return (
                        <div key={review.id} className={cn("px-8 py-5 transition-colors", isHidden ? "bg-slate-50 opacity-60" : "hover:bg-slate-50/40")}>
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary uppercase">
                                {(review.userName ?? "G").slice(0, 2)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-slate-800">{review.userName}</span>
                                <Badge className={cn("border-none text-[10px] font-semibold capitalize px-2", itemType === "room" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
                                  {itemType === "room" ? "Cottage" : "Tour"}
                                </Badge>
                                {/* Item name instead of ID */}
                                <span className="text-xs text-slate-600 font-semibold">{itemName}</span>
                                {isHidden && (
                                  <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                    <EyeOff className="h-3 w-3" /> Hidden
                                  </span>
                                )}
                              </div>
                              {/* Stars */}
                              <div className="flex items-center gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} className={cn("h-3.5 w-3.5", (review.rating ?? 0) >= s ? "fill-amber-400 text-amber-400" : "fill-none text-slate-200")} />
                                ))}
                                <span className="text-xs text-slate-400 ml-1">{review.rating}/5</span>
                              </div>
                              {review.comment && (
                                <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                              )}
                              <p className="text-[10px] text-slate-400">
                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : ""}
                              </p>

                              {/* Admin reply display */}
                              {review.adminReply && (
                                <div className="mt-2 pl-3 border-l-2 border-primary/30 bg-primary/5 rounded-r-xl p-3">
                                  <p className="text-[10px] font-bold text-primary uppercase tracking-wide mb-1">Admin Response</p>
                                  <p className="text-xs text-slate-700">{review.adminReply}</p>
                                </div>
                              )}

                              {/* Reply input */}
                              {isReplying && (
                                <div className="mt-2 space-y-2">
                                  <Textarea
                                    placeholder="Write a response visible to the guest..."
                                    className="text-sm min-h-[70px]"
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" className="gap-1.5" onClick={() => {
                                      if (!firestore || !replyText.trim()) return;
                                      updateDocumentNonBlocking(doc(firestore, "allReviews", review.id), { adminReply: replyText.trim() });
                                      // Also update subcollection copy
                                      const subDocId = `${review.itemType}_${review.itemId}`;
                                      updateDocumentNonBlocking(doc(firestore, "reviews", subDocId, "entries", review.userId), { adminReply: replyText.trim() });
                                      setReplyingReviewId(null);
                                      setReplyText("");
                                      toast({ title: "Reply saved", description: "Your response is now visible to guests." });
                                    }}>
                                      <Reply className="h-3.5 w-3.5" /> Save Reply
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setReplyingReviewId(null); setReplyText(""); }}>Cancel</Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Reply */}
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" title="Reply"
                                onClick={() => {
                                  setReplyingReviewId(isReplying ? null : review.id);
                                  setReplyText(review.adminReply || "");
                                }}>
                                <Reply className="h-3.5 w-3.5" />
                              </Button>
                              {/* Hide/Show toggle */}
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400" title={isHidden ? "Show" : "Hide"}
                                onClick={() => {
                                  if (!firestore) return;
                                  updateDocumentNonBlocking(doc(firestore, "allReviews", review.id), { isHidden: !isHidden });
                                  const subDocId = `${review.itemType}_${review.itemId}`;
                                  updateDocumentNonBlocking(doc(firestore, "reviews", subDocId, "entries", review.userId), { isHidden: !isHidden });
                                  toast({ title: isHidden ? "Review visible" : "Review hidden" });
                                }}>
                                {isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                              </Button>
                              {/* Delete */}
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete"
                                onClick={() => {
                                  if (!firestore) return;
                                  deleteDocumentNonBlocking(doc(firestore, "allReviews", review.id));
                                  const subDocId = `${review.itemType}_${review.itemId}`;
                                  deleteDocumentNonBlocking(doc(firestore, "reviews", subDocId, "entries", review.userId));
                                  toast({ title: "Review deleted" });
                                }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {activeTab === "users" && (            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-slate-50">
                <CardTitle className="text-2xl font-headline font-bold text-slate-900">Administrator Overview</CardTitle>
                <CardDescription className="text-slate-500">Authorized users with system-level access.</CardDescription>
                {/* Add Admin */}
                <div className="flex gap-3 mt-4">
                  <Input placeholder="Enter email to invite as admin..." value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="flex-1" />
                  <Button size="sm" onClick={handleAddAdmin} disabled={isAddingAdmin || !newAdminEmail.trim()} className="gap-2">
                    <UserPlus className="h-4 w-4" /> Invite Admin
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">The invited user must sign up then you manually assign their role in Firestore.</p>
              </CardHeader>
              <CardContent className="p-0">
                {isAdminsLoading ? (
                  <div className="flex justify-center py-24"><Spinner size="lg" /></div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-none">
                        {["Admin Email","Assigned Date","Role","ID"].map(h => (
                          <TableHead key={h} className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px]">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminsList?.map((adm) => (
                        <TableRow key={adm.id} className="hover:bg-slate-50/40 transition-colors border-slate-50">
                          <TableCell className="px-8 py-6 font-semibold text-slate-700">{adm.email}</TableCell>
                          <TableCell className="py-6 text-slate-500">{adm.assignedAt ? new Date(adm.assignedAt).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="py-6"><Badge className="bg-primary/10 text-primary border-none font-bold uppercase tracking-widest text-[10px] px-3 py-1">{adm.role || 'Admin'}</Badge></TableCell>
                          <TableCell className="px-8 py-6 text-right font-mono text-[11px] text-slate-300">{adm.id}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
          {activeTab === "settings" && (
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-2xl"><Settings className="h-5 w-5 text-primary" /></div>
                  <div>
                    <CardTitle className="text-2xl font-headline font-bold text-slate-900">Payment Settings</CardTitle>
                    <CardDescription className="text-slate-500">Update the GCash number shown to guests on My Bookings.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6 max-w-lg">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">GCash Number</label>
                  <Input
                    placeholder="e.g. 0912-345-6789"
                    value={gcashNumber}
                    onChange={e => setGcashNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">This number is shown to guests when they need to pay.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">Account Name</label>
                  <Input
                    placeholder="e.g. Balatasan Resort"
                    value={gcashName}
                    onChange={e => setGcashName(e.target.value)}
                  />
                </div>
                <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full sm:w-auto">
                  {isSavingSettings && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Payment Settings
                </Button>

                <div className="border-t border-slate-100 pt-6 mt-2 space-y-6">
                  <div>
                    <p className="text-base font-bold text-slate-700 mb-1">Resort Policy</p>
                    <p className="text-xs text-muted-foreground">Configure cancellation policy and contact information.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">Cancellation Policy (hours)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 24"
                      value={cancellationHours}
                      onChange={e => setCancellationHours(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Number of hours before check-in that guests can cancel.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">Resort Contact Number</label>
                    <Input
                      placeholder="e.g. +63 912 345 6789"
                      value={contactNumber}
                      onChange={e => setContactNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">Resort Address</label>
                    <Input
                      placeholder="e.g. Balatasan, Bulalacao, Oriental Mindoro"
                      value={resortAddress}
                      onChange={e => setResortAddress(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSavePolicy} disabled={isSavingPolicy} className="w-full sm:w-auto">
                    {isSavingPolicy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Save Policy Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        </div>{/* end container */}
      </main>
      </div>
    </div>
  );
}
