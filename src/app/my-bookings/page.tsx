
"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useUser, useCollection, useMemoFirebase, useFirestore, updateDocumentNonBlocking, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Loader2, ShoppingBag, ChevronRight, CreditCard, Clock, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

export default function MyBookingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);

  // Load payment settings from Firestore — admin can update gcashNumber there
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, "settings", "payment") : null, [firestore]);
  const { data: paymentSettings } = useDoc(settingsRef);
  const gcashNumber = paymentSettings?.gcashNumber || "0912-345-6789";
  const gcashName = paymentSettings?.gcashName || "Balatasan Resort";

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "bookings"),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user]);

  const { data: bookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);

  const handleFileUpload = (bookingId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!firestore || !user || !event.target.files?.[0]) return;
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const bookingRef = doc(firestore, "users", user.uid, "bookings", bookingId);
      updateDocumentNonBlocking(bookingRef, {
        paymentImageUrl: base64String,
        status: "Payment Uploaded",
      });
      toast({ title: "Receipt uploaded!", description: "Admin will verify and confirm your booking." });
    };
    reader.readAsDataURL(file);
  };

  const handleCancelBooking = (bookingId: string) => {
    if (!firestore || !user) return;
    updateDocumentNonBlocking(doc(firestore, "users", user.uid, "bookings", bookingId), { status: "Cancelled" });
    toast({ title: "Booking Cancelled", description: "Your booking has been cancelled." });
    setCancelBookingId(null);
  };

  if (isUserLoading || (user && isBookingsLoading)) {
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

  return (
    <div className="flex min-h-screen flex-col bg-secondary/10">
      <Navbar />
      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelBookingId} onOpenChange={() => setCancelBookingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Cancel Booking?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to cancel this booking? This action cannot be undone.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setCancelBookingId(null)} className="flex-1">Keep Booking</Button>
            <Button onClick={() => cancelBookingId && handleCancelBooking(cancelBookingId)} className="flex-1 bg-rose-500 hover:bg-rose-600 border-rose-500">Yes, Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
      <main className="flex-grow container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary">My Bookings</h1>
              <p className="text-muted-foreground">Manage your upcoming resort experiences and payments.</p>
            </div>
          </div>

          {!bookings || bookings.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <ShoppingBag className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">No bookings found</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    You haven't made any reservations yet. Explore our tropical cottages and island tours!
                  </p>
                </div>
                <div className="flex gap-4 pt-4">
                  <Link href="/accommodations">
                    <Button>Browse Cottages</Button>
                  </Link>
                  <Link href="/tours">
                    <Button variant="outline">Explore Adventures</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {bookings.map((booking: any) => (
                <Card key={booking.id} className="overflow-hidden border-none shadow-sm bg-white rounded-2xl">
                  <CardContent className="p-0 flex flex-col md:flex-row">
                    <div className="p-8 flex-grow space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-none font-semibold mb-2 px-3 py-1 rounded-full">
                            {booking.status}
                          </Badge>
                          <h3 className="text-2xl font-bold font-headline text-foreground">{booking.itemName}</h3>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Ref: {booking.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Total Price</p>
                          <p className="text-2xl font-bold text-primary">₱{booking.totalPrice?.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/5 p-3 rounded-2xl">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-foreground">Date</p>
                            <p className="text-sm text-muted-foreground">{booking.startDate} {booking.endDate !== booking.startDate ? `to ${booking.endDate}` : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/5 p-3 rounded-2xl">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-foreground">Guests</p>
                            <p className="text-sm text-muted-foreground">{booking.guestCount} {booking.guestCount === 1 ? 'Person' : 'People'}</p>
                          </div>
                        </div>
                      </div>

                      {booking.status === "Pending Payment" && (
                        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-widest">
                            <CreditCard className="h-4 w-4" /> 
                            Action Required: Payment
                          </div>
                          <p className="text-xs text-amber-700 leading-relaxed font-medium">
                            Send your payment to <strong>G-Cash: {gcashNumber} ({gcashName})</strong>. After paying, please upload your receipt below to confirm.
                          </p>
                          <div className="flex justify-center my-2">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=GCASH:${gcashNumber.replace(/-/g, "")}`} alt="GCash QR" className="rounded-xl border shadow-sm" width={120} height={120} />
                          </div>
                          <div className="pt-2 flex flex-col sm:flex-row gap-4">
                            <div className="relative">
                              <input 
                                type="file" 
                                id={`payment-${booking.id}`} 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => handleFileUpload(booking.id, e)}
                              />
                              <label 
                                htmlFor={`payment-${booking.id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-amber-800 cursor-pointer hover:bg-amber-100 transition-colors shadow-sm"
                              >
                                <ImageIcon className="h-4 w-4" />
                                {booking.paymentImageUrl ? "Update Proof" : "Upload Proof of Payment"}
                              </label>
                            </div>
                            {booking.paymentImageUrl && (
                              <div className="flex items-center gap-2 text-xs font-bold text-green-700">
                                <CheckCircle className="h-4 w-4" />
                                Uploaded
                              </div>
                            )}
                            <button
                              onClick={() => setCancelBookingId(booking.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-rose-600 cursor-pointer hover:bg-rose-50 transition-colors shadow-sm"
                            >
                              <XCircle className="h-4 w-4" />
                              Cancel Booking
                            </button>
                          </div>
                        </div>
                      )}

                      {booking.paymentImageUrl && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your Proof of Payment</p>
                          <div className="relative w-full max-w-[150px] aspect-square rounded-xl overflow-hidden border shadow-sm">
                            <Image 
                              src={booking.paymentImageUrl} 
                              alt="Proof of payment" 
                              fill 
                              className="object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="md:w-32 flex items-center justify-center border-t md:border-t-0 md:border-l border-secondary/20 bg-white group cursor-pointer hover:bg-secondary/5 transition-colors">
                      <div className="flex flex-col items-center gap-3 py-8 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-foreground leading-tight">View</span>
                          <span className="text-sm font-bold text-foreground leading-tight">Details</span>
                        </div>
                        <ChevronRight className="h-6 w-6 text-primary transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
