"use client";

import { SmartNavbar } from "@/components/smart-navbar";
import { Footer } from "@/components/footer";
import { RoomCard } from "@/components/room-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AccommodationsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "rooms");
  }, [firestore]);

  const { data: rooms, isLoading: isRoomsLoading } = useCollection(roomsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SmartNavbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SmartNavbar />
      <main className="flex-grow">
        <section className="bg-primary/5 py-16">
          <div className="container mx-auto px-4 text-center space-y-4">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Our Cottages</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from our selection of native-inspired floating cottages and eco-friendly tents. Each designed to connect you with nature.
            </p>
          </div>
        </section>

        <section className="border-y bg-background py-4 sticky top-16 z-40">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search cottages..." className="pl-10" />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
              <Button className="flex-1 md:flex-none">Search Availability</Button>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            {isRoomsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : rooms && rooms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {rooms.map(room => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <p>Explore our beautiful floating cottages above or search for availability.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

