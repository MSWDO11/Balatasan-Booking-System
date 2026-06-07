
'use client';

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, Users, Wind, Wifi, Coffee, MapPin, Star, Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser, useFirestore, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { useState, use, useCallback } from "react";

const FALLBACK_ROOM_IMAGE = "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=80";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, differenceInDays } from "date-fns";

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
  const [roomImgSrc, setRoomImgSrc] = useState<string | null>(null);

  const roomRef = useMemoFirebase(() => firestore ? doc(firestore, "rooms", id) : null, [firestore, id]);
  const { data: room, isLoading: isRoomLoading } = useDoc(roomRef);

  const nights = checkIn && checkOut ? Math.max(0, differenceInDays(checkOut, checkIn)) : 0;
  const guestCount = parseInt(guests);
  const maxCapacity = room?.capacity ? parseInt(room.capacity.toString()) : 10;
  
  // Calculate total price: Per person per night
  const ratePerPerson = room?.pricePerPerson || room?.price || 0;
  const totalPrice = ratePerPerson * guestCount * (nights || 1);

  const handleBookNow = () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!room || !firestore || !checkIn || !checkOut || nights <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Booking",
        description: "Please ensure your check-out date is after your check-in date.",
      });
      return;
    }

    setIsBooking(true);
    
    const bookingData = {
      userId: user.uid,
      itemId: room.id,
      itemName: room.name,
      startDate: format(checkIn, "yyyy-MM-dd"),
      endDate: format(checkOut, "yyyy-MM-dd"),
      status: "Pending Payment",
      totalPrice: totalPrice,
      guestCount: guestCount,
      guestName: user.displayName || user.email?.split('@')[0] || "Guest",
      contactNumber: "Not provided",
      createdAt: new Date().toISOString()
    };

    const bookingsRef = collection(firestore, "users", user.uid, "bookings");
    
    addDocumentNonBlocking(bookingsRef, bookingData)
      .then(() => {
        toast({
          title: "Booking Requested!",
          description: "Please check 'My Bookings' for payment instructions to confirm your stay.",
        });
        router.push("/my-bookings");
      })
      .finally(() => setIsBooking(false));
  };

  if (isRoomLoading) {
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

  if (!room) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center space-y-4">
          <h2 className="text-2xl font-bold">Cottage not found</h2>
          <Button onClick={() => router.push("/accommodations")}>Back to Cottages</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="container mx-auto py-10 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src={roomImgSrc ?? (room.imageUrl || FALLBACK_ROOM_IMAGE)}
                  alt={room.name || "Cottage image"}
                  fill
                  className="object-cover"
                  onError={() => setRoomImgSrc(FALLBACK_ROOM_IMAGE)}
                />
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h1 className="text-4xl font-headline font-bold text-primary">{room.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Balatasan, Bulalacao</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-accent/10 text-accent-foreground px-3 py-1.5 rounded-full font-bold">
                    <Star className="h-4 w-4 fill-current" />
                    <span>4.9 (New)</span>
                  </div>
                </div>

                <div className="flex gap-6 py-4 border-y">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Users className="h-6 w-6 text-primary" />
                    <span className="text-xs font-medium">Max {maxCapacity} Guests</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Wind className="h-6 w-6 text-primary" />
                    <span className="text-xs font-medium">AC</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Wifi className="h-6 w-6 text-primary" />
                    <span className="text-xs font-medium">Free WiFi</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <Coffee className="h-6 w-6 text-primary" />
                    <span className="text-xs font-medium">Breakfast</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-headline font-bold">Description</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {room.description}
                  </p>
                </div>

                <Alert className="bg-primary/5 border-primary/20">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary font-bold">Payment Information</AlertTitle>
                  <AlertDescription className="text-sm text-muted-foreground">
                    To finalize your booking, a 50% downpayment is required via G-Cash or Bank Transfer. Our team will contact you with account details once you click "Reserve & Pay Later".
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-none shadow-2xl bg-white/50 backdrop-blur">
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-bold text-primary">₱{(ratePerPerson).toLocaleString()}</span>
                    <span className="text-muted-foreground font-medium">/ person / night</span>
                  </div>

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
                          <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus disabled={(date) => date < new Date()} />
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
                          <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus disabled={(date) => (checkIn ? date <= checkIn : date < new Date())} />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 ml-1 mb-1">
                        How many guests
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
                    </div>
                  </div>

                  <Button 
                    className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={isBooking || nights <= 0}
                    onClick={handleBookNow}
                  >
                    {isBooking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reserve & Pay Later"}
                  </Button>

                  <div className="space-y-3 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        ₱{ratePerPerson.toLocaleString()} × {guestCount} {guestCount === 1 ? 'guest' : 'guests'} × {nights} {nights === 1 ? 'night' : 'nights'}
                      </span>
                      <span className="font-semibold">₱{totalPrice.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary font-bold">₱{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 text-[10px] text-muted-foreground">
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
