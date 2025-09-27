#!/usr/bin/env node

// scripts/validate-secrets.js
// Validate that critical environment variables are set properly

const fs = require('fs');
const path = require('path');

function validateSecret(secret, name, minLength = 32) {
  if (!secret) {
    console.error(`❌ Missing required environment variable: ${name}`);
    return false;
  }

  if (secret.length < minLength) {
    console.error(`❌ ${name} is too short (minimum ${minLength} characters)`);
    return false;
  }

  // Check for common weak secrets
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
    secret.toLowerCase().includes(weak) || secret === 'your-super-secure-jwt-secret-here-change-in-production'
  );

  if (isWeak) {
    console.error(`❌ ${name} contains weak/default value. Please use a strong, random secret.`);
    return false;
  }

  console.log(`✅ ${name} validation passed`);
  return true;
}

function main() {
  console.log('🔒 Validating security configuration...\n');

  // Load environment variables
  const jwtSecret = process.env.JWT_SECRET;

  let allValid = true;

  // Validate JWT secret
  allValid = validateSecret(jwtSecret, 'JWT_SECRET') && allValid;

  // Additional checks for production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'a_strange_jwt_token_when_you_see_it') {
      console.error('❌ Critical: Using default JWT secret in production!');
      allValid = false;
    }

    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost')) {
      console.warn('⚠️  Warning: Using local MongoDB in production environment');
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('🎉 All security validations passed!');
    process.exit(0);
  } else {
    console.error('❌ Security validation failed!');
    console.error('Please fix the issues above before starting the server.');
    process.exit(1);
  }
}

main();