import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Define the EquipmentItem type to fix type errors
interface EquipmentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  imagesJson: string;
  tagsJson: string;
  dailyRate: number | null;
  ownerId: string;
}

// This endpoint doesn't require authentication for testing purposes
export async function GET(req: Request) {
  try {
    console.log("Test endpoint called");
    
    // Count equipment first
    const equipmentCount = await db.equipment.count();
    
    console.log(`Found ${equipmentCount} equipment items in database`);
    
    // If we have equipment, fetch a sample
    let sampleEquipment: EquipmentItem[] = [];
    if (equipmentCount > 0) {
      sampleEquipment = await db.equipment.findMany({
        take: 5,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          location: true,
          imagesJson: true,
          tagsJson: true,
          dailyRate: true,
          ownerId: true,
        }
      });
    }
    
    // Process equipment to parse JSON fields
    const processedEquipment = sampleEquipment.map(item => {
      try {
        // Parse images JSON if it exists
        let images: string[] = [];
        if (item.imagesJson) {
          try {
            images = JSON.parse(item.imagesJson);
          } catch (e) {
            console.error("Error parsing images JSON:", e);
          }
        }
        
        // Parse tags JSON if it exists
        let tags: string[] = [];
        if (item.tagsJson) {
          try {
            tags = JSON.parse(item.tagsJson);
          } catch (e) {
            console.error("Error parsing tags JSON:", e);
          }
        }
        
        return {
          ...item,
          images,
          tags,
          pricePerDay: item.dailyRate,
        };
      } catch (error) {
        console.error("Error processing equipment item:", error);
        return {
          ...item,
          images: [],
          tags: [],
          pricePerDay: item.dailyRate,
        };
      }
    });
    
    return NextResponse.json({
      status: "success",
      message: `Database connection successful. Found ${equipmentCount} equipment items.`,
      count: equipmentCount,
      equipment: processedEquipment,
    });
  } catch (error) {
    console.error("Error in test endpoint:", error);
    return NextResponse.json(
      { 
        status: "error",
        message: "Something went wrong connecting to the database",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Ensure this endpoint is never cached
export const dynamic = 'force-dynamic'; 