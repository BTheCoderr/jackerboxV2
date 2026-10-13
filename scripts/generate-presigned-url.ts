import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { getSignedUploadUrl } from '../src/lib/aws/s3-service';

async function main() {
  const key = `temporary-test/${randomUUID()}.txt`;
  const contentType = 'text/plain';
  const signedUrl = await getSignedUploadUrl(key, contentType, 300);
  console.log('Presigned test upload URL (expires in 5 minutes):');
  console.log(signedUrl);
  console.log('S3 object key:', key);
}
main().catch(error => {
  console.error('Unable to sign an S3 test upload:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
