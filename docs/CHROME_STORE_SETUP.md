# Chrome Web Store Publishing Setup

This guide covers how to set up GitHub secrets for automating extension publishing to the Chrome Web Store.

## Prerequisites

- Chrome extension already registered on Chrome Web Store
- Google Cloud project created and linked to your Google account

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name it: `njw-xarvis-publishing`
4. Click "Create"

## Step 2: Enable Chrome Web Store API

1. In Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Chrome Web Store API"
3. Click on it and press "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Desktop application"
4. Name it: `njw-xarvis-cws-publisher`
5. Click "Create"
6. Click on the credential to view details
7. Copy the **Client ID** and **Client Secret** (you'll need these later)

## Step 4: Get Refresh Token

You need to generate a refresh token by authenticating once with OAuth:

```bash
# Replace CLIENT_ID and CLIENT_SECRET with your actual values
CLIENT_ID="your-client-id-here"
CLIENT_SECRET="your-client-secret-here"

# Step 1: Get authorization URL
echo "Visit this URL in your browser:"
echo "https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&redirect_uri=urn:ietf:wg:oauth:2.0:oob&access_type=offline"

# Step 2: You'll get an authorization code
# Step 3: Exchange it for tokens
AUTHORIZATION_CODE="the-code-from-browser"

curl -X POST https://oauth2.googleapis.com/token \
  -d "client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${AUTHORIZATION_CODE}&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob"

# This returns JSON with refresh_token - save it!
```

## Step 5: Get Extension ID

1. Go to [Chrome Web Store](https://chrome.google.com/webstore/)
2. Search for "njw-xarvis" and click your extension
3. The URL will be: `https://chrome.google.com/webstore/detail/[EXTENSION_ID]/`
4. Copy the `EXTENSION_ID` portion

## Step 6: Store Secrets in GitHub

```bash
# Set each secret in the repository
gh secret set CHROME_EXTENSION_CLIENT_ID \
  --repo Not-Just-Web/njw-xarvis \
  --body "your-client-id"

gh secret set CHROME_EXTENSION_CLIENT_SECRET \
  --repo Not-Just-Web/njw-xarvis \
  --body "your-client-secret"

gh secret set CHROME_EXTENSION_REFRESH_TOKEN \
  --repo Not-Just-Web/njw-xarvis \
  --body "your-refresh-token"

gh secret set CHROME_EXTENSION_ID \
  --repo Not-Just-Web/njw-xarvis \
  --body "your-extension-id"
```

Or via GitHub UI:
1. Go to [Repository Settings → Secrets](https://github.com/Not-Just-Web/njw-xarvis/settings/secrets/actions)
2. Click "New repository secret"
3. Add each of the 4 secrets listed above

## Step 7: Enable Publishing Workflow

Once secrets are configured:

1. Go to [Actions → Publish Chrome Extension](https://github.com/Not-Just-Web/njw-xarvis/actions/workflows/publish-chrome.yml)
2. Click "Run workflow" to manually publish
3. Or configure GitHub to auto-publish on releases

## Testing

To test the setup without publishing:

```bash
# This will build the extension
yarn build:chromium

# You can manually upload the zip to Chrome Web Store to test
```

## Troubleshooting

**"Invalid refresh token"**
- Refresh tokens expire after 6 months of non-use
- Regenerate using the OAuth flow in Step 4

**"Insufficient permissions"**
- Ensure your Google account is an owner of the Chrome Web Store extension
- Check that the OAuth app has "Chrome Web Store" scope enabled

**"Extension ID not found"**
- Make sure you're using the ID from the store URL, not the internal manifest ID
- Re-register the extension on Chrome Web Store if needed

## Security Notes

⚠️ **Never commit secrets to Git**
- Store them only in GitHub Secrets or environment variables
- The `.gitignore` already excludes `.env` files

💡 **Rotate secrets regularly**
- Periodically generate new OAuth credentials
- Update GitHub secrets with new tokens

🔐 **Restrict access**
- Only repository maintainers should have access to secrets
- Use branch protection rules to require review before publishing
