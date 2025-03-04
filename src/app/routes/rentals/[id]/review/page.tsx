import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { ReviewForm } from "@/components/rentals/review-form";

interface ReviewPageProps {
  params: {
    id: string;
  };
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  // Ensure user is authenticated
  const user = await requireAuth();
  
  // Fetch the rental
  const rental = await db.rental.findUnique({
    where: {
      id: params.id,
    },
    include: {
      equipment: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      review: true,
    },
  });
  
  // If rental doesn't exist, redirect
  if (!rental) {
    redirect("/routes/rentals");
  }
  
  // If user is not the renter, redirect
  if (rental.renterId !== user.id) {
    redirect("/routes/rentals");
  }
  
  // If rental is not completed, redirect
  if (rental.status !== "Completed") {
    redirect(`/routes/rentals/${rental.id}`);
  }
  
  // If review already exists, redirect
  if (rental.review) {
    redirect(`/routes/rentals/${rental.id}`);
  }
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">Leave a Review</h1>
      
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium">
            Review for {rental.equipment.title}
          </h2>
          <p className="text-gray-500 mt-1">
            Share your experience with this equipment and its owner
          </p>
        </div>
        
        <div className="p-6">
          <ReviewForm rental={rental} />
        </div>
      </div>
    </div>
  );
} 