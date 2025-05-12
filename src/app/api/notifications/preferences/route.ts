import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/auth-utils';
import { db } from '@/lib/db';

// Schema for notification preference
const preferenceSchema = z.object({
  type: z.string(),
  email: z.boolean(),
  push: z.boolean(),
  inApp: z.boolean()
});

// Schema for the request body
const preferencesSchema = z.object({
  preferences: z.array(preferenceSchema)
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Find the user's notification preferences
    const userPreferences = await db.notificationPreference.findMany({
      where: {
        userId: user.id
      }
    });
    
    // If no preferences are found, return default values
    if (userPreferences.length === 0) {
      return NextResponse.json({
        preferences: []
      });
    }
    
    // Format preferences for the frontend
    const formattedPreferences = userPreferences.map(pref => ({
      type: pref.notificationType,
      email: pref.emailEnabled,
      push: pref.pushEnabled,
      inApp: pref.inAppEnabled
    }));
    
    return NextResponse.json({
      preferences: formattedPreferences
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse and validate the request body
    const body = await req.json();
    const validationResult = preferencesSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { preferences } = validationResult.data;
    
    // Process each preference
    for (const pref of preferences) {
      // Find existing preference or create a new one
      const existingPref = await db.notificationPreference.findFirst({
        where: {
          userId: user.id,
          notificationType: pref.type
        }
      });
      
      if (existingPref) {
        // Update existing preference
        await db.notificationPreference.update({
          where: {
            id: existingPref.id
          },
          data: {
            emailEnabled: pref.email,
            pushEnabled: pref.push,
            inAppEnabled: pref.inApp,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new preference
        await db.notificationPreference.create({
          data: {
            userId: user.id,
            notificationType: pref.type,
            emailEnabled: pref.email,
            pushEnabled: pref.push,
            inAppEnabled: pref.inApp
          }
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Notification preferences updated successfully"
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 