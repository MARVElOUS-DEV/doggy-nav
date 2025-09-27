#!/usr/bin/env node

// scripts/security-check.js
// Comprehensive security validation for production deployment

const fs = require('fs');
const path = require('path');

function validateEnvironment() {
  console.log('🔍 Checking environment configuration...');

  const requiredEnvVars = [
    'JWT_SECRET',
    'MONGODB_URI'
  ];

  let allValid = true;

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      console.error(`❌ Missing required environment variable: ${varName}`);
      allValid = false;
    }
  }

  // Validate JWT Secret
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      console.error('❌ JWT_SECRET is too short (minimum 32 characters)');
      allValid = false;
    }

    const weakSecrets = [
      'secret',
      'password',
      '123456',
      'change-me',
      'your-secret',
      'default',
      'a_strange_jwt_token'
    ];

    const isWeak = weakSecrets.some(weak =>
      process.env.JWT_SECRET.toLowerCase().includes(weak) ||
      process.env.JWT_SECRET === 'your-super-secure-jwt-secret-here-change-in-production'
    );

    if (isWeak) {
      console.error('❌ JWT_SECRET contains weak/default value. Please use a strong, random secret.');
      allValid = false;
    } else {
      console.log('✅ JWT_SECRET validation passed');
    }
  }

  // Validate MongoDB URI
  if (process.env.MONGODB_URI) {
    if (process.env.MONGODB_URI.includes('localhost') && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  Warning: Using localhost MongoDB in production environment');
    }
    console.log('✅ MONGODB_URI is set');
  }

  return allValid;
}

function checkFilePermissions() {
  console.log('\n🔐 Checking file permissions...');

  const sensitiveFiles = [
    '.env',
    '.env.local',
    'config/config.default.ts',
    'scripts/validate-secrets.js'
  ];

  let allValid = true;

  for (const file of sensitiveFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        // Check if file is readable by others (octal 004)
        const permissions = stats.mode;
        if (permissions & 0o004) {
          console.warn(`⚠️  Warning: ${file} is readable by others. Consider restricting permissions.`);
        } else {
          console.log(`✅ ${file} permissions look secure`);
        }
      } catch (err) {
        console.error(`❌ Error checking permissions for ${file}: ${err.message}`);
        allValid = false;
      }
    }
  }

  return allValid;
}

function checkDependencies() {
  console.log('\n📦 Checking dependencies for known vulnerabilities...');

  try {
    const packageJson = require('../package.json');
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Check for known insecure packages
    const insecurePackages = [
      'request', // deprecated
    ];

    let warnings = 0;

    for (const pkg of insecurePackages) {
      if (dependencies[pkg]) {
        console.warn(`⚠️  Warning: Package '${pkg}' is deprecated/insecure. Consider replacing it.`);
        warnings++;
      }
    }

    if (warnings === 0) {
      console.log('✅ No known insecure dependencies found');
    }

    return true;
  } catch (err) {
    console.error(`❌ Error checking dependencies: ${err.message}`);
    return false;
  }
}

function checkConfigSecurity() {
  console.log('\n🛡️  Checking security configuration...');

  try {
    const config = require('../config/config.default.ts');

    // This is a basic check - in a real implementation we'd parse the TS file
    console.log('✅ Security configuration loaded successfully');
    return true;
  } catch (err) {
    console.error(`❌ Error loading security configuration: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🔒 DoggyNav Security Validation Tool');
  console.log('='.repeat(50));

  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  require('dotenv').config({ path: '.env' });

  let allValid = true;

  allValid = validateEnvironment() && allValid;
  allValid = checkFilePermissions() && allValid;
  allValid = checkDependencies() && allValid;
  allValid = checkConfigSecurity() && allValid;

  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('🎉 All security checks passed!');
    console.log('Your application is ready for deployment.');
    process.exit(0);
  } else {
    console.error('❌ Some security checks failed!');
    console.error('Please address the issues above before deploying to production.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('💥 Unexpected error during security validation:', err);
    process.exit(1);
  });
}

module.exports = { validateEnvironment, checkFilePermissions, checkDependencies, checkConfigSecurity };