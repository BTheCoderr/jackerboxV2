"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ReviewFormProps {
  rentalId: string;
  equipmentTitle: string;
  ownerName: string;
}

export function ReviewForm({ rentalId, equipmentTitle, ownerName }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/rentals/${rentalId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          review,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      toast.success("Review submitted successfully");
      router.push("/routes/dashboard");
      router.refresh();
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Review Your Rental Experience</h2>
      <p className="text-gray-600 mb-6">
        How was your experience renting {equipmentTitle} from {ownerName}?
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="text-2xl focus:outline-none"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="review" className="block text-sm font-medium mb-2">
            Your Review
          </label>
          <Textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience with this rental..."
            className="h-32"
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
} 