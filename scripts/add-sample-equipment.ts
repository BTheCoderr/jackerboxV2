#!/usr/bin/env npx tsx

import 'dotenv/config';
import { PrismaClient } from '../prisma/generated/client';

const prisma = new PrismaClient();

async function addSampleEquipment() {
  console.log('🎬 Adding sample equipment for testing...');

  try {
    // Create sample equipment items
    const equipment = [
      {
        title: 'Canon EOS R5 Camera',
        description: 'Professional mirrorless camera perfect for photo and video projects. 45MP full-frame sensor with 8K video recording.',
        category: 'cameras',
        subcategory: 'mirrorless',
        condition: 'EXCELLENT',
        location: 'Los Angeles, CA',
        hourlyRate: 25.00,
        dailyRate: 150.00,
        weeklyRate: 800.00,
        imagesJson: JSON.stringify(['/images/canon-r5.svg']),
        tagsJson: JSON.stringify(['camera', 'mirrorless', 'professional', '8k', 'video']),
        latitude: 34.0522,
        longitude: -118.2437,
        isAvailable: true,
        ownerId: '1' // We'll create a sample user
      },
      {
        title: 'Sony A7S III',
        description: 'Low-light specialist camera ideal for cinematic video work. 4K 120p recording capability.',
        category: 'cameras',
        subcategory: 'mirrorless',
        condition: 'EXCELLENT',
        location: 'New York, NY',
        hourlyRate: 30.00,
        dailyRate: 180.00,
        weeklyRate: 950.00,
        imagesJson: JSON.stringify(['/images/sony-a7s3.svg']),
        tagsJson: JSON.stringify(['camera', 'low-light', 'video', 'cinematic']),
        latitude: 40.7128,
        longitude: -74.0060,
        isAvailable: true,
        ownerId: '1'
      },
      {
        title: 'DJI Ronin 4D Cinema Camera',
        description: 'All-in-one cinema camera with built-in gimbal. Perfect for professional film production.',
        category: 'cameras',
        subcategory: 'cinema',
        condition: 'GOOD',
        location: 'San Francisco, CA',
        hourlyRate: 50.00,
        dailyRate: 300.00,
        weeklyRate: 1800.00,
        imagesJson: JSON.stringify(['/images/dji-ronin-4d.svg']),
        tagsJson: JSON.stringify(['camera', 'cinema', 'gimbal', 'professional']),
        latitude: 37.7749,
        longitude: -122.4194,
        isAvailable: true,
        ownerId: '1'
      },
      {
        title: 'RED Komodo 6K Camera',
        description: 'Compact cinema camera for high-end production. 6K recording with REDcode RAW.',
        category: 'cameras',
        subcategory: 'cinema',
        condition: 'EXCELLENT',
        location: 'Austin, TX',
        hourlyRate: 75.00,
        dailyRate: 450.00,
        weeklyRate: 2700.00,
        imagesJson: JSON.stringify(['/images/red-komodo.svg']),
        tagsJson: JSON.stringify(['camera', 'cinema', '6k', 'raw', 'professional']),
        latitude: 30.2672,
        longitude: -97.7431,
        isAvailable: true,
        ownerId: '1'
      },
      {
        title: 'MacBook Pro M3 Max',
        description: 'Latest MacBook Pro with M3 Max chip. Perfect for video editing and post-production work.',
        category: 'computers',
        subcategory: 'laptops',
        condition: 'EXCELLENT',
        location: 'Seattle, WA',
        hourlyRate: 20.00,
        dailyRate: 120.00,
        weeklyRate: 600.00,
        imagesJson: JSON.stringify(['/images/macbook-pro.svg']),
        tagsJson: JSON.stringify(['laptop', 'editing', 'post-production', 'apple']),
        latitude: 47.6062,
        longitude: -122.3321,
        isAvailable: true,
        ownerId: '1'
      },
      {
        title: 'Godox AD600Pro Flash',
        description: 'Powerful portable flash for professional photography. Battery-powered with wireless control.',
        category: 'lighting',
        subcategory: 'flash',
        condition: 'GOOD',
        location: 'Miami, FL',
        hourlyRate: 15.00,
        dailyRate: 90.00,
        weeklyRate: 450.00,
        imagesJson: JSON.stringify(['/images/godox-flash.svg']),
        tagsJson: JSON.stringify(['lighting', 'flash', 'photography', 'portable']),
        latitude: 25.7617,
        longitude: -80.1918,
        isAvailable: true,
        ownerId: '1'
      }
    ];

    // First, create a sample user if one doesn't exist
    let sampleUser;
    try {
      sampleUser = await prisma.user.upsert({
        where: { email: 'owner@jackerbox.com' },
        update: {},
        create: {
          email: 'owner@jackerbox.com',
          name: 'Equipment Owner',
          image: null
        }
      });
      console.log('✅ Sample user created/found');
    } catch (error) {
      console.log('⚠️ Could not create sample user, using default ownerId');
    }

    // Add equipment with proper ownerId
    for (const item of equipment) {
      try {
        const created = await prisma.equipment.create({
          data: {
            ...item,
            ownerId: sampleUser?.id || '1'
          }
        });
        console.log(`✅ Added: ${created.title}`);
      } catch (error) {
        console.log(`❌ Failed to add ${item.title}:`, error);
      }
    }

    console.log('🎉 Sample equipment added successfully!');
    console.log('📊 You can now test equipment browsing');

  } catch (error) {
    console.error('❌ Error adding sample equipment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleEquipment(); 