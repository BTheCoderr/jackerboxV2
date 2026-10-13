import 'dotenv/config';

// Never copy or print secret material. This is a read-only configuration check.
const required = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME'];
const missing = required.filter(name => !process.env[name]);
const withWhitespace = required.filter(name => {
  const value = process.env[name];
  return !!value && value !== value.trim();
});
if (missing.length || withWhitespace.length) {
  if (missing.length) console.error('Missing AWS settings:', missing.join(', '));
  if (withWhitespace.length) console.error('AWS settings with surrounding whitespace:', withWhitespace.join(', '));
  process.exitCode = 1;
} else {
  console.log('AWS S3 configuration is present and free of surrounding whitespace.');
}
