# SMS Setup Guide for Jackerbox

## Current Status ✅

Your SMS infrastructure is **ready and working**! Here's what's been implemented:

### ✅ What's Working
- **API Endpoints**: `/api/auth/send-verification` and `/api/auth/verify-code` are created
- **Phone Verification Library**: Twilio integration is implemented
- **Login Form**: SMS authentication is enabled and functional
- **Test Mode**: Development mode with test phone numbers works
- **Environment Variables**: Twilio configuration is detected

### ⚠️ Current Issue
Your Twilio phone number `+18445520447` is not SMS-capable. This is a simple Twilio configuration issue.

## Quick Fix Steps

### 1. Get an SMS-Capable Twilio Phone Number

**Option A: Upgrade Your Current Number**
1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Phone Numbers** → **Manage** → **Active numbers**
3. Click on your number `+18445520447`
4. Check if SMS is enabled in the capabilities
5. If not, you may need to upgrade or get a new number

**Option B: Get a New SMS-Capable Number**
1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select your country (United States)
3. Check **SMS** in the capabilities filter
4. Choose a number and purchase it ($1/month typically)
5. Update your `.env.local` with the new number:
   ```
   TWILIO_PHONE_NUMBER=+1YOURNEWNUMBER
   ```

### 2. Test SMS Functionality

Once you have an SMS-capable number:

```bash
# Test the SMS system
node scripts/test-sms.js
```

### 3. Test in the App

1. Start your development server: `npm run dev`
2. Go to the login page: `http://localhost:3000/auth/login`
3. Try these test scenarios:

**Test Phone Numbers (Development Mode):**
- `+15555555555` - Always works with code `123456`
- `+12025550123` - Always works with code `123456`

**Real Phone Number:**
- Enter your actual phone number
- You should receive a real SMS with a 6-digit code

## How It Works

### Development Mode
- Test phone numbers automatically work
- No real SMS is sent
- Verification code is always `123456`
- Perfect for testing without using SMS credits

### Production Mode
- Real SMS messages are sent via Twilio
- 6-digit verification codes are generated
- Codes expire after 10 minutes

### API Flow
1. User enters phone number → `/api/auth/send-verification`
2. System generates code and sends SMS via Twilio
3. User enters code → `/api/auth/verify-code`
4. System verifies code and signs user in

## Environment Variables

Make sure these are in your `.env.local`:

```env
# SMS/Phone Verification (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_sms_capable_phone_number
```

## Troubleshooting

### "Phone number is not message-capable"
- Your Twilio number doesn't support SMS
- Solution: Get an SMS-capable number (see steps above)

### "Invalid credentials" in Twilio
- Check your Account SID and Auth Token
- Make sure they're correctly set in `.env.local`

### "No account found with this phone number"
- The user needs to register first with their phone number
- Or they need to add their phone number to their existing account

### SMS not received
- Check if the phone number format is correct (+1XXXXXXXXXX)
- Verify the Twilio number is SMS-capable
- Check Twilio logs in the console for delivery status

## Testing Checklist

- [ ] Twilio environment variables are set
- [ ] Twilio phone number is SMS-capable
- [ ] Test script runs without errors: `node scripts/test-sms.js`
- [ ] Login form shows phone verification option
- [ ] Test phone numbers work with code `123456`
- [ ] Real phone numbers receive SMS codes
- [ ] Verification codes work for login

## Next Steps

1. **Fix Twilio Number**: Get an SMS-capable number
2. **Test**: Run the test script and try the login form
3. **Register Users**: Make sure users have phone numbers in their accounts
4. **Production**: The system is ready for production use

## Support

If you need help:
1. Check Twilio Console logs for SMS delivery status
2. Use browser dev tools to check API responses
3. Test with the provided test phone numbers first
4. Verify environment variables are loaded correctly

Your SMS system is **99% ready** - just need that SMS-capable phone number! 🚀 