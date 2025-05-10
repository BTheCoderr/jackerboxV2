const bcrypt = require('bcryptjs');

async function testPasswordHashing() {
  try {
    // Test password
    const password = 'TestPassword123!';
    console.log('Original password:', password);

    // Hash password
    console.log('\nHashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Hashed password:', hashedPassword);

    // Verify correct password
    console.log('\nVerifying correct password...');
    const isValidPassword = await bcrypt.compare(password, hashedPassword);
    console.log('Password valid:', isValidPassword);

    // Verify incorrect password
    console.log('\nVerifying incorrect password...');
    const isInvalidPassword = await bcrypt.compare('WrongPassword123!', hashedPassword);
    console.log('Invalid password result:', isInvalidPassword);

    // Test with different salt rounds
    console.log('\nTesting different salt rounds...');
    console.time('Hash with 10 rounds');
    await bcrypt.hash(password, 10);
    console.timeEnd('Hash with 10 rounds');

    console.time('Hash with 12 rounds');
    await bcrypt.hash(password, 12);
    console.timeEnd('Hash with 12 rounds');

    console.log('\nPassword hashing test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Password hashing test failed:', error);
    process.exit(1);
  }
}

testPasswordHashing(); 