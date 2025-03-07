import { db } from "@/lib/db";
import ical from "node-ical";
import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";

// Interface for calendar events
interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  status: string;
}

// Interface for calendar sync options
interface CalendarSyncOptions {
  userId: string;
  equipmentId: string;
  calendarType: "google" | "ical";
  calendarId?: string;
  icalUrl?: string;
  syncDirection: "import" | "export" | "both";
  syncFrequency: "hourly" | "daily" | "manual";
  lastSynced?: Date;
}

/**
 * Sync with Google Calendar
 */
export async function syncWithGoogleCalendar(
  options: CalendarSyncOptions,
  accessToken: string,
  refreshToken: string
): Promise<{ success: boolean; message: string; events?: CalendarEvent[] }> {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Get events from Google Calendar
    if (options.syncDirection === "import" || options.syncDirection === "both") {
      const response = await calendar.events.list({
        calendarId: options.calendarId || "primary",
        timeMin: options.lastSynced
          ? new Date(options.lastSynced).toISOString()
          : new Date().toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.data.items?.map((event) => ({
        id: event.id || uuidv4(),
        summary: event.summary || "Untitled Event",
        description: event.description,
        start: new Date(event.start?.dateTime || event.start?.date || ""),
        end: new Date(event.end?.dateTime || event.end?.date || ""),
        location: event.location,
        status: event.status || "confirmed",
      })) || [];

      // Import events to our system
      await importEventsToAvailability(events, options.equipmentId);

      return {
        success: true,
        message: `Successfully imported ${events.length} events from Google Calendar`,
        events,
      };
    }

    // Export events to Google Calendar
    if (options.syncDirection === "export" || options.syncDirection === "both") {
      const availabilities = await db.availability.findMany({
        where: {
          equipmentId: options.equipmentId,
          startDate: {
            gte: options.lastSynced || new Date(),
          },
        },
      });

      for (const availability of availabilities) {
        await calendar.events.insert({
          calendarId: options.calendarId || "primary",
          requestBody: {
            summary: "Equipment Available: Jackerbox",
            description: `This equipment is available for rent on Jackerbox. Equipment ID: ${options.equipmentId}`,
            start: {
              dateTime: availability.startDate.toISOString(),
            },
            end: {
              dateTime: availability.endDate.toISOString(),
            },
            status: "confirmed",
          },
        });
      }

      return {
        success: true,
        message: `Successfully exported ${availabilities.length} availabilities to Google Calendar`,
      };
    }

    return {
      success: false,
      message: "Invalid sync direction",
    };
  } catch (error) {
    console.error("Error syncing with Google Calendar:", error);
    return {
      success: false,
      message: `Error syncing with Google Calendar: ${error.message}`,
    };
  }
}

/**
 * Sync with iCal
 */
export async function syncWithICal(
  options: CalendarSyncOptions
): Promise<{ success: boolean; message: string; events?: CalendarEvent[] }> {
  try {
    if (!options.icalUrl) {
      return {
        success: false,
        message: "iCal URL is required",
      };
    }

    // Only import is supported for iCal
    if (options.syncDirection === "import" || options.syncDirection === "both") {
      const events = await ical.fromURL(options.icalUrl);
      
      const calendarEvents: CalendarEvent[] = Object.values(events)
        .filter((event) => event.type === "VEVENT")
        .map((event) => ({
          id: event.uid || uuidv4(),
          summary: event.summary || "Untitled Event",
          description: event.description,
          start: event.start,
          end: event.end,
          location: event.location,
          status: event.status || "confirmed",
        }));

      // Import events to our system
      await importEventsToAvailability(calendarEvents, options.equipmentId);

      return {
        success: true,
        message: `Successfully imported ${calendarEvents.length} events from iCal`,
        events: calendarEvents,
      };
    }

    return {
      success: false,
      message: "Export is not supported for iCal",
    };
  } catch (error) {
    console.error("Error syncing with iCal:", error);
    return {
      success: false,
      message: `Error syncing with iCal: ${error.message}`,
    };
  }
}

/**
 * Generate iCal feed for equipment availability
 */
export async function generateICalFeed(equipmentId: string): Promise<string> {
  try {
    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        availability: true,
        owner: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!equipment) {
      throw new Error("Equipment not found");
    }

    // Generate iCal content
    let icalContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Jackerbox//Equipment Availability//EN",
      `X-WR-CALNAME:Jackerbox - ${equipment.title}`,
      "X-WR-CALDESC:Availability calendar for equipment on Jackerbox",
      "CALSCALE:GREGORIAN",
    ];

    // Add events for each availability period
    equipment.availability.forEach((availability) => {
      const eventId = uuidv4().replace(/-/g, "");
      const startDate = formatDateForICal(availability.startDate);
      const endDate = formatDateForICal(availability.endDate);

      icalContent = [
        ...icalContent,
        "BEGIN:VEVENT",
        `UID:${eventId}`,
        `DTSTAMP:${formatDateForICal(new Date())}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:Available: ${equipment.title}`,
        `DESCRIPTION:This equipment is available for rent on Jackerbox.`,
        `ORGANIZER;CN=${equipment.owner?.name || "Equipment Owner"}:mailto:noreply@jackerbox.com`,
        "STATUS:CONFIRMED",
        "END:VEVENT",
      ];
    });

    icalContent.push("END:VCALENDAR");

    return icalContent.join("\r\n");
  } catch (error) {
    console.error("Error generating iCal feed:", error);
    throw error;
  }
}

/**
 * Format date for iCal
 */
function formatDateForICal(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/g, "");
}

/**
 * Import events to availability
 */
async function importEventsToAvailability(
  events: CalendarEvent[],
  equipmentId: string
): Promise<void> {
  try {
    // Get existing availabilities to avoid duplicates
    const existingAvailabilities = await db.availability.findMany({
      where: { equipmentId },
    });

    // Filter out events that overlap with existing availabilities
    const newEvents = events.filter((event) => {
      return !existingAvailabilities.some(
        (availability) =>
          (event.start >= availability.startDate &&
            event.start <= availability.endDate) ||
          (event.end >= availability.startDate &&
            event.end <= availability.endDate) ||
          (event.start <= availability.startDate &&
            event.end >= availability.endDate)
      );
    });

    // Create new availabilities
    await Promise.all(
      newEvents.map(async (event) => {
        await db.availability.create({
          data: {
            startDate: event.start,
            endDate: event.end,
            equipmentId,
          },
        });
      })
    );
  } catch (error) {
    console.error("Error importing events to availability:", error);
    throw error;
  }
}

/**
 * Save calendar sync settings
 */
export async function saveCalendarSyncSettings(
  options: CalendarSyncOptions
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if equipment exists
    const equipment = await db.equipment.findUnique({
      where: { id: options.equipmentId },
    });

    if (!equipment) {
      return {
        success: false,
        message: "Equipment not found",
      };
    }

    // Check if user is the owner
    if (equipment.ownerId !== options.userId) {
      return {
        success: false,
        message: "You are not authorized to modify this equipment's calendar settings",
      };
    }

    // Save settings to database (you'll need to create a CalendarSync model in your schema)
    // This is a simplified example - you would need to create the actual model
    /*
    await db.calendarSync.upsert({
      where: {
        equipmentId: options.equipmentId,
      },
      update: {
        calendarType: options.calendarType,
        calendarId: options.calendarId,
        icalUrl: options.icalUrl,
        syncDirection: options.syncDirection,
        syncFrequency: options.syncFrequency,
        lastSynced: new Date(),
      },
      create: {
        equipmentId: options.equipmentId,
        userId: options.userId,
        calendarType: options.calendarType,
        calendarId: options.calendarId,
        icalUrl: options.icalUrl,
        syncDirection: options.syncDirection,
        syncFrequency: options.syncFrequency,
        lastSynced: new Date(),
      },
    });
    */

    return {
      success: true,
      message: "Calendar sync settings saved successfully",
    };
  } catch (error) {
    console.error("Error saving calendar sync settings:", error);
    return {
      success: false,
      message: `Error saving calendar sync settings: ${error.message}`,
    };
  }
} 