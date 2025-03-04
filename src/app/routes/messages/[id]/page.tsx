import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";
import { MessageForm } from "@/components/messages/message-form";
import { MessageList } from "@/components/messages/message-list";

interface MessageDetailPageProps {
  params: {
    id: string;
  };
}

export default async function MessageDetailPage({ params }: MessageDetailPageProps) {
  // Ensure user is authenticated
  const user = await requireAuth();
  
  // Fetch the rental with messages
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
      renter: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
  
  // If rental doesn't exist or user is not involved, redirect
  if (!rental || (rental.renterId !== user.id && rental.equipment.ownerId !== user.id)) {
    redirect("/routes/messages");
  }
  
  // Determine if user is the owner or renter
  const isOwner = rental.equipment.ownerId === user.id;
  const otherParty = isOwner ? rental.renter : rental.equipment.owner;
  
  // Fetch messages for this rental
  const messages = await db.message.findMany({
    where: {
      rentalId: rental.id,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/routes/messages" className="text-black hover:underline flex items-center">
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
          Back to Messages
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversation Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                  {otherParty.image ? (
                    <img
                      src={otherParty.image}
                      alt={otherParty.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xl font-bold">
                      {otherParty.name
                        ? otherParty.name.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-medium">{otherParty.name || "User"}</h2>
                <p className="text-sm text-gray-500">
                  {isOwner ? "Renter" : "Owner"}
                </p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Equipment</h3>
              <Link
                href={`/routes/equipment/${rental.equipment.id}`}
                className="text-black hover:underline"
              >
                {rental.equipment.title}
              </Link>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Rental Period</h3>
                <p>
                  {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                </p>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Status</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    rental.status === "Approved"
                      ? "bg-green-100 text-green-800"
                      : rental.status === "Pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : rental.status === "Completed"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {rental.status}
                </span>
              </div>
              
              <div className="mt-6">
                <Link
                  href={`/routes/rentals/${rental.id}`}
                  className="block w-full py-2 px-4 bg-gray-100 text-center rounded-md hover:bg-gray-200 transition-colors"
                >
                  View Rental Details
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Message Thread */}
        <div className="md:col-span-2 bg-white rounded-lg border shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b">
            <h2 className="font-medium">Conversation with {otherParty.name || "User"}</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <MessageList messages={messages} currentUserId={user.id} />
          </div>
          
          <div className="border-t p-4">
            <MessageForm rentalId={rental.id} />
          </div>
        </div>
      </div>
    </div>
  );
} 