import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { ChatInterface } from "@/components/messaging/chat-interface";

export const dynamic = 'force-dynamic';

interface MessagesUserPageProps {
  params: {
    id: string;
  };
  searchParams: {
    equipmentId?: string;
  };
}

interface EquipmentData {
  id: string;
  title: string;
}

export default async function MessagesUserPage({
  params,
  searchParams,
}: MessagesUserPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login?callbackUrl=/routes/messages");
  }

  // Properly access params and searchParams
  const otherUserId = params?.id;
  const equipmentId = searchParams?.equipmentId;

  if (!otherUserId) {
    redirect("/routes/messages");
  }

  // Fetch the other user's details
  const otherUser = await db.user.findUnique({
    where: { id: otherUserId },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  if (!otherUser) {
    redirect("/routes/messages");
  }

  // Fetch equipment details if equipmentId is provided
  let equipment: EquipmentData | undefined = undefined;
  if (equipmentId) {
    const equipmentData = await db.equipment.findUnique({
      where: { id: equipmentId },
      select: {
        id: true,
        title: true,
      },
    });
    
    if (equipmentData) {
      equipment = {
        id: equipmentData.id,
        title: equipmentData.title
      };
    }
  }

  // Fetch existing messages between the two users
  const messages = await db.message.findMany({
    where: {
      OR: [
        {
          senderId: currentUser.id,
          receiverId: otherUserId,
        },
        {
          senderId: otherUserId,
          receiverId: currentUser.id,
        },
      ],
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

  // Mark unread messages as read
  if (messages.some(m => m.senderId === otherUserId && !m.isRead)) {
    await db.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUser.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ChatInterface
        currentUserId={currentUser.id}
        otherUserId={otherUser.id}
        otherUserName={otherUser.name || "User"}
        otherUserImage={otherUser.image || undefined}
        initialMessages={messages}
        equipmentId={equipment?.id}
        equipmentTitle={equipment?.title}
      />
    </div>
  );
}