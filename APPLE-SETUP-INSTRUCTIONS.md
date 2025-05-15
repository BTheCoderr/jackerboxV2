# Apple Sign-In Configuration Instructions

## 1. Get the Key File
- Download your `.p8` private key file from Apple Developer Portal
- Save this file in the 'credentials' directory as 'apple-private-key.p8'
- IMPORTANT: Do not modify the file contents at all

## 2. Update Your .env File
Add the following variables:
```
APPLE_TEAM_ID=your_team_id
APPLE_CLIENT_ID=your_client_id 
APPLE_KEY_ID=your_key_id
APPLE_PRIVATE_KEY_PATH="credentials/apple-private-key.p8"
```

## 3. Test the Configuration
- Run the test endpoint: `curl http://localhost:3001/api/auth/test-apple`
- If successful, you should see a valid token

## Notes
- The error "secretOrPrivateKey must be an asymmetric key" means the key format is incorrect or the file isn't being read properly
- Apple `.p8` keys must be used with the ES256 algorithm
- Never share or commit your private key file to version control

## Creating Keys in Apple Developer Portal
1. Go to https://developer.apple.com/account
2. Navigate to "Certificates, Identifiers & Profiles"
3. Go to "Keys" and click the "+" button
4. Name your key and enable "Sign In with Apple"
5. Download the key file (you can only download it once)
6. The key ID is displayed on the key details page
7. Your Team ID can be found in the top-right of your account page 