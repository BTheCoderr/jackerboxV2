// Local-only helper. Supply credentials through environment variables, never source control.
// Example: DATABASE_URL=... DIRECT_DATABASE_URL=... node scripts/update-neon-db.js
const fs = require('node:fs');
const path = require('node:path');

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_DATABASE_URL || process.env.DIRECT_URL || databaseUrl;

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Supply it through your shell or a secret manager.');
  process.exit(1);
}

for (const [name, value] of [
  ['DATABASE_URL', databaseUrl],
  ['DIRECT_DATABASE_URL', directUrl],
]) {
  try {
    const parsed = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
      throw new Error('invalid protocol');
    }
    if (/[\r\n]/.test(value)) throw new Error('invalid newline');
  } catch {
    console.error(`${name} must be a valid PostgreSQL connection URL.`);
    process.exit(1);
  }
}

function setEnvironmentVariable(content, name, value) {
  const line = `${name}=${JSON.stringify(value)}`;
  const pattern = new RegExp(`^${name}=.*$`, 'm');
  return pattern.test(content)
    ? content.replace(pattern, () => line)
    : `${content.replace(/\s*$/, '')}\n${line}\n`;
}

const outputFile = path.join(process.cwd(), '.env.local');
let content = fs.existsSync(outputFile)
  ? fs.readFileSync(outputFile, 'utf8')
  : '';
content = setEnvironmentVariable(content, 'DATABASE_URL', databaseUrl);
content = setEnvironmentVariable(content, 'DIRECT_DATABASE_URL', directUrl);
fs.writeFileSync(outputFile, content, { mode: 0o600 });
fs.chmodSync(outputFile, 0o600);
console.log('Updated local environment file using environment-provided URLs (values not logged).');
console.log('For hosted environments, configure credentials through the hosting provider instead.');
