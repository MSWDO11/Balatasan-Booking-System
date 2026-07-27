"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { TourCard } from "@/components/tour-card";
import { Input } from "@/components/ui/input";
import { Search, Compass, Loader2 } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function ToursPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");

  const toursQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "tours");
  }, [firestore]);

  const { data: allTours, isLoading: isToursLoading } = useCollection(toursQuery);

  const islandHopping = useMemo(() => 
    allTours?.filter(t => t.category === "island-hopping") || [], 
  [allTours]);

  const waterActivities = useMemo(() => 
    allTours?.filter(t => t.category === "water-activities") || [], 
  [allTours]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
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

  const showIslandHopping = !activeCategory || activeCategory === "island-hopping";
  const showWaterActivities = !activeCategory || activeCategory === "water-activities";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-primary/5 py-16">
          <div className="container mx-auto px-4 text-center space-y-4">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
              {activeCategory === "island-hopping" ? "Island Hopping" : 
               activeCategory === "water-activities" ? "Water Activities" : 
               "Island Hopping & Water Activities"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore the untouched beauty of Mindoro with our expert-led tours. From crystal lagoons to turquoise water adventures.
            </p>
          </div>
        </section>

        <section className="border-y bg-background py-4 sticky top-16 z-40">
          <div className="container mx-auto px-4 flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search experiences..." className="pl-10" />
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 space-y-16">
            {isToursLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {showIslandHopping && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold font-headline text-primary">Island Hopping</h2>
                      <div className="h-px flex-grow bg-primary/10" />
                    </div>
                    {islandHopping.length === 0 ? (
                      <p className="text-muted-foreground text-center py-10">No island hopping tours found.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {islandHopping.map(tour => (
                          <TourCard key={tour.id} tour={tour} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {showWaterActivities && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold font-headline text-primary">Water Activities</h2>
                      <div className="h-px flex-grow bg-primary/10" />
                    </div>
                    {waterActivities.length === 0 ? (
                      <p className="text-muted-foreground text-center py-10">No water activities found.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {waterActivities.map(tour => (
                          <TourCard key={tour.id} tour={tour} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4 text-center space-y-6 max-w-2xl border border-primary/20 rounded-3xl p-12 bg-white/50 backdrop-blur">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
              <Compass className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-headline text-bold">Can't decide?</h2>
            <p className="text-muted-foreground">
              Talk to our local guides to customize your own Mindoro adventure. We can combine multiple tours or create a unique itinerary just for you.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
