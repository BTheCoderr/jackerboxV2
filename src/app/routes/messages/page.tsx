import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db";

export default async function MessagesPage() {
  // Ensure user is authenticated
  const user = await requireAuth();
  
  // Fetch conversations (messages grouped by rental)
  const conversations = await db.rental.findMany({
    where: {
      OR: [
        { renterId: user.id },
        { equipment: { ownerId: user.id } },
      ],
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
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="md:col-span-1 border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h2 className="font-medium">Conversations</h2>
          </div>
          
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((rental) => {
                // Determine the other party (owner or renter)
                const isOwner = rental.equipment.ownerId === user.id;
                const otherParty = isOwner ? rental.renter : rental.equipment.owner;
                const lastMessage = rental.messages[0];
                
                return (
                  <Link
                    key={rental.id}
                    href={`/routes/messages/${rental.id}`}
                    className="block p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
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
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {otherParty.name || "User"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {rental.equipment.title}
                        </p>
                        {lastMessage && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {lastMessage.content}
                          </p>
                        )}
                      </div>
                      {lastMessage && (
                        <div className="flex-shrink-0 text-xs text-gray-400">
                          {new Date(lastMessage.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Message Thread (Empty State) */}
        <div className="md:col-span-2 border rounded-lg flex flex-col">
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="text-lg font-medium mb-1">Your Messages</h3>
            <p className="max-w-md">
              Select a conversation to view messages or start a new conversation
              by renting equipment.
            </p>
            <Link
              href="/routes/equipment"
              className="mt-4 inline-block px-4 py-2 bg-black text-white rounded-md hover:bg-opacity-80"
            >
              Browse Equipment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 