import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { ReviewForm } from "@/components/reviews/review-form";

interface RentalReviewPageProps {
  params: {
    id: string;
  };
}

export default async function RentalReviewPage({ params }: RentalReviewPageProps) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/auth/login");
  }
  
  // Fetch the rental with equipment details
  const rental = await db.rental.findUnique({
    where: {
      id: params.id,
      renterId: user.id, // Ensure the user is the renter
    },
    include: {
      equipment: {
        select: {
          id: true,
          title: true,
          imagesJson: true,
          ownerId: true,
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
  
  if (!rental) {
    notFound();
  }
  
  // Check if the rental is completed
  if (rental.status !== "Completed") {
    redirect(`/routes/rentals/${params.id}`);
  }
  
  // Check if the user has already reviewed this rental
  const existingReview = await db.review.findFirst({
    where: {
      rentalId: params.id,
      authorId: user.id,
    },
  });
  
  if (existingReview) {
    redirect(`/routes/rentals/${params.id}`);
  }
  
  // Parse equipment images
  const equipmentImages = rental.equipment.imagesJson
    ? JSON.parse(rental.equipment.imagesJson)
    : [];
  
  const equipmentImage = equipmentImages.length > 0
    ? equipmentImages[0]
    : "/images/placeholder.svg";
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/routes/rentals/${params.id}`}
          className="text-blue-500 hover:underline flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Rental
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Write a Review</h1>
          <p className="text-gray-600 mt-1">
            Share your experience with {rental.equipment.title}
          </p>
        </div>
        
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden mr-4 flex-shrink-0">
              <img
                src={equipmentImage}
                alt={rental.equipment.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-medium text-lg">{rental.equipment.title}</h2>
              <p className="text-gray-600 text-sm">
                Rented from {rental.equipment.owner.name}
              </p>
              <p className="text-gray-600 text-sm">
                {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <ReviewForm
            equipmentId={rental.equipment.id}
            rentalId={rental.id}
            onSuccess={() => {
              // This will be handled client-side in the ReviewForm component
            }}
          />
        </div>
      </div>
    </div>
  );
} 