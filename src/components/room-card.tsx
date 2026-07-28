"use client";

import Image from "next/image";
import { Users, ArrowRight, Eye } from "lucide-react";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { useState } from "react";

const FALLBACK_ROOM_IMAGE = "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=80";

interface RoomCardProps {
  room: {
    id: string;
    name: string;
    pricePerPerson?: number;
    price?: number;
    originalPrice?: number;
    discountPercent?: number;
    capacity: number;
    imageUrl: string;
    description: string;
    tags?: string[];
  };
}

export function RoomCard({ room }: RoomCardProps) {
  const baseRate = room.pricePerPerson ?? room.price ?? 0;
  const itemDiscount = room.discountPercent && room.discountPercent > 0 ? (1 - room.discountPercent / 100) : 1;
  const rate = Math.round(baseRate * itemDiscount);
  const [imgSrc, setImgSrc] = useState(room.imageUrl || FALLBACK_ROOM_IMAGE);
  const { user } = useUser();
  const router = useRouter();
  const firstTag = room.tags?.find(t => t.trim());

  const handleViewDetails = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    router.push(`/accommodations/${room.id}`);
  };

  return (
    <div className="card-liquid group bg-white/70 backdrop-blur border border-primary/10 shadow-md hover:shadow-xl transition-all duration-500">
      <div className="relative h-56 w-full overflow-hidden rounded-t-3xl">
        <Image
          src={imgSrc}
          alt={room.name || "Cottage image"}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImgSrc(FALLBACK_ROOM_IMAGE)}
          unoptimized={imgSrc.startsWith("data:")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {/* Discount badge */}
        {room.discountPercent && room.discountPercent > 0 ? (
          <span className="absolute top-4 left-4 bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
            {room.discountPercent}% OFF
          </span>
        ) : firstTag ? (
          <span className="absolute top-4 left-4 bg-[#6FDDC2] text-[#006D6B] text-[11px] font-bold px-3 py-1 rounded-full shadow">
            {firstTag}
          </span>
        ) : null}
        {/* Price pill */}
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold shadow-lg rounded-full">
          {room.originalPrice && room.originalPrice > 0 && (
            <span className="line-through text-primary-foreground/60 text-xs mr-1">
              ₱{room.originalPrice.toLocaleString()}
            </span>
          )}
          ₱{rate.toLocaleString()} / person
        </div>
      </div>

      <CardHeader className="pt-6 pb-2">
        <h3 className="font-headline text-xl font-bold">{room.name}</h3>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm line-clamp-2">{room.description}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            <span>Max {room.capacity} guests</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pb-6">
        <Button variant="default" size="lg" className="w-full gap-2" onClick={handleViewDetails}>
          <Eye className="h-4 w-4" />
          View Details
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardFooter>
    </div>
  );
}
