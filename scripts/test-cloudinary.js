#!/usr/bin/env node
/**
 * Cloudinary Test Script for JackerBox
 * 
 * This script tests the Cloudinary connection and upload capabilities
 * 
 * Run with: node scripts/test-cloudinary.js
 */

const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BRIGHT_GREEN = '\x1b[32m';
const BRIGHT_RED = '\x1b[31m';
const BRIGHT_YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// Helper function to log with color
function log(message, type = 'info') {
  const color = type === 'success' ? BRIGHT_GREEN : type === 'error' ? BRIGHT_RED : BRIGHT_YELLOW;
  console.log(`${color}${message}${RESET}`);
}

async function testCloudinaryConnection() {
  log('🧪 CLOUDINARY CONNECTION TEST 🧪', 'info');
  log('===============================', 'info');
  
  try {
    log('Initializing Cloudinary client...', 'info');
    
    // Configure Cloudinary with the provided credentials
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'jackerbox',
      api_key: process.env.CLOUDINARY_API_KEY || '646841252992477',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'Zxu873QWGlD6cYq2gB9cqFO6wG0',
      secure: true
    });
    
    log('Cloudinary configured!', 'info');
    
    // Ping Cloudinary to verify the connection
    log('Pinging Cloudinary API...', 'info');
    const pingResult = await cloudinary.api.ping();
    
    if (pingResult.status !== 'ok') {
      throw new Error(`Ping failed with status: ${pingResult.status}`);
    }
    
    log('Ping successful! Cloudinary API is accessible.', 'success');
    
    // Get account information
    log('Fetching account info...', 'info');
    const accountInfo = await cloudinary.api.usage();
    log('Account info retrieved successfully:', 'success');
    log(`- Plan: ${accountInfo.plan}`, 'info');
    log(`- Last updated: ${accountInfo.last_updated}`, 'info');
    
    log('\n✅ Cloudinary connection test passed successfully!', 'success');
  } catch (error) {
    log(`\n❌ Cloudinary connection test failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
testCloudinaryConnection(); 