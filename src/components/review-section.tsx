"use client";

import { useState, useMemo } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { collection, query, orderBy, doc, collectionGroup, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ReviewSectionProps {
  itemId: string;
  itemType: "room" | "tour";
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-7 w-7" : "h-5 w-5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn("transition-transform", !readonly && "hover:scale-110 cursor-pointer", readonly && "cursor-default")}
          aria-label={`${star} star`}
        >
          <Star
            className={cn(
              sizeClass,
              (hovered || value) >= star
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-slate-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewSection({ itemId, itemType }: ReviewSectionProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reviews collection path: reviews/{itemType}_{itemId}/entries
  const reviewsColRef = useMemoFirebase(
    () => firestore ? collection(firestore, "reviews", `${itemType}_${itemId}`, "entries") : null,
    [firestore, itemId, itemType]
  );
  const reviewsQuery = useMemoFirebase(
    () => reviewsColRef ? query(reviewsColRef, orderBy("createdAt", "desc")) : null,
    [reviewsColRef]
  );
  const { data: reviews } = useCollection(reviewsQuery);

  // Check if this user has a confirmed booking for this item
  const userBookingsRef = useMemoFirebase(
    () => (firestore && user) ? collection(firestore, "users", user.uid, "bookings") : null,
    [firestore, user]
  );
  const userBookingsQuery = useMemoFirebase(
    () => userBookingsRef ? query(userBookingsRef, where("itemId", "==", itemId), where("status", "==", "Confirmed")) : null,
    [userBookingsRef, itemId]
  );
  const { data: confirmedBookings } = useCollection(userBookingsQuery);
  const hasConfirmedBooking = (confirmedBookings?.length ?? 0) > 0;

  // Check if user already reviewed
  const alreadyReviewed = reviews?.some((r: any) => r.userId === user?.uid);

  // Average rating
  const { avgRating, totalCount } = useMemo(() => {
    if (!reviews || reviews.length === 0) return { avgRating: 0, totalCount: 0 };
    const sum = reviews.reduce((acc: number, r: any) => acc + (r.rating ?? 0), 0);
    return { avgRating: sum / reviews.length, totalCount: reviews.length };
  }, [reviews]);

  const handleSubmit = async () => {
    if (!user || !firestore || !reviewsColRef) return;
    if (rating === 0) { toast({ variant: "destructive", title: "Please select a star rating." }); return; }
    if (!comment.trim()) { toast({ variant: "destructive", title: "Please write a short comment." }); return; }

    setIsSubmitting(true);
    try {
      // Use user uid as doc id so one review per user
      const reviewDocRef = doc(firestore, "reviews", `${itemType}_${itemId}`, "entries", user.uid);
      await setDocumentNonBlocking(reviewDocRef, {
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Guest",
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      });
      setRating(0);
      setComment("");
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + average */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-2xl font-headline font-bold">Ratings &amp; Reviews</h3>
        {totalCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-full px-4 py-1.5">
            <StarRating value={Math.round(avgRating)} readonly size="sm" />
            <span className="text-sm font-bold text-amber-700">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-amber-600">({totalCount} {totalCount === 1 ? "review" : "reviews"})</span>
          </div>
        )}
      </div>

      {/* Write a review */}
      {user && hasConfirmedBooking && !alreadyReviewed && (
        <div className="p-5 rounded-2xl border border-primary/15 bg-primary/5 space-y-4">
          <p className="text-sm font-bold text-slate-700">Share your experience</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Your rating</p>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <Textarea
            placeholder="Tell others what you loved about your stay or experience..."
            className="min-h-[90px] text-sm"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{comment.length}/500</span>
            <Button size="sm" className="gap-2" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Review
            </Button>
          </div>
        </div>
      )}

      {/* Already reviewed */}
      {user && hasConfirmedBooking && alreadyReviewed && (
        <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50 text-sm text-emerald-700 font-medium flex items-center gap-2">
          <Star className="h-4 w-4 fill-emerald-400 text-emerald-400" />
          You&apos;ve already left a review for this {itemType === "room" ? "cottage" : "experience"}.
        </div>
      )}

      {/* Must be confirmed to review */}
      {user && !hasConfirmedBooking && (
        <p className="text-xs text-muted-foreground italic">
          Only guests with a confirmed booking can leave a review.
        </p>
      )}

      {/* Not logged in */}
      {!user && (
        <p className="text-xs text-muted-foreground italic">
          Sign in and complete a booking to leave a review.
        </p>
      )}

      {/* Reviews list */}
      {!reviews || reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Star className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary uppercase">
                      {(review.userName ?? "G").slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{review.userName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {review.createdAt
                        ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
                        : ""}
                    </p>
                  </div>
                </div>
                <StarRating value={review.rating ?? 0} readonly size="sm" />
              </div>
              {review.comment && (
                <p className="text-sm text-slate-600 leading-relaxed pl-10">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
