'use client';

import { SmartNavbar } from "@/components/smart-navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, Users, Shield, MapPin, Star, Calendar as CalendarIcon, Loader2, CreditCard, ShieldCheck, Tag, TrendingDown } from "lucide-react";
import { Spinner } from "@/components/spinner";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser, useFirestore, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { calculatePrice } from "@/lib/pricing";

export default function TourDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isBooking, setIsBooking] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [guests, setGuests] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("15");
  const [tourImgSrc, setTourImgSrc] = useState<string | null>(null);

  const tourRef = useMemoFirebase(() => firestore ? doc(firestore, "tours", id) : null, [firestore, id]);
  const { data: tour, isLoading: isTourLoading } = useDoc(tourRef);

  const displayTitle = tour?.name || tour?.title || "";
  const isFlyingFish = displayTitle.toLowerCase().includes("flying fish");
  const isJetSki = displayTitle.toLowerCase().includes("jet ski");
  
  const individualRate = tour?.pricePerPerson ?? (isJetSki ? 150 : (isFlyingFish ? 500 : 1000));
  // Apply admin-set item discount if present
  const itemDiscount = tour?.discountPercent > 0 ? (1 - tour.discountPercent / 100) : 1;
  const effectiveRate = Math.round(individualRate * itemDiscount);
  const guestCount = parseInt(guests);
  const minutes = parseInt(durationMinutes);
  const maxCapacity = tour?.capacity ? parseInt(tour.capacity.toString()) : (isFlyingFish ? 3 : (isJetSki ? 2 : 10));

  const pricing = calculatePrice({
    baseRate: effectiveRate,
    guestCount,
    nights: 1,
    date,
    isPerMinute: isJetSki,
    minutes,
  });

  const handleBookTour = () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!tour || !firestore || !date) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a valid date for your adventure.",
      });
      return;
    }

    setIsBooking(true);
    
    const bookingData = {
      userId: user.uid,
      itemId: tour.id,
      itemName: tour.name || tour.title,
      itemType: "tour",
      startDate: format(date, "yyyy-MM-dd"),
      endDate: format(date, "yyyy-MM-dd"),
      status: "Pending Payment",
      totalPrice: totalPrice,
      originalPrice: totalPrice,
      guestCount: guestCount,
      duration: isJetSki ? `${minutes} Minutes` : (tour.duration || "Custom"),
      guestName: user.displayName || user.email?.split('@')[0] || "Guest",
      contactNumber: "Not provided",
      seasonApplied: pricing.seasonInfo?.label || null,
      groupDiscountApplied: pricing.groupDiscountInfo?.label || null,
      createdAt: new Date().toISOString()
    };

    const bookingsRef = collection(firestore, "users", user.uid, "bookings");
    
    addDocumentNonBlocking(bookingsRef, bookingData)
      .then(() => {
        toast({
          title: "Adventure Requested!",
          description: isJetSki 
            ? `Your ${minutes}-minute Jet Ski ride is requested. Check 'My Bookings' for payment.`
            : "Please check 'My Bookings' for G-Cash payment instructions.",
        });
        router.push("/my-bookings");
      })
      .finally(() => setIsBooking(false));
  };

  if (isTourLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SmartNavbar />
        <main className="flex-grow flex items-center justify-center">
          <Spinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="flex min-h-screen flex-col">
        <SmartNavbar />
        <main className="flex-grow flex flex-col items-center justify-center space-y-4">
          <h2 className="text-2xl font-bold">Experience not found</h2>
          <Button onClick={() => router.push("/tours")}>Back to Tours</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SmartNavbar />
      <main className="flex-grow">
        <section className="container mx-auto py-10 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src={tour.imageUrl || PlaceHolderImages.find(img => img.id === "island-hopping")?.imageUrl || ""}
                  alt={(tour.name || tour.title) ?? "Tour image"}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h1 className="text-4xl font-headline font-bold text-primary">{tour.name || tour.title}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{tour.location || "Bulalacao, Oriental Mindoro"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-accent/10 text-accent-foreground px-3 py-1.5 rounded-full font-bold">
                    <Star className="h-4 w-4 fill-current" />
                    <span>5.0 (New)</span>
                  </div>
                </div>

                <div className="flex gap-8 py-4 border-y">
                  <div className="flex flex-col items-center gap-1">
                    <Clock className="h-6 w-6 text-primary" />
                    <span className="text-xs font-medium">{isJetSki ? `${minutes} mins` : (tour.duration || "Custom")}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Users className="h-6 w-6 text-primary" />
                    <span className="text-xs font-medium">Max {maxCapacity} Guests</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Shield className="h-6 w-6 text-primary" />
                    <span className="text-xs font-medium">Insured</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-headline font-bold">About this Experience</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {tour.description}
                  </p>
                  {Array.isArray(tour.includedItems) && tour.includedItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">What&apos;s Included</h4>
                      <ul className="grid grid-cols-2 gap-1.5">
                        {tour.includedItems.map((item: string) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                            <span className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(tour.tags) && tour.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tour.tags.map((tag: string) => (
                        <span key={tag} className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                <Alert className="bg-primary/5 border-primary/20 rounded-2xl">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary font-bold">Payment Instructions</AlertTitle>
                  <AlertDescription className="text-sm text-muted-foreground">
                    Full payment or 50% reservation fee is accepted via G-Cash or Bank Deposit. Upload your proof of payment in your dashboard to confirm.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-none shadow-2xl bg-white/50 backdrop-blur">
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between items-baseline">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-primary">₱{effectiveRate.toLocaleString()}</span>
                        {tour.discountPercent > 0 && (
                          <span className="text-xs bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">{tour.discountPercent}% OFF</span>
                        )}
                      </div>
                      {tour.discountPercent > 0 && (
                        <p className="text-xs text-muted-foreground line-through">was ₱{individualRate.toLocaleString()}</p>
                      )}
                    </div>
                    <span className="text-muted-foreground font-medium">{isJetSki ? "/ minute" : "/ person"}</span>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 ml-1">
                        Select Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full h-12 justify-start text-left font-semibold rounded-xl bg-background/50 border-primary/20",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {isJetSki ? (
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 ml-1 mb-1">
                          Select Duration
                        </label>
                        <Select value={durationMinutes} onValueChange={setDurationMinutes}>
                          <SelectTrigger className="w-full h-12 font-semibold rounded-2xl bg-background/50 border-2 border-primary">
                            <SelectValue placeholder="15 Minutes" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="15">15 Minutes (₱{(effectiveRate * 15).toLocaleString()})</SelectItem>
                            <SelectItem value="30">30 Minutes (₱{(effectiveRate * 30).toLocaleString()})</SelectItem>
                            <SelectItem value="60">60 Minutes (₱{(effectiveRate * 60).toLocaleString()})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 ml-1 mb-1">
                          Number of guests
                        </label>
                        <Select value={guests} onValueChange={setGuests}>
                          <SelectTrigger className="w-full h-12 font-semibold rounded-2xl bg-background/50 border-2 border-primary focus:ring-primary focus:border-primary px-4">
                            <SelectValue placeholder="1" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-primary/10 shadow-xl">
                            {Array.from({ length: maxCapacity }, (_, i) => i + 1).map((num) => (
                              <SelectItem 
                                key={num} 
                                value={num.toString()} 
                                className="focus:bg-primary focus:text-white rounded-md m-1 py-2 cursor-pointer transition-colors"
                              >
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground px-1">
                          Maximum {maxCapacity} guests allowed.
                        </p>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full" size="lg"
                    disabled={isBooking}
                    onClick={handleBookTour}
                  >
                    {isBooking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Book Adventure"}
                  </Button>

                  {/* No seasonal badge — pricing is set directly by admin in inventory */}
                  {pricing.groupDiscountInfo && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs font-semibold text-green-700">
                      <TrendingDown className="h-3.5 w-3.5" />
                      {pricing.groupDiscountInfo.label}
                    </div>
                  )}

                  <div className="space-y-3 pt-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {isJetSki
                          ? `₱${effectiveRate.toLocaleString()} × ${minutes} min`
                          : `₱${effectiveRate.toLocaleString()} × ${guestCount} ${guestCount === 1 ? 'person' : 'people'}`
                        }
                      </span>
                      <span>₱{pricing.basePrice.toLocaleString()}</span>
                    </div>
                    {pricing.groupDiscountInfo && (
                      <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>Group discount ({pricing.groupDiscountInfo.discountPercent}%)</span>
                        <span>-₱{(pricing.afterSeasonal - pricing.finalPrice).toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary font-bold">₱{pricing.finalPrice.toLocaleString()}</span>
                    </div>
                    {pricing.savings > 0 && (
                      <div className="text-center text-xs text-green-600 font-semibold">
                        🎉 You save ₱{pricing.savings.toLocaleString()}!
                      </div>
                    )}
                  </div>

                  <div className="bg-accent/10 p-4 rounded-xl space-y-2 border border-accent/20">
                    <p className="text-[10px] font-semibold text-accent-foreground flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-primary" /> Safe Booking Guarantee
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Full refund if cancelled at least 24 hours before the tour starts. 
                    </p>
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