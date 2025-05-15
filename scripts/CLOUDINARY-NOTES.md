# Cloudinary Integration Notes

## Configuration

The correct Cloudinary credentials for JackerBox are:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dgtqpyphg
CLOUDINARY_API_KEY=646841252992477
CLOUDINARY_API_SECRET=Zxu873QWGlD6cYq2gB9cqFO6wG0
CLOUDINARY_URL=cloudinary://646841252992477:Zxu873QWGlD6cYq2gB9cqFO6wG0@dgtqpyphg
```

These credentials have been updated in the `ENV-EXAMPLE.md` documentation.

## Test Scripts

Several test scripts have been created to test Cloudinary functionality:

1. **Basic Connection Test**  
   `node scripts/test-cloudinary.js`  
   This script tests basic connectivity to the Cloudinary API.

2. **Simple Text File Upload**  
   `node scripts/upload-simple.js`  
   This script tests uploading a simple text file as a raw resource.

3. **SVG Image Upload**  
   `node scripts/upload-image.js`  
   This script tests uploading an SVG image.

## Environment Variables

To set the Cloudinary environment variables in your shell session, use:

```bash
source ./scripts/set-cloudinary-env.sh
```

## Testing Results

All tests succeeded with the correct credentials:

- ✅ Connection to Cloudinary API works
- ✅ File upload works (raw files)
- ✅ Image upload works (SVG files)

## Current Environment Settings

The current `.env` file has:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="local-dev"
CLOUDINARY_API_KEY="dummy-key"
CLOUDINARY_API_SECRET="dummy-secret"
```

These need to be updated to the correct values.

## Upload Preset

The application uses an upload preset named `jackerbox_uploads` (found in `src/components/ui/cloudinary-upload.tsx`). This preset may need to be created in the Cloudinary dashboard if it doesn't exist.

## Troubleshooting

If you encounter any issues with Cloudinary:

1. Ensure you're using the correct cloud name: `dgtqpyphg` (not `jackerbox` or `local-dev`)
2. Check that API key and secret are correct
3. For browser uploads, ensure the `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` environment variable is set correctly
4. For server-side uploads, ensure both `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are set
5. Verify that the upload preset `jackerbox_uploads` exists in your Cloudinary account

## Next Steps

1. Update your `.env` file with:
   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="dgtqpyphg"
   CLOUDINARY_API_KEY="646841252992477"
   CLOUDINARY_API_SECRET="Zxu873QWGlD6cYq2gB9cqFO6wG0"
   ```

2. Log into your Cloudinary dashboard and create an upload preset named `jackerbox_uploads` if it doesn't exist:
   - Go to Settings > Upload
   - Scroll to Upload presets
   - Click "Add upload preset"
   - Name it `jackerbox_uploads`
   - Configure settings as needed (unsigned uploads, folder path, etc.)

3. For deployment, update your environment variables on Vercel or your hosting platform

4. Use the `scripts/set-cloudinary-env.sh` script during development to ensure the correct variables are set 