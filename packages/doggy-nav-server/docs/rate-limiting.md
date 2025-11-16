# Rate Limiting Implementation

This document describes the rate limiting implementation for the doggy-nav-server backend API.

## Overview

The rate limiting system uses a two-layer approach:

1. **Basic Layer**: `egg-ratelimiter` plugin for simple IP-based rate limiting
2. **Advanced Layer**: Custom middleware for user-based and per-route rate limiting

## Configuration

### Environment Variables

```bash
# Rate limit values (requests per minute)
RATE_LIMIT_ANON=100        # Anonymous users
RATE_LIMIT_AUTH=200        # Authenticated users
RATE_LIMIT_ADMIN=500       # Admin users

# Whitelist/blacklist (comma-separated IPs or keys)
RATE_LIMIT_WHITELIST=127.0.0.1,192.168.1.1
RATE_LIMIT_BLACKLIST=1.2.3.4,5.6.7.8
```

### Default Limits

- **Anonymous users**: 100 requests per minute (by IP)
- **Authenticated users**: 200 requests per minute (by user ID)
- **Admin users**: 500 requests per minute (by user ID)

### Per-Route Overrides

Some routes have stricter or more lenient limits:

- **Login** (`/api/auth/login`): 10 requests per 5 minutes
- **Registration** (`/api/auth/register`): 5 requests per 5 minutes
- **Password reset** (`/api/auth/reset-password`): 3 requests per 5 minutes
- **Admin routes** (`/api/admin/*`): 1000 requests per minute

### Exempt Paths

The following paths are exempt from rate limiting:

- `/health`
- `/api/system/version`
- `/favicon.ico`

## Implementation Details

### Middleware Stack

The middleware is applied in this order:

1. `error` - Error handling
2. `ioc` - Dependency injection
3. `auth` - Authentication
4. `rateLimit` - Rate limiting

### Key Generation

- **Anonymous users**: `ip:{IP_ADDRESS}`
- **Authenticated users**: `user:{USER_ID}`

### Storage

- **Memory storage**: Default for single-instance deployments
- **Redis storage**: Used when Redis is available for distributed deployments

## Rate Limit Headers

All responses include rate limit information:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

When rate limit is exceeded:

- Status: `429 Too Many Requests`
- `Retry-After`: Seconds to wait before retrying
- JSON response with error details

## Monitoring

### Logs

Rate limiting events are logged at the error level:

```typescript
ctx.app.logger.error('Rate limiting error:', error);
```

### Metrics

The system tracks:

- Requests per user/IP
- Rate limit violations
- Reset times

## Testing

Run the rate limiting tests:

```bash
pnpm -F doggy-nav-server test-local -- --grep "rateLimit"
```

## Troubleshooting

### Common Issues

1. **Rate limiter not working**: Check that plugin is enabled in `config/plugin.ts`
2. **Memory leaks**: Ensure Redis is configured for distributed deployments
3. **Incorrect limits**: Verify environment variables are set correctly

### Debug Mode

Enable debug logging to see rate limiting decisions:

```bash
DEBUG=egg:ratelimiter pnpm -F doggy-nav-server dev
```

## Security Considerations

- Rate limiting helps prevent brute force attacks
- Admin routes have higher limits but should still be monitored
- Whitelist trusted IPs for critical operations
- Blacklist known malicious IPs

## Performance Impact

- Minimal overhead for allowed requests
- Redis storage recommended for high-traffic deployments
- Memory usage scales with number of active users/IPs
