'use client';

import { SmartNavbar } from "@/components/smart-navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Star, Loader2, CreditCard, ShieldCheck, Tag, TrendingDown, ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { ReviewSection } from "@/components/review-section";
import { useCollection } from "@/firebase";
import { query, orderBy } from "firebase/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { useUser, useFirestore, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { doc, collection, collectionGroup, query as fsQuery, where } from "firebase/firestore";
import { useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, differenceInDays } from "date-fns";
import { calculatePrice } from "@/lib/pricing";

export default function RoomDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isBooking, setIsBooking] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | undefined>(new Date());
  const [checkOut, setCheckOut] = useState<Date | undefined>(addDays(new Date(), 1));
  const [guests, setGuests] = useState("1");
  const [contactNumber, setContactNumber] = useState("");
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const roomRef = useMemoFirebase(() => firestore ? doc(firestore, "rooms", id) : null, [firestore, id]);
  const { data: room, isLoading: isRoomLoading } = useDoc(roomRef);

  // Load confirmed bookings for this room to disable booked dates
  const allBookingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    try {
      return fsQuery(
        collectionGroup(firestore, "bookings"),
        where("itemId", "==", id),
        where("status", "in", ["Confirmed", "Pending Payment", "Payment Uploaded"])
      );
    } catch { return null; }
  }, [firestore, id]);
  const { data: existingBookings } = useCollection(allBookingsQuery);

  // Build a Set of booked date strings "yyyy-MM-dd"
  const bookedDates = useMemo(() => {
    const dates = new Set<string>();
    existingBookings?.forEach((b: any) => {
      if (b.startDate && b.endDate) {
        const start = new Date(b.startDate + "T00:00:00");
        const end = new Date(b.endDate + "T00:00:00");
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.add(d.toISOString().slice(0, 10));
        }
      }
    });
    return dates;
  }, [existingBookings]);
  const reviewsRef = useMemoFirebase(() => firestore ? collection(firestore, "reviews", `room_${id}`, "entries") : null, [firestore, id]);
  const reviewsQuery = useMemoFirebase(() => reviewsRef ? query(reviewsRef, orderBy("createdAt", "desc")) : null, [reviewsRef]);
  const { data: reviews } = useCollection(reviewsQuery);
  const avgRating = reviews?.length ? (reviews.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / reviews.length) : 0;
  const reviewCount = reviews?.length ?? 0;

  // Load GCash settings so the payment alert stays in sync with admin settings
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, "settings", "payment") : null, [firestore]);
  const { data: paymentSettings } = useDoc(settingsRef);
  const gcashNumber = paymentSettings?.gcashNumber || "0912-345-6789";
  const gcashName = paymentSettings?.gcashName || "Balatasan Resort";

  const nights = checkIn && checkOut ? Math.max(0, differenceInDays(checkOut, checkIn)) : 0;
  const guestCount = parseInt(guests);
  const maxCapacity = room?.capacity ? parseInt(room.capacity.toString()) : 10;
  const ratePerPerson = room?.pricePerPerson || room?.price || 0;
  // Apply item-level discount if admin set one
  const itemDiscount = room?.discountPercent > 0 ? (1 - room.discountPercent / 100) : 1;
  const effectiveRate = Math.round(ratePerPerson * itemDiscount);

  const pricing = calculatePrice({
    baseRate: effectiveRate,
    guestCount,
    nights: Math.max(nights, 1),
    date: checkIn,
  });

  const handleBookNow = () => {
    if (!user) { router.push("/login"); return; }
    if (!room || !firestore || !checkIn || !checkOut || nights <= 0) {
      toast({ variant: "destructive", title: "Invalid Booking", description: "Check-out must be after check-in." });
      return;
    }
    setIsBooking(true);
    const bookingData = {
      userId: user.uid,
      itemId: room.id,
      itemName: room.name,
      itemType: "room",
      startDate: format(checkIn, "yyyy-MM-dd"),
      endDate: format(checkOut, "yyyy-MM-dd"),
      status: "Pending Payment",
      totalPrice: pricing.finalPrice,
      originalPrice: pricing.basePrice,
      guestCount,
      guestName: user.displayName || user.email?.split('@')[0] || "Guest",
      guestEmail: user.email || "",
      contactNumber: contactNumber.trim() || "Not provided",
      seasonApplied: null,
      groupDiscountApplied: pricing.groupDiscountInfo?.label || null,
      createdAt: new Date().toISOString(),
    };
    addDocumentNonBlocking(collection(firestore, "users", user.uid, "bookings"), bookingData)
      .then(() => {
        router.push("/my-bookings?booked=1");
      })
      .finally(() => setIsBooking(false));
  };

  if (isRoomLoading) return (
    <div className="flex min-h-screen flex-col"><SmartNavbar />
      <main className="flex-grow py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-[400px] rounded-3xl bg-slate-200 animate-pulse" />
              <div className="space-y-3">
                <div className="h-8 w-64 rounded-xl bg-slate-200 animate-pulse" />
                <div className="h-4 w-48 rounded-lg bg-slate-100 animate-pulse" />
                <div className="h-4 w-full rounded-lg bg-slate-100 animate-pulse" />
                <div className="h-4 w-5/6 rounded-lg bg-slate-100 animate-pulse" />
                <div className="h-4 w-4/6 rounded-lg bg-slate-100 animate-pulse" />
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="rounded-3xl border p-8 space-y-4">
                <div className="h-10 w-32 rounded-xl bg-slate-200 animate-pulse" />
                <div className="h-px bg-slate-100" />
                <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
                <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
                <div className="h-12 w-full rounded-2xl bg-primary/20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </main>
    <Footer /></div>
  );

  if (!room) return (
    <div className="flex min-h-screen flex-col"><SmartNavbar />
      <main className="flex-grow flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold">Cottage not found</h2>
        <Button onClick={() => router.push("/accommodations")}>Back to Cottages</Button>
      </main>
    <Footer /></div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SmartNavbar />
      <main className="flex-grow">
        <section className="container mx-auto py-10 px-4">
          {/* Back to My Bookings */}
          {user && (
            <button
              onClick={() => router.push("/my-bookings")}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors mb-6 group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to My Bookings
            </button>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src={imgSrc ?? (room.imageUrl || "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80")}
                  alt={room.name || "Cottage"}
                  fill className="object-cover"
                  onError={() => setImgSrc("https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80")}
                  unoptimized={room.imageUrl?.startsWith("data:")}
                />
              </div>
              <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h1 className="text-4xl font-headline font-bold text-primary">{room.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" /><span>Balatasan, Bulalacao</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-accent/10 text-accent-foreground px-3 py-1.5 rounded-full font-bold">
                    <Star className="h-4 w-4 fill-current text-amber-400" />
                    <span>{reviewCount > 0 ? `${avgRating.toFixed(1)} (${reviewCount})` : "New"}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-headline font-bold">Description</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{room.description}</p>
                  {Array.isArray(room.includedItems) && room.includedItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">What&apos;s Included</h4>
                      <ul className="grid grid-cols-2 gap-1.5">
                        {room.includedItems.map((item: string) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                            <span className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(room.tags) && room.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {room.tags.map((tag: string) => (
                        <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Package Deals Info */}
                <div className="p-5 bg-primary/5 rounded-2xl border border-primary/15 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-primary text-sm">
                    <Tag className="h-4 w-4" /> Available Package Deals
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge className="bg-primary/10 text-primary border-none text-xs">Save 10%</Badge>
                      <span>Staycation Bundle — Book cottage + island hopping tour</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge className="bg-primary/10 text-primary border-none text-xs">Save 15%</Badge>
                      <span>Adventure Package — Book cottage + 2 water activities</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Contact us after booking to apply package discounts.</p>
                </div>

                <Alert className="bg-primary/5 border-primary/20">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary font-bold">Payment Information</AlertTitle>
                  <AlertDescription className="text-sm text-muted-foreground">
                    50% downpayment via G-Cash: <strong>{gcashNumber} ({gcashName})</strong>. Upload receipt in My Bookings to confirm.
                  </AlertDescription>
                </Alert>

                {/* Ratings & Reviews */}
                <ReviewSection itemId={id} itemType="room" itemName={room.name} />
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-none shadow-2xl">
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between items-baseline">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-primary">₱{effectiveRate.toLocaleString()}</span>
                        {room.discountPercent > 0 && (
                          <span className="text-xs bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">{room.discountPercent}% OFF</span>
                        )}
                      </div>
                      {room.discountPercent > 0 && (
                        <p className="text-xs text-muted-foreground line-through">was ₱{ratePerPerson.toLocaleString()}</p>
                      )}
                    </div>
                    <span className="text-muted-foreground font-medium">/ person / night</span>
                  </div>

                  {/* No seasonal badge — pricing is set directly by admin in inventory */}

                  <Separator />

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 border rounded-xl overflow-hidden bg-background/50">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-3 border-r text-left hover:bg-accent/5 transition-colors">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">Check-in</label>
                            <p className="text-sm font-semibold">{checkIn ? format(checkIn, "MMM dd") : "Select"}</p>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus
                            disabled={(d) => d < new Date() || bookedDates.has(d.toISOString().slice(0,10))} />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-3 text-left hover:bg-accent/5 transition-colors">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">Check-out</label>
                            <p className="text-sm font-semibold">{checkOut ? format(checkOut, "MMM dd") : "Select"}</p>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus
                            disabled={(d) => (checkIn ? d <= checkIn : d < new Date()) || bookedDates.has(d.toISOString().slice(0,10))} />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Select value={guests} onValueChange={setGuests}>
                      <SelectTrigger className="w-full h-12 font-semibold">
                        <SelectValue placeholder="Guests" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: maxCapacity }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? "guest" : "guests"}{num >= 10 ? " 🎉" : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Group discount badge */}
                    {pricing.groupDiscountInfo && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs font-semibold text-green-700">
                        <TrendingDown className="h-3.5 w-3.5" />
                        {pricing.groupDiscountInfo.label}
                      </div>
                    )}

                    {/* Contact number */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block">Contact Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. 09XX-XXX-XXXX"
                        value={contactNumber}
                        onChange={e => setContactNumber(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>

                  </div>

                  <Button className="w-full" size="lg" disabled={isBooking || nights <= 0} onClick={handleBookNow}>
                    {isBooking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reserve & Pay Later"}
                  </Button>

                  <div className="space-y-2 pt-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Base: ₱{effectiveRate.toLocaleString()} × {guestCount} × {Math.max(nights,1)}n</span>
                      <span>₱{pricing.basePrice.toLocaleString()}</span>
                    </div>
                    {pricing.groupDiscountInfo && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Group discount ({pricing.groupDiscountInfo.discountPercent}%)</span>
                        <span>-₱{(pricing.afterSeasonal - pricing.finalPrice).toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">₱{pricing.finalPrice.toLocaleString()}</span>
                    </div>
                    {pricing.savings > 0 && (
                      <div className="text-center text-xs text-green-600 font-semibold">
                        🎉 You save ₱{pricing.savings.toLocaleString()}!
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    Secure Booking • No Cancellation Fee
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
