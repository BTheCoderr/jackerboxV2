// This file is used to handle Next.js server-side rendering on Netlify
// It's a simple proxy to the Next.js server

export default async function handler(event, context) {
  // This function will be replaced by the @netlify/plugin-nextjs plugin
  // It's just a placeholder to ensure the directory structure is created
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Next.js server handler" }),
  };
} 