# AI Assistant Connector API

Secure backend service for the AI Assistant Extension that handles:
- Token exchange and JWT generation
- Provider API key management
- Proxying requests to AI providers (Gemini, Claude, ChatGPT)
- Authentication flow coordination

## Why a Connector API?

The extension never stores provider API keys directly. Instead:
1. Extension sends user credentials to the Connector API
2. Connector API validates credentials and returns a JWT token
3. Extension uses JWT token to proxy requests through the Connector API
4. Connector API holds the actual API keys and proxies requests securely

This prevents API keys from being exposed in browser storage.

## Getting Started

### Installation

```bash
cd connector-api
npm install
```

### Development

```bash
# Start dev server with auto-reload
npm run dev

# Server runs on http://localhost:3001
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
Response: { status: 'ok', version: '1.0.0', timestamp: '...' }
```

### Authentication

#### Exchange Credentials for Token
```
POST /auth/token
Content-Type: application/json

{
  "extensionId": "your-extension-id",
  "providerId": "gemini|claude|chatgpt",
  "credentials": {
    "apiKey": "provider-api-key"
  }
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "provider": "gemini",
  "message": "Token granted successfully"
}
```

#### Validate Token
```
POST /auth/validate
{
  "token": "jwt-token",
  "extensionId": "extension-id",
  "providerId": "gemini"
}

Response:
{ "valid": true, "provider": "gemini" }
```

#### Refresh Token
```
POST /auth/refresh
{
  "token": "jwt-token",
  "extensionId": "extension-id",
  "providerId": "gemini"
}

Response:
{
  "token": "new-jwt-token",
  "expiresIn": 86400
}
```

#### Revoke Token (Logout)
```
POST /auth/revoke
{
  "extensionId": "extension-id",
  "providerId": "gemini"
}

Response:
{ "revoked": true, "provider": "gemini" }
```

### Provider Proxying

#### Send Message to Provider
```
POST /provider/message
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "model": "gemini-2.0-flash",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ]
}

Response:
{
  "text": "Hello! How can I help you?",
  "model": "gemini-2.0-flash",
  "provider": "gemini"
}
```

#### Check Provider Health
```
GET /provider/health
Response: { providers: { gemini: { status: 'healthy' }, ... } }

GET /provider/gemini/health
Response: { provider: 'gemini', status: 'healthy' }
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key settings:
- `PORT`: Server port (default 3001)
- `JWT_SECRET`: Secret key for signing tokens (change in production!)
- `ALLOWED_ORIGINS`: CORS origins for extension
- `NODE_ENV`: development or production

## Security Considerations

1. **API Keys**: Stored securely in-memory or database (never logged/exposed)
2. **JWT Tokens**: Short-lived (24h default), signed with secret
3. **CORS**: Restricted to allowed origins (extension URLs)
4. **Request Logging**: Request IDs for audit trail
5. **Error Handling**: Minimal error details in responses (full details in logs)

## Deployment

### Docker (example)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm ci --omit=dev
COPY dist .
CMD ["node", "dist/index.js"]
```

### Environment Variables Required for Production

- `JWT_SECRET`: Strong secret key
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to "production"
- `ALLOWED_ORIGINS`: Exact extension IDs for production

## Testing

```bash
npm test
```

## Architecture

```
Extension (Browser)
    ↓
    ↓ POST /auth/token (credentials)
    ↓
Connector API
    ↓
    ↓ Returns JWT
    ↓
Extension (Browser)
    ↓
    ↓ POST /provider/message (with JWT)
    ↓
Connector API
    ↓
    ↓ Uses stored API key to proxy request
    ↓
Provider API (Gemini/Claude/ChatGPT)
    ↓
    ↓ Response
    ↓
Connector API
    ↓
    ↓ Returns normalized response
    ↓
Extension (Browser)
```

## Next Steps

- [ ] Add database layer (PostgreSQL)
- [ ] Implement rate limiting per extension
- [ ] Add usage tracking and metrics
- [ ] Support OAuth flows for provider APIs
- [ ] Add request signing/verification
- [ ] Deploy to production environment
- [ ] Add monitoring and alerting

## License

MIT
