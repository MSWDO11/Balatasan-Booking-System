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
  Search, Eye, Image as ImageIcon, Settings, Star, MessageSquare, Bell,
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
  const [gcashNumber, setGcashNumber] = useState("");
  const [gcashName, setGcashName] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [cancellationHours, setCancellationHours] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [resortAddress, setResortAddress] = useState("");
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [resortName, setResortName] = useState("");
  const [resortDescription, setResortDescription] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  // New general fields
  const [resortEmail, setResortEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  // New payment fields
  const [downPaymentPercent, setDownPaymentPercent] = useState("");
  const [paymentDeadlineDays, setPaymentDeadlineDays] = useState("");
  // New policy fields
  const [minBookingNotice, setMinBookingNotice] = useState("");
  const [extraGuestFee, setExtraGuestFee] = useState("");
  const [noShowPolicy, setNoShowPolicy] = useState("");
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [chartRange, setChartRange] = useState<"month" | "3months" | "all">("all");
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "home";

  const adminDocRef = useMemoFirebase(() =>
    (firestore && user) ? doc(firestore, "roles_admin", user.uid) : null,
    [firestore, user]
  );
  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminDocRef);
  const isMasterAdminEmail = user?.email?.toLowerCase() === "admin@gmail.com";
  const hasAdminRecord = !!adminRole;
  const canLoadData = !isUserLoading && !isAdminRoleLoading && (isMasterAdminEmail || hasAdminRecord);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !canLoadData) return null;
    return query(collectionGroup(firestore, "bookings"));
  }, [firestore, user, canLoadData]);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, "settings", "payment") : null, [firestore]);
  const { data: paymentSettings } = useDoc(settingsRef);

  const policyRef = useMemoFirebase(() => firestore ? doc(firestore, "settings", "policy") : null, [firestore]);
  const { data: policySettings } = useDoc(policyRef);

  const generalRef = useMemoFirebase(() => firestore ? doc(firestore, "settings", "general") : null, [firestore]);
  const { data: generalSettings } = useDoc(generalRef);

  const { data: rawBookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);

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
      setConfirmationMessage(paymentSettings.confirmationMessage || "");
      setDownPaymentPercent(paymentSettings.downPaymentPercent ?? "");
      setPaymentDeadlineDays(paymentSettings.paymentDeadlineDays ?? "");
    }
  }, [paymentSettings]);

  // Sync policy settings into local state for editing
  useEffect(() => {
    if (policySettings) {
      setCancellationHours(policySettings.cancellationHours ?? "");
      setContactNumber(policySettings.contactNumber || "");
      setResortAddress(policySettings.address || "");
      setMinBookingNotice(policySettings.minBookingNotice ?? "");
      setExtraGuestFee(policySettings.extraGuestFee ?? "");
      setNoShowPolicy(policySettings.noShowPolicy || "");
      setSmokingAllowed(policySettings.smokingAllowed ?? false);
      setPetsAllowed(policySettings.petsAllowed ?? false);
    }
  }, [policySettings]);

  useEffect(() => {
    if (generalSettings) {
      setResortName(generalSettings.resortName || "");
      setResortDescription(generalSettings.description || "");
      setOpeningTime(generalSettings.openingTime || "");
      setClosingTime(generalSettings.closingTime || "");
      setFacebookUrl(generalSettings.facebookUrl || "");
      setInstagramUrl(generalSettings.instagramUrl || "");
      setConfirmationMessage(generalSettings.confirmationMessage || "");
      setResortEmail(generalSettings.email || "");
      setWhatsappNumber(generalSettings.whatsappNumber || "");
      setCheckInTime(generalSettings.checkInTime || "");
      setCheckOutTime(generalSettings.checkOutTime || "");
    }
  }, [generalSettings]);

  const handleSaveGeneral = () => {
    if (!firestore) return;
    setIsSavingGeneral(true);
    setDocumentNonBlocking(doc(firestore, "settings", "general"), {
      resortName, description: resortDescription,
      openingTime, closingTime,
      facebookUrl, instagramUrl,
      confirmationMessage,
      email: resortEmail,
      whatsappNumber,
      checkInTime,
      checkOutTime,
      contactNumber,
      address: resortAddress,
    }, { merge: true });
    toast({ title: "General settings saved" });
    setIsSavingGeneral(false);
  };

  const handleSaveSettings = () => {
    if (!firestore) return;
    setIsSavingSettings(true);
    setDocumentNonBlocking(doc(firestore, "settings", "payment"), {
      gcashNumber, gcashName, confirmationMessage,
      downPaymentPercent: downPaymentPercent === "" ? "" : Number(downPaymentPercent),
      paymentDeadlineDays: paymentDeadlineDays === "" ? "" : Number(paymentDeadlineDays),
    }, { merge: true });
    toast({ title: "Settings saved", description: "GCash details updated." });
    setIsSavingSettings(false);
  };

  const handleSavePolicy = () => {
    if (!firestore) return;
    setIsSavingPolicy(true);
    setDocumentNonBlocking(doc(firestore, "settings", "policy"), {
      cancellationHours: cancellationHours === "" ? "" : Number(cancellationHours),
      minBookingNotice: minBookingNotice === "" ? "" : Number(minBookingNotice),
      extraGuestFee: extraGuestFee === "" ? "" : Number(extraGuestFee),
      noShowPolicy,
      smokingAllowed,
      petsAllowed,
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

  if ((isUserLoading || isAdminRoleLoading) && !isMasterAdminEmail) return (
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
                {activeTab === "home" ? "Dashboard"
                : activeTab === "bookings" ? "Reservations"
                : activeTab === "reviews" ? "Reviews"
                : activeTab === "users" ? "Users"
                : activeTab === "settings" ? "Settings"
                : "Dashboard"}
              </h1>
              <p className="text-slate-500">
                {activeTab === "home" ? "Monitor resort performance at a glance."
                : activeTab === "bookings" ? "Manage and monitor all guest reservations."
                : activeTab === "reviews" ? "View and manage guest reviews."
                : activeTab === "users" ? "View all guests who have made bookings."
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
          {/* Search + Filter — only on Reservations tab */}
          {activeTab === "bookings" && (
            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by guest or item..." className="pl-9 bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["All","Pending Payment","Payment Uploaded","Confirmed","Cancelled"].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors", statusFilter === s ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40")}>
                    {s === "Pending Payment" ? "Pending" : s === "Payment Uploaded" ? "Receipt ✓" : s}
                  </button>
                ))}
              </div>
            </div>
          )}
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
                <Button size="sm" variant="outline" className="w-full gap-2 mt-1"
                  onClick={() => {
                    const b = selectedBooking;
                    const win = window.open("", "_blank");
                    if (!win) return;
                    win.document.write(`
                      <html><head><title>Booking Receipt</title>
                      <style>
                        body { font-family: sans-serif; padding: 32px; max-width: 480px; margin: 0 auto; color: #1e293b; }
                        h1 { color: #12AFAB; font-size: 24px; margin-bottom: 4px; }
                        .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                        .value { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
                        .divider { border-top: 1px solid #e2e8f0; margin: 16px 0; }
                        .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #d1fae5; color: #065f46; }
                        .total { font-size: 22px; font-weight: 800; color: #12AFAB; }
                        @media print { button { display: none; } }
                      </style></head>
                      <body>
                        <h1>Balatasan Resort</h1>
                        <p style="color:#64748b;font-size:13px">Official Booking Receipt</p>
                        <div class="divider"></div>
                        <div class="label">Ref ID</div><div class="value">${b.id?.slice(0,8).toUpperCase()}</div>
                        <div class="label">Guest</div><div class="value">${b.guestName}</div>
                        <div class="label">Contact</div><div class="value">${b.contactNumber || "Not provided"}</div>
                        <div class="label">Item</div><div class="value">${b.itemName}</div>
                        <div class="label">Dates</div><div class="value">${b.startDate}${b.endDate && b.endDate !== b.startDate ? " → " + b.endDate : ""}</div>
                        <div class="label">Guests</div><div class="value">${b.guestCount}</div>
                        <div class="label">Status</div><div class="value"><span class="badge">${b.status}</span></div>
                        <div class="divider"></div>
                        <div class="label">Total Amount</div>
                        <div class="total">₱${b.totalPrice?.toLocaleString()}</div>
                        <div class="divider"></div>
                        <p style="font-size:12px;color:#94a3b8">Generated ${new Date().toLocaleString()} · Balatasan Beach Resort, Bulalacao, Oriental Mindoro</p>
                        <button onclick="window.print()" style="margin-top:16px;padding:8px 20px;background:#12AFAB;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600">Print Receipt</button>
                      </body></html>
                    `);
                    win.document.close();
                  }}>
                  <Download className="h-4 w-4" /> Print / Download Receipt
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Stats + Chart — only on home/dashboard view */}
        {activeTab === "home" && (<>

        {/* Top row: Today's Check-ins + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Today's Check-ins */}
          {(() => {
            const todayStr = new Date().toISOString().slice(0, 10);
            const todayBookings = bookings.filter(b => b.startDate === todayStr);
            const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
            const tomorrowBookings = bookings.filter(b => b.startDate === tomorrowStr);
            return (
              <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-gradient-to-br from-teal-500 to-teal-600 text-white lg:col-span-1">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-teal-100 text-xs font-bold uppercase tracking-widest mb-1">Today&apos;s Check-ins</p>
                      <p className="text-5xl font-bold leading-none">{todayBookings.length}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl">
                      <Sun className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  {todayBookings.length > 0 ? (
                    <div className="space-y-1">
                      {todayBookings.slice(0, 2).map(b => (
                        <p key={b.id} className="text-teal-100 text-xs truncate">• {b.guestName} — {b.itemName}</p>
                      ))}
                      {todayBookings.length > 2 && <p className="text-teal-200 text-xs">+{todayBookings.length - 2} more</p>}
                    </div>
                  ) : (
                    <p className="text-teal-100 text-xs">No check-ins scheduled for today.</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-teal-200" />
                    <p className="text-teal-100 text-xs">{tomorrowBookings.length} check-in{tomorrowBookings.length !== 1 ? "s" : ""} tomorrow</p>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Stats grid */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <Card key={i} className="border-none shadow-md rounded-2xl overflow-hidden bg-white group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <CardContent className="p-0">
                  <div className={cn("h-1 w-full", stat.color.replace("text-", "bg-").replace("-600","-400").replace("-500","-400"))} />
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                      <div className={cn("p-2 rounded-lg shrink-0", stat.bg)}>
                        <stat.icon className={cn("h-4 w-4", stat.color)} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 leading-none">{stat.value}</p>
                    {stat.sub && <div>{stat.sub}</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom row: Revenue Chart + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Revenue Chart */}
          <Card className="border-none shadow-md rounded-2xl bg-white lg:col-span-2">
            <CardHeader className="pb-0 pt-6 px-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base font-headline font-bold text-slate-900">Monthly Revenue</CardTitle>
                  <CardDescription className="text-xs text-slate-400">Confirmed bookings only</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {([["month","This Month"],["3months","3 Months"],["all","All Time"]] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setChartRange(val)} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors", chartRange === val ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40")}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-4 pt-2">
              {revenueChartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] gap-3 text-slate-400">
                  <TrendingUp className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-semibold">No confirmed revenue yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={revenueChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#12AFAB" stopOpacity={1} />
                        <stop offset="100%" stopColor="#12AFAB" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v: number) => `₱${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(18,175,171,0.05)" }}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: "12px" }}
                      formatter={(v: number) => [`₱${Number(v).toLocaleString()}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[8,8,0,0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card className="border-none shadow-md rounded-2xl bg-white">
            <CardHeader className="pb-3 pt-6 px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-headline font-bold text-slate-900">Recent Bookings</CardTitle>
                <button onClick={() => window.location.href="/admin/dashboard?tab=bookings"} className="text-xs text-primary font-semibold hover:underline">View all →</button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                  <ShoppingBag className="h-8 w-8 opacity-20" />
                  <p className="text-xs">No bookings yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookings.slice(0, 6).map(b => (
                    <div key={b.id} onClick={() => { setSelectedBookingId(b.id); setBookingNote(b.adminNote || ""); }} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-primary uppercase">{(b.guestName ?? "??").slice(0,2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{b.itemName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{b.guestName} · {b.startDate}</p>
                      </div>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", getStatusColor(b.status))}>
                        {b.status === "Confirmed" ? "✓" : b.status === "Cancelled" ? "✗" : b.status === "Payment Uploaded" ? "📎" : "…"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        </>)}

        <div className="w-full space-y-6">
          {activeTab === "bookings" && (
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
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
          {activeTab === "users" && (() => {
            // Derive unique guests from bookings
            const guestMap = new Map<string, { name: string; contact: string; bookingCount: number; totalSpent: number; lastDate: string; }>();
            bookings.forEach((b: any) => {
              const key = b.userId || b.guestName;
              if (!key) return;
              const existing = guestMap.get(key);
              if (existing) {
                existing.bookingCount++;
                existing.totalSpent += b.totalPrice || 0;
                if ((b.startDate || "") > existing.lastDate) existing.lastDate = b.startDate || "";
              } else {
                guestMap.set(key, {
                  name: b.guestName || "Unknown",
                  contact: b.contactNumber || "No contact",
                  bookingCount: 1,
                  totalSpent: b.totalPrice || 0,
                  lastDate: b.startDate || "",
                });
              }
            });
            const guests = Array.from(guestMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
            return (
              <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-slate-50">
                  <CardTitle className="text-2xl font-headline font-bold text-slate-900">Guest Overview</CardTitle>
                  <CardDescription className="text-slate-500">{guests.length} unique guest{guests.length !== 1 ? "s" : ""} who have made bookings.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isBookingsLoading ? (
                    <div className="flex justify-center py-24"><Spinner size="lg" /></div>
                  ) : guests.length === 0 ? (
                    <div className="text-center py-24 text-slate-400 italic">No guests yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="border-none">
                            {["Guest", "Contact", "Bookings", "Total Spent", "Last Visit"].map(h => (
                              <TableHead key={h} className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px]">{h}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {guests.map((g, i) => (
                            <TableRow key={i} className="hover:bg-slate-50/40 transition-colors border-slate-50">
                              <TableCell className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-primary uppercase">{g.name.slice(0,2)}</span>
                                  </div>
                                  <span className="font-bold text-slate-800">{g.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-5 text-slate-500">{g.contact}</TableCell>
                              <TableCell className="py-5">
                                <Badge className="bg-blue-50 text-blue-700 border-none font-bold px-3 py-1">{g.bookingCount} booking{g.bookingCount !== 1 ? "s" : ""}</Badge>
                              </TableCell>
                              <TableCell className="py-5 font-bold text-primary">₱{g.totalSpent.toLocaleString()}</TableCell>
                              <TableCell className="px-8 py-5 text-slate-500 text-sm">{g.lastDate || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}
          {activeTab === "settings" && (
            <div className="space-y-6">

              {/* General Info */}
              <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
                <CardHeader className="p-6 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-xl"><Settings className="h-5 w-5 text-primary" /></div>
                    <div>
                      <CardTitle className="text-lg font-headline font-bold text-slate-900">General Information</CardTitle>
                      <CardDescription className="text-slate-500 text-xs">Basic resort details shown to guests.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Resort Name</label>
                      <Input placeholder="e.g. Balatasan Beach Resort" value={resortName} onChange={e => setResortName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Contact Number</label>
                      <Input placeholder="e.g. +63 912 345 6789" value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Email Address</label>
                      <Input type="email" placeholder="e.g. balatasan@gmail.com" value={resortEmail} onChange={e => setResortEmail(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">WhatsApp Number</label>
                      <Input placeholder="e.g. +63 912 345 6789" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-600">Resort Address</label>
                    <Input placeholder="e.g. Balatasan, Bulalacao, Oriental Mindoro" value={resortAddress} onChange={e => setResortAddress(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-600">Resort Description</label>
                    <Textarea placeholder="Brief description of the resort shown on the website..." value={resortDescription} onChange={e => setResortDescription(e.target.value)} className="min-h-[80px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Opening Time</label>
                      <Input type="time" value={openingTime} onChange={e => setOpeningTime(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Closing Time</label>
                      <Input type="time" value={closingTime} onChange={e => setClosingTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Check-in Time</label>
                      <Input type="time" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Earliest guests can arrive.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Check-out Time</label>
                      <Input type="time" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Latest guests must leave.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Facebook Page URL</label>
                      <Input placeholder="https://facebook.com/..." value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Instagram URL</label>
                      <Input placeholder="https://instagram.com/..." value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={handleSaveGeneral} disabled={isSavingGeneral} className="gap-2">
                    {isSavingGeneral && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save General Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Settings */}
              <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
                <CardHeader className="p-6 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 p-2.5 rounded-xl"><Wallet className="h-5 w-5 text-emerald-600" /></div>
                    <div>
                      <CardTitle className="text-lg font-headline font-bold text-slate-900">Payment Settings</CardTitle>
                      <CardDescription className="text-slate-500 text-xs">GCash details shown to guests when paying.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">GCash Number</label>
                      <Input placeholder="e.g. 0912-345-6789" value={gcashNumber} onChange={e => setGcashNumber(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Shown to guests on the payment screen.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">GCash Account Name</label>
                      <Input placeholder="e.g. Balatasan Resort" value={gcashName} onChange={e => setGcashName(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Down Payment (%)</label>
                      <Input type="number" min="0" max="100" placeholder="e.g. 50" value={downPaymentPercent} onChange={e => setDownPaymentPercent(e.target.value)} />
                      <p className="text-xs text-muted-foreground">% of total required to confirm. Leave blank for full payment.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Payment Deadline (days before check-in)</label>
                      <Input type="number" min="0" placeholder="e.g. 3" value={paymentDeadlineDays} onChange={e => setPaymentDeadlineDays(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Full payment must be received this many days before check-in.</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-600">Booking Confirmation Message</label>
                    <Textarea placeholder="Message sent to guests after booking is confirmed..." value={confirmationMessage} onChange={e => setConfirmationMessage(e.target.value)} className="min-h-[80px]" />
                    <p className="text-xs text-muted-foreground">Optional custom message included in the confirmation notification.</p>
                  </div>
                  <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="gap-2">
                    {isSavingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Payment Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Resort Policy */}
              <Card className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
                <CardHeader className="p-6 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-50 p-2.5 rounded-xl"><Clock className="h-5 w-5 text-amber-600" /></div>
                    <div>
                      <CardTitle className="text-lg font-headline font-bold text-slate-900">Resort Policy</CardTitle>
                      <CardDescription className="text-slate-500 text-xs">Cancellation rules shown to guests during booking.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Cancellation Policy (hours before check-in)</label>
                      <Input type="number" placeholder="e.g. 24" value={cancellationHours} onChange={e => setCancellationHours(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Free cancellation up to this many hours before check-in.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Minimum Booking Notice (hours)</label>
                      <Input type="number" placeholder="e.g. 12" value={minBookingNotice} onChange={e => setMinBookingNotice(e.target.value)} />
                      <p className="text-xs text-muted-foreground">How far in advance guests must book.</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-600">Extra Guest Fee (₱ per person over capacity)</label>
                    <Input type="number" placeholder="e.g. 150" value={extraGuestFee} onChange={e => setExtraGuestFee(e.target.value)} className="max-w-xs" />
                    <p className="text-xs text-muted-foreground">Additional charge per guest beyond standard capacity.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-600">No-Show Policy</label>
                    <Textarea placeholder="e.g. No refund for no-shows. Please contact us at least 24 hours in advance to cancel." value={noShowPolicy} onChange={e => setNoShowPolicy(e.target.value)} className="min-h-[70px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Smoking</label>
                      <button type="button" onClick={() => setSmokingAllowed(v => !v)}
                        className={`flex h-10 w-full items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${smokingAllowed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-input bg-background text-muted-foreground hover:bg-accent"}`}>
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${smokingAllowed ? "bg-emerald-500" : "bg-slate-300"}`} />
                        {smokingAllowed ? "Allowed in designated areas" : "No smoking"}
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-600">Pets</label>
                      <button type="button" onClick={() => setPetsAllowed(v => !v)}
                        className={`flex h-10 w-full items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${petsAllowed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-input bg-background text-muted-foreground hover:bg-accent"}`}>
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${petsAllowed ? "bg-emerald-500" : "bg-slate-300"}`} />
                        {petsAllowed ? "Pets welcome" : "No pets allowed"}
                      </button>
                    </div>
                  </div>
                  <Button onClick={handleSavePolicy} disabled={isSavingPolicy} className="gap-2">
                    {isSavingPolicy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Policy Settings
                  </Button>
                </CardContent>
              </Card>

            </div>
          )}
        </div>
        </div>{/* end container */}
      </main>
      </div>
    </div>
  );
}
