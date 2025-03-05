#!/bin/bash
set -e

echo "Starting Jackerbox landing page deployment..."

# Create a public directory for the landing page
mkdir -p public

# Create a simple index.html file
cat > public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Jackerbox - Equipment Rental Marketplace</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
    body {
      background-color: #f5f5f7;
      color: #333;
      line-height: 1.6;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background-color: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #0070f3;
      text-decoration: none;
    }
    nav a {
      margin-left: 20px;
      color: #333;
      text-decoration: none;
    }
    nav a:hover {
      color: #0070f3;
    }
    main {
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
    }
    .card {
      background-color: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    h1 {
      font-size: 32px;
      margin-bottom: 20px;
      color: #0070f3;
    }
    h2 {
      font-size: 24px;
      margin: 30px 0 15px;
      color: #333;
    }
    p {
      margin-bottom: 15px;
      font-size: 16px;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .feature {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
      text-align: center;
    }
    .feature h3 {
      margin-bottom: 10px;
      color: #0070f3;
    }
    .button {
      display: inline-block;
      background-color: #0070f3;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      text-decoration: none;
      font-weight: 500;
      margin-top: 10px;
    }
    .button:hover {
      background-color: #005cc5;
    }
    .status-message {
      background-color: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 5px 5px 0;
    }
    footer {
      text-align: center;
      margin-top: 60px;
      color: #666;
      padding-bottom: 40px;
    }
  </style>
</head>
<body>
  <header>
    <a href="/" class="logo">Jackerbox</a>
    <nav>
      <a href="/">Home</a>
      <a href="#features">Features</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>

  <main>
    <div class="card">
      <h1>Welcome to Jackerbox</h1>
      <p>The equipment rental marketplace that connects people with the gear they need.</p>
      
      <div class="status-message">
        <strong>Site Status:</strong> Our main application is currently under maintenance. This is a temporary landing page while we complete our updates.
      </div>
      
      <h2 id="features">Key Features</h2>
      <div class="features">
        <div class="feature">
          <h3>Rent Equipment</h3>
          <p>Find and rent equipment from people in your area.</p>
        </div>
        <div class="feature">
          <h3>List Your Gear</h3>
          <p>Make money by renting out your equipment.</p>
        </div>
        <div class="feature">
          <h3>Secure Payments</h3>
          <p>Safe and secure payment processing.</p>
        </div>
      </div>
      
      <h2 id="contact">Contact Us</h2>
      <p>If you have any questions or need assistance, please contact our support team at support@jackerbox.com</p>
    </div>
  </main>
  
  <footer>
    <p>&copy; 2024 Jackerbox. All rights reserved.</p>
  </footer>
</body>
</html>
EOL

# Create a simple netlify.toml file for direct HTML hosting
cat > netlify.toml << 'EOL'
[build]
  publish = "public"

# No build command needed for static HTML
EOL

# Deploy to Netlify
echo "Deploying landing page to Netlify..."
netlify deploy --prod --dir=public

echo "Deployment completed successfully!"
echo "Your site should now be live at https://jackerbox.netlify.app" 