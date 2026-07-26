"use client";

import Image from "next/image";
import { Clock, ArrowRight, Eye, Timer } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState } from "react";

// Fallback images used ONLY when Firestore has no image
const ISLAND_FALLBACKS: Record<string, string> = {
  "aslom":       "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&q=80",
  "sibalat":     "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&q=80",
  "target":      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80",
  "buyayao":     "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=600&q=80",
  "suguicay":    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
  "silad":       "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80",
  "jet ski":     "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=600&q=80",
  "flying fish": "https://images.unsplash.com/photo-1530541834187-2f74f5d4a4d6?w=600&q=80",
};

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80";

function getFallback(title: string): string {
  const lower = title.toLowerCase();
  for (const [key, url] of Object.entries(ISLAND_FALLBACKS)) {
    if (lower.includes(key)) return url;
  }
  return DEFAULT_FALLBACK;
}

interface TourCardProps {
  tour: {
    id: string;
    title?: string;
    name?: string;
    pricePerPerson?: number;
    price?: number;
    duration: string;
    imageUrl: string;
    description: string;
  };
}

export function TourCard({ tour }: TourCardProps) {
  const displayTitle = tour.title || tour.name || "Tour Experience";
  const fallback = getFallback(displayTitle);
  // Use Firestore imageUrl first — fallback only if empty or on error
  const [imgSrc, setImgSrc] = useState(tour.imageUrl || fallback);

  const isFlyingFish = displayTitle.toLowerCase().includes("flying fish");
  const isJetSki = displayTitle.toLowerCase().includes("jet ski");

  const defaultRate = isJetSki ? 150 : (isFlyingFish ? 500 : 1000);
  const rate = tour.pricePerPerson ?? tour.price ?? defaultRate;
  const unitLabel = isJetSki ? "min" : "pax";

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-none bg-white rounded-2xl">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={imgSrc}
          alt={displayTitle}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImgSrc(fallback)}
          unoptimized={imgSrc.startsWith("data:")}
        />
        <Badge className="absolute top-4 left-4 bg-[#6FDDC2] text-[#006D6B] hover:bg-[#6FDDC2]/90 border-none font-semibold px-3 py-1 rounded-full">
          Adventure
        </Badge>
      </div>
      <CardHeader className="pt-6 pb-2">
        <h3 className="font-headline text-2xl font-bold text-slate-900">{displayTitle}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-[#12AFAB] text-sm line-clamp-2">
          {tour.description}
        </p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[#12AFAB]">
            {isJetSki ? <Timer className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            <span className="font-medium">{tour.duration}</span>
          </div>
          <div className="font-bold text-[#12AFAB] flex items-center gap-1">
            <span className="text-lg">₱</span>
            <span>{rate.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ {unitLabel}</span></span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pb-6">
        <Link href={`/tours/${tour.id}`} className="w-full">
          <Button
            variant="outline"
            className="w-full gap-2 border-[#12AFAB]/20 hover:border-[#12AFDC]/50 hover:bg-[#12AFAB]/5 rounded-xl h-12 text-slate-700 font-medium"
          >
            <Eye className="h-4 w-4" />
            Details
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
