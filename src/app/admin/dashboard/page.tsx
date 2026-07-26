"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar as CalendarIcon, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  MoreVertical,
  Check,
  X,
  Loader2,
  ShieldAlert,
  User,
  MapPin,
  Wallet,
  Users as UsersIcon,
  ShoppingBag
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useUser, setDocumentNonBlocking, useDoc } from "@/firebase";
import { collectionGroup, query, doc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);

  // Check for admin role document
  const adminDocRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, "roles_admin", user.uid) : null, 
    [firestore, user]
  );
  
  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminDocRef);
  
  const isMasterAdminEmail = user?.email?.toLowerCase() === "admin@gmail.com";
  const hasAdminRecord = !!adminRole;
  
  // Only load data if we have confirmed admin status
  const canLoadData = !isUserLoading && !isAdminRoleLoading && hasAdminRecord;

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !canLoadData) return null;
    return query(collectionGroup(firestore, "bookings"));
  }, [firestore, user, canLoadData]);

  const adminsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !canLoadData) return null;
    return collection(firestore, "roles_admin");
  }, [firestore, user, canLoadData]);

  const { data: rawBookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);
  const { data: adminsList, isLoading: isAdminsLoading } = useCollection(adminsQuery);

  // Sort bookings client-side
  const bookings = useMemo(() => {
    if (!rawBookings) return [];
    return [...rawBookings].sort((a, b) => {
      const dateA = a.startDate || "";
      const dateB = b.startDate || "";
      return dateB.localeCompare(dateA);
    });
  }, [rawBookings]);

  const updateStatus = (userId: string, bookingId: string, status: string) => {
    if (!firestore) return;
    const bookingRef = doc(firestore, "users", userId, "bookings", bookingId);
    updateDocumentNonBlocking(bookingRef, { status });
    toast({
      title: `Booking ${status}`,
      description: `The reservation status has been updated to ${status}.`,
    });
  };

  const handleExportCSV = () => {
    if (!bookings.length) {
      toast({ title: "No data", description: "There are no bookings to export." });
      return;
    }
    const headers = ["Ref ID", "Guest Name", "Contact", "Item", "Start Date", "End Date", "Guests", "Status", "Total Price", "Created At"];
    const rows = bookings.map(b => [
      b.id?.slice(0, 8).toUpperCase() ?? "",
      b.guestName ?? "",
      b.contactNumber ?? "",
      b.itemName ?? "",
      b.startDate ?? "",
      b.endDate ?? "",
      b.guestCount ?? "",
      b.status ?? "",
      b.totalPrice ?? 0,
      b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `balatasan-bookings-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Exported!", description: `${bookings.length} booking(s) exported as CSV.` });
  };

  const handleInitializeAdmin = () => {
    if (!firestore || !user) return;
    setIsInitializing(true);
    const adminRef = doc(firestore, "roles_admin", user.uid);
    setDocumentNonBlocking(adminRef, { 
      email: user.email, 
      assignedAt: new Date().toISOString(),
      role: 'admin'
    }, { merge: true });
    
    toast({
      title: "Admin Initialized",
      description: "Database record created. You now have full administrative rights.",
    });
    setIsInitializing(false);
  };

  if (isUserLoading || isAdminRoleLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isMasterAdminEmail && !hasAdminRecord) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="max-w-md text-center border-none shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="pt-10 pb-6">
              <div className="mx-auto bg-destructive/10 p-6 rounded-full w-fit mb-4">
                <ShieldAlert className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-headline font-bold">Access Restricted</CardTitle>
              <CardDescription className="text-base px-4">
                You do not have administrative privileges to view this page. Please contact the system administrator.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10">
              <Button onClick={() => window.location.href = '/'} className="px-8 rounded-full">Return Home</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (isMasterAdminEmail && !hasAdminRecord) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="max-w-md text-center border-none shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="pt-10 pb-6">
              <div className="mx-auto bg-primary/10 p-6 rounded-full w-fit mb-4">
                <ShieldAlert className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl font-headline font-bold">Admin Setup Required</CardTitle>
              <CardDescription className="text-base">
                Welcome, {user?.email}. To access global data, you must first initialize your admin record.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10 px-8">
              <Button 
                onClick={handleInitializeAdmin} 
                disabled={isInitializing}
                className="w-full rounded-full h-12 text-lg font-bold"
              >
                {isInitializing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Initialize Admin Record
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const stats = [
    { label: "Total Bookings", value: bookings.length.toString(), icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pending", value: bookings.filter(b => b.status === "Pending Payment").length.toString(), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Admins", value: (adminsList?.length || 0).toString(), icon: UsersIcon, color: "text-emerald-600", bg: "bg-emerald-50" },
    { 
      label: "Revenue", 
      value: `₱${bookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0).toLocaleString()}`, 
      icon: TrendingUp, 
      color: "text-primary", 
      bg: "bg-primary/10" 
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pending Payment': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FBFB]">
      <Navbar />
      <main className="flex-grow container mx-auto py-12 px-4 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 font-medium">Manage reservations and monitor resort growth.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="rounded-full bg-white border-slate-200 text-slate-600 font-semibold shadow-sm" onClick={handleExportCSV}>
                Export Data
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white group hover:scale-[1.02] transition-transform duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-5">
                  <div className={cn("p-4 rounded-2xl transition-colors duration-300", stat.bg)}>
                    <stat.icon className={cn("h-7 w-7", stat.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="bookings" className="w-full space-y-6">
          <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-fit">
            <TabsTrigger value="bookings" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              Reservations
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              Administrators
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-headline font-bold text-slate-900">Recent Reservations</CardTitle>
                  <CardDescription className="text-slate-500 text-base">A complete list of guest activities and booking status.</CardDescription>
                </div>
                <div className="bg-primary/5 px-4 py-2 rounded-xl flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-primary">Live Updates</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isBookingsLoading ? (
                  <div className="flex justify-center py-24">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-24 text-slate-400 italic">
                    No bookings found in the system yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-none">
                          <TableHead className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px]">Guest Details</TableHead>
                          <TableHead className="py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px]">Experience</TableHead>
                          <TableHead className="py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px]">Booking Dates</TableHead>
                          <TableHead className="py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px]">Status</TableHead>
                          <TableHead className="py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px]">Amount</TableHead>
                          <TableHead className="pr-8 py-5 text-right font-bold text-slate-400 uppercase tracking-widest text-[11px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow key={booking.id} className="hover:bg-slate-50/40 transition-colors border-slate-50 group">
                            <TableCell className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                  <User className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{booking.guestName}</div>
                                  <div className="text-xs text-slate-400 font-medium">{booking.contactNumber || "No contact provided"}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-6">
                               <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-primary/50" />
                                  <span className="font-semibold text-slate-700">{booking.itemName}</span>
                               </div>
                            </TableCell>
                            <TableCell className="py-6">
                              <div className="flex flex-col gap-0.5">
                                 <div className="text-[13px] font-bold text-slate-700">{booking.startDate}</div>
                                 {booking.endDate !== booking.startDate && (
                                   <div className="text-[11px] text-slate-400 font-medium italic">to {booking.endDate}</div>
                                 )}
                              </div>
                            </TableCell>
                            <TableCell className="py-6">
                              <Badge 
                                className={cn(
                                  "px-3 py-1 rounded-full text-[11px] font-bold border shadow-sm",
                                  getStatusColor(booking.status)
                                )}
                              >
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-6">
                              <div className="font-headline font-bold text-primary text-lg">
                                ₱{booking.totalPrice?.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell className="pr-8 py-6 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-100"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl p-2 min-w-[160px]">
                                  <DropdownMenuItem 
                                    onClick={() => updateStatus(booking.userId, booking.id, "Confirmed")}
                                    className="rounded-lg py-2.5 cursor-pointer"
                                  >
                                    <Check className="mr-3 h-4 w-4 text-emerald-600" /> 
                                    <span className="font-semibold">Confirm Booking</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => updateStatus(booking.userId, booking.id, "Cancelled")}
                                    className="rounded-lg py-2.5 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                                  >
                                    <X className="mr-3 h-4 w-4" /> 
                                    <span className="font-semibold">Cancel Request</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-slate-50">
                <CardTitle className="text-2xl font-headline font-bold text-slate-900">Administrator Overview</CardTitle>
                <CardDescription className="text-slate-500 text-base">Authorized users with system-level access.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isAdminsLoading ? (
                  <div className="flex justify-center py-24">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-none">
                        <TableHead className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px]">Admin Email</TableHead>
                        <TableHead className="py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px]">Assigned Date</TableHead>
                        <TableHead className="py-5 font-bold text-slate-400 uppercase tracking-widest text-[11px]">Role</TableHead>
                        <TableHead className="pr-8 py-5 text-right font-bold text-slate-400 uppercase tracking-widest text-[11px]">ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminsList?.map((adm) => (
                        <TableRow key={adm.id} className="hover:bg-slate-50/40 transition-colors border-slate-50">
                          <TableCell className="px-8 py-6 font-semibold text-slate-700">{adm.email}</TableCell>
                          <TableCell className="py-6 text-slate-500">{adm.assignedAt ? new Date(adm.assignedAt).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="py-6">
                            <Badge className="bg-primary/10 text-primary border-none font-bold uppercase tracking-widest text-[10px] px-3 py-1">
                              {adm.role || 'Admin'}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-8 py-6 text-right font-mono text-[11px] text-slate-300">{adm.id}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}