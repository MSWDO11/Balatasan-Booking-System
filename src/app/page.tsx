"use client";

import { SmartNavbar } from "@/components/smart-navbar";
import { Footer } from "@/components/footer";
import { RoomCard } from "@/components/room-card";
import { TourCard } from "@/components/tour-card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, Loader2, Waves, Anchor } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, limit, query, where } from "firebase/firestore";

/* -------------------------------------------------------
   Reusable wave SVG divider
   fillColor: the colour of the section BELOW the wave
   ------------------------------------------------------- */
function WaveDivider({
  fillColor = "#ffffff",
  flipY = false,
}: {
  fillColor?: string;
  flipY?: boolean;
}) {
  return (
    <div
      className="wave-divider"
      style={{ transform: flipY ? "scaleY(-1)" : undefined }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 80"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ height: 80 }}
      >
        <path
          d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
          fill={fillColor}
        />
      </svg>
    </div>
  );
}

export default function Home() {
  const firestore = useFirestore();
  const heroImage = PlaceHolderImages.find((img) => img.id === "hero-beach");

  const featuredRoomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "rooms"), limit(2));
  }, [firestore]);

  const islandHoppingQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "tours"),
      where("category", "==", "island-hopping"),
      limit(3)
    );
  }, [firestore]);

  const waterActivitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "tours"),
      where("category", "==", "water-activities"),
      limit(3)
    );
  }, [firestore]);

  const { data: featuredRooms, isLoading: roomsLoading } =
    useCollection(featuredRoomsQuery);
  const { data: islandHopping, isLoading: islandLoading } =
    useCollection(islandHoppingQuery);
  const { data: waterActivities, isLoading: waterLoading } =
    useCollection(waterActivitiesQuery);

  return (
    <div className="flex min-h-screen flex-col">
      <SmartNavbar />

      <main className="flex-grow">
        {/* ═══════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════ */}
        <section className="relative h-[90vh] w-full flex items-center justify-center overflow-hidden">
          {/* Decorative blobs behind text */}
          <div
            className="blob-deco blob-deco-1"
            style={{ top: "10%", left: "5%", opacity: 0.6 }}
          />
          <div
            className="blob-deco blob-deco-2"
            style={{ bottom: "15%", right: "8%", opacity: 0.5 }}
          />

          {heroImage && (
            <div className="absolute inset-0 z-0">
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover brightness-90 transition-transform duration-[20000ms] hover:scale-110"
                priority
                data-ai-hint={heroImage.imageHint}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
            </div>
          )}

          <div className="relative z-10 container mx-auto px-4 text-center text-white space-y-6">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <h1 className="font-headline text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight drop-shadow-2xl">
                Balatasan
              </h1>
              <p className="text-lg md:text-2xl text-white/95 font-medium tracking-[0.4em] uppercase drop-shadow-lg mt-2">
                Bulalacao • Oriental Mindoro
              </p>

              <div className="pt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/accommodations">
                  <button className="btn-liquid text-lg px-10 py-4 shadow-2xl">
                    Book a Cottage
                  </button>
                </Link>
                <Link href="/tours">
                  <button className="btn-liquid-outline text-lg px-10 py-4 text-white border-white/50">
                    Start Adventure
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Wave into Features */}
        <WaveDivider fillColor="#ffffff" />

        {/* ═══════════════════════════════════════
            FEATURES SECTION
        ═══════════════════════════════════════ */}
        <section className="py-24 bg-white relative overflow-hidden">
          {/* Decorative blobs */}
          <div
            className="blob-deco blob-deco-3"
            style={{ top: "5%", right: "3%", opacity: 0.5 }}
          />
          <div
            className="blob-deco blob-deco-2"
            style={{ bottom: "5%", left: "2%", opacity: 0.3 }}
          />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20 space-y-3">
              <span className="text-primary font-bold tracking-widest text-xs uppercase">
                The Experience
              </span>
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-slate-900">
                Your Tropical Escape
              </h2>
              <div className="h-1.5 w-16 bg-primary/20 mx-auto rounded-full mt-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {[
                {
                  Icon: Anchor,
                  title: "Floating Cottages",
                  body: "Sleep on the water and wake up to the sound of gentle waves in our signature over-water accommodations.",
                },
                {
                  Icon: Compass,
                  title: "Island Hopping",
                  body: "Discover hidden gems and untouched sandbars across the beautiful Bulalacao archipelago.",
                },
                {
                  Icon: Waves,
                  title: "Water Activities",
                  body: "Dive into crystal clear waters with snorkeling, kayaking, and high-speed paddleboarding adventures.",
                },
              ].map(({ Icon, title, body }) => (
                <div
                  key={title}
                  className="group flex flex-col items-center text-center space-y-6 p-8 transition-all duration-500 hover:shadow-lg"
                  style={{
                    borderRadius: "24px 36px 28px 40px / 32px 28px 36px 24px",
                    background:
                      "linear-gradient(135deg, rgba(18,175,171,0.04) 0%, rgba(111,221,194,0.06) 100%)",
                    transition:
                      "border-radius 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.4s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderRadius =
                      "36px 24px 40px 28px / 28px 36px 24px 32px";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderRadius =
                      "24px 36px 28px 40px / 32px 28px 36px 24px";
                  }}
                >
                  <div
                    className="p-5 bg-primary/10 group-hover:scale-110 transition-transform"
                    style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
                  >
                    <Icon className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-headline text-2xl font-bold">{title}</h3>
                    <p className="text-muted-foreground text-base leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Wave into Accommodations */}
        <WaveDivider fillColor="#f8fafc" />

        {/* ═══════════════════════════════════════
            ACCOMMODATIONS SECTION
        ═══════════════════════════════════════ */}
        <section className="py-24 bg-slate-50 relative overflow-hidden">
          {/* Decorative blob */}
          <div
            className="blob-deco blob-deco-1"
            style={{ top: "8%", right: "-4%", opacity: 0.25 }}
          />

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="space-y-3">
                <span className="text-primary font-bold tracking-widest text-xs uppercase">
                  Accommodation
                </span>
                <h2 className="font-headline text-4xl md:text-5xl font-bold text-slate-900">
                  Over-water Stay
                </h2>
              </div>
              <Link href="/accommodations">
                <Button variant="link" className="text-primary font-bold text-lg gap-2 p-0 group">
                  View All Options{" "}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {roomsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {featuredRooms?.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Wave into Island Hopping */}
        <WaveDivider fillColor="#ffffff" />

        {/* ═══════════════════════════════════════
            ISLAND HOPPING SECTION
        ═══════════════════════════════════════ */}
        <section className="py-24 bg-white relative overflow-hidden">
          {/* Decorative blobs */}
          <div
            className="blob-deco blob-deco-2"
            style={{ top: "5%", left: "-3%", opacity: 0.3 }}
          />
          <div
            className="blob-deco blob-deco-3"
            style={{ bottom: "10%", right: "4%", opacity: 0.4 }}
          />

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="space-y-3">
                <span className="text-primary font-bold tracking-widest text-xs uppercase">
                  Adventure
                </span>
                <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary">
                  Island Hopping
                </h2>
              </div>
              <Link href="/tours?category=island-hopping">
                <Button variant="link" className="text-primary font-bold text-lg gap-2 p-0 group">
                  Explore More{" "}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {islandLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {islandHopping?.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Wave into Water Activities */}
        <WaveDivider fillColor="#f0fdfb" />

        {/* ═══════════════════════════════════════
            WATER ACTIVITIES SECTION
        ═══════════════════════════════════════ */}
        <section
          className="py-24 relative overflow-hidden"
          style={{ background: "#f0fdfb" }}
        >
          {/* Decorative blob */}
          <div
            className="blob-deco blob-deco-1"
            style={{ bottom: "5%", left: "-5%", opacity: 0.2 }}
          />

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="space-y-3">
                <span className="text-primary font-bold tracking-widest text-xs uppercase">
                  Experience
                </span>
                <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary">
                  Water Activities
                </h2>
              </div>
              <Link href="/tours?category=water-activities">
                <Button variant="link" className="text-primary font-bold text-lg gap-2 p-0 group">
                  View All{" "}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {waterLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {waterActivities?.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

