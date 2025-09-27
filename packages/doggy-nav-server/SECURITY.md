# Security Configuration

This document explains how to properly configure security settings for production deployment.

## Environment Variables

Create a `.env` file in the root of the project with the following variables:

```env
# Server configuration
PORT=3002
NODE_ENV=production

# Security
JWT_SECRET=your-very-long-random-secret-here-minimum-32-characters
MONGODB_URI=mongodb://username:password@host:port/database

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Features

1. **Rate Limiting**: Enabled by default (100 requests per minute)
2. **Input Sanitization**: Automatic XSS protection for all inputs
3. **Response Sanitization**: Prevents sensitive data leakage
4. **Security Headers**: CSP, HSTS, XSS protection headers
5. **Strong Password Requirements**: Passwords must be 6+ characters with uppercase, lowercase, and numbers
6. **Client Secret Authentication**: For secure API access

## Validation Scripts

Before starting the server in production, run:

```bash
npm run validate-secrets
```

This will verify that all security-critical environment variables are properly set.

## Production Checklist

- [ ] Change default JWT secret
- [ ] Use strong MongoDB credentials
- [ ] Enable HTTPS in production
- [ ] Restrict file permissions on `.env` files
- [ ] Run security validation script
- [ ] Monitor logs for security events