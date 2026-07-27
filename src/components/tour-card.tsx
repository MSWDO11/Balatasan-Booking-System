"use client";

import Image from "next/image";
import { Clock, ArrowRight, Eye, Timer } from "lucide-react";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState } from "react";

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
    originalPrice?: number;
    discountPercent?: number;
    duration: string;
    imageUrl: string;
    description: string;
    tags?: string[];
  };
}

export function TourCard({ tour }: TourCardProps) {
  const displayTitle = tour.title || tour.name || "Tour Experience";
  const fallback = getFallback(displayTitle);
  const [imgSrc, setImgSrc] = useState(tour.imageUrl || fallback);

  const isFlyingFish = displayTitle.toLowerCase().includes("flying fish");
  const isJetSki = displayTitle.toLowerCase().includes("jet ski");

  const defaultRate = isJetSki ? 150 : (isFlyingFish ? 500 : 1000);
  const baseRate = tour.pricePerPerson ?? tour.price ?? defaultRate;
  const itemDiscount = tour.discountPercent && tour.discountPercent > 0 ? (1 - tour.discountPercent / 100) : 1;
  const rate = Math.round(baseRate * itemDiscount);
  const unitLabel = isJetSki ? "min" : "pax";

  // First non-empty tag to show as a badge
  const firstTag = tour.tags?.find(t => t.trim());

  return (
    <div className="card-liquid group bg-white shadow-md hover:shadow-xl transition-all duration-500 border border-primary/10">
      <div className="relative h-48 w-full overflow-hidden rounded-t-3xl">
        <Image
          src={imgSrc}
          alt={displayTitle}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImgSrc(fallback)}
          unoptimized={imgSrc.startsWith("data:")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {/* Category badge — replaced by first tag if available */}
        <Badge className="absolute top-4 left-4 bg-[#6FDDC2] text-[#006D6B] hover:bg-[#6FDDC2]/90 border-none font-semibold px-3 py-1 shadow rounded-full">
          {firstTag || "Adventure"}
        </Badge>
        {/* Discount badge */}
        {tour.discountPercent && tour.discountPercent > 0 ? (
          <span className="absolute top-4 right-4 bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
            {tour.discountPercent}% OFF
          </span>
        ) : null}
      </div>

      <CardHeader className="pt-6 pb-2">
        <h3 className="font-headline text-2xl font-bold text-slate-900">{displayTitle}</h3>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-[#12AFAB] text-sm line-clamp-2">{tour.description}</p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[#12AFAB]">
            {isJetSki ? <Timer className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            <span className="font-medium">{tour.duration}</span>
          </div>
          <div className="text-right">
            {tour.originalPrice && tour.originalPrice > 0 && (
              <p className="text-xs text-slate-400 line-through">₱{tour.originalPrice.toLocaleString()}</p>
            )}
            <div className="font-bold text-[#12AFAB] flex items-center gap-1">
              <span className="text-lg">₱</span>
              <span>
                {rate.toLocaleString()}{" "}
                <span className="text-xs text-slate-400 font-normal">/ {unitLabel}</span>
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pb-6">
        <Link href={`/tours/${tour.id}`} className="w-full">
          <Button variant="outline" size="lg" className="w-full gap-2">
            <Eye className="h-4 w-4" />
            Details
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </div>
  );
}
