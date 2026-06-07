"use client";

import Image from "next/image";
import { Users, ArrowRight, Eye } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

const FALLBACK_ROOM_IMAGE = "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=80";

interface RoomCardProps {
  room: {
    id: string;
    name: string;
    pricePerPerson?: number;
    price?: number;
    capacity: number;
    imageUrl: string;
    description: string;
  };
}

export function RoomCard({ room }: RoomCardProps) {
  const rate = room.pricePerPerson ?? room.price ?? 0;
  const [imgSrc, setImgSrc] = useState(room.imageUrl || FALLBACK_ROOM_IMAGE);

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-none bg-card/50 backdrop-blur">
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={imgSrc}
          alt={room.name || "Cottage image"}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImgSrc(FALLBACK_ROOM_IMAGE)}
        />
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
          ₱{rate.toLocaleString()} / person
        </div>
      </div>
      <CardHeader className="pt-6 pb-2">
        <h3 className="font-headline text-xl font-bold">{room.name}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm line-clamp-2">
          {room.description}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            <span>Max {room.capacity} guests</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/accommodations/${room.id}`} className="w-full">
          <Button className="w-full gap-2 group-hover:bg-primary/90">
            <Eye className="h-4 w-4" />
            View Details
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
