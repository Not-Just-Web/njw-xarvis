#!/bin/bash
# Chrome Web Store Publishing Setup Helper
# This script helps you set up GitHub secrets for Chrome Web Store publishing

set -e

echo "🔐 Chrome Web Store Publishing Setup"
echo "===================================="
echo ""
echo "This script will help you configure GitHub secrets for publishing to Chrome Web Store"
echo ""

# Validate gh CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not found. Install from: https://cli.github.com/"
    exit 1
fi

echo "📝 You'll need these 4 values from Chrome Web Store developer console:"
echo "   1. Client ID (from Google Cloud OAuth app)"
echo "   2. Client Secret (from Google Cloud OAuth app)"
echo "   3. Refresh Token (generated via OAuth flow)"
echo "   4. Extension ID (from your extension's store URL)"
echo ""
echo "See docs/CHROME_STORE_SETUP.md for detailed setup instructions"
echo ""

# Prompt for credentials
read -p "Enter CHROME_EXTENSION_CLIENT_ID: " CLIENT_ID
if [ -z "$CLIENT_ID" ]; then
    echo "❌ Client ID cannot be empty"
    exit 1
fi

read -sp "Enter CHROME_EXTENSION_CLIENT_SECRET: " CLIENT_SECRET
echo ""
if [ -z "$CLIENT_SECRET" ]; then
    echo "❌ Client Secret cannot be empty"
    exit 1
fi

read -sp "Enter CHROME_EXTENSION_REFRESH_TOKEN: " REFRESH_TOKEN
echo ""
if [ -z "$REFRESH_TOKEN" ]; then
    echo "❌ Refresh Token cannot be empty"
    exit 1
fi

read -p "Enter CHROME_EXTENSION_ID: " EXTENSION_ID
if [ -z "$EXTENSION_ID" ]; then
    echo "❌ Extension ID cannot be empty"
    exit 1
fi

echo ""
echo "✅ Setting GitHub secrets..."
echo ""

# Set secrets
gh secret set CHROME_EXTENSION_CLIENT_ID --body "$CLIENT_ID" --repo Not-Just-Web/njw-xarvis
echo "✓ CHROME_EXTENSION_CLIENT_ID set"

gh secret set CHROME_EXTENSION_CLIENT_SECRET --body "$CLIENT_SECRET" --repo Not-Just-Web/njw-xarvis
echo "✓ CHROME_EXTENSION_CLIENT_SECRET set"

gh secret set CHROME_EXTENSION_REFRESH_TOKEN --body "$REFRESH_TOKEN" --repo Not-Just-Web/njw-xarvis
echo "✓ CHROME_EXTENSION_REFRESH_TOKEN set"

gh secret set CHROME_EXTENSION_ID --body "$EXTENSION_ID" --repo Not-Just-Web/njw-xarvis
echo "✓ CHROME_EXTENSION_ID set"

echo ""
echo "🎉 All secrets configured!"
echo ""
echo "Next steps:"
echo "1. Go to: https://github.com/Not-Just-Web/njw-xarvis/settings/secrets/actions"
echo "2. Verify all 4 secrets are listed"
echo "3. Run publish workflow: gh workflow run publish-chrome.yml --repo Not-Just-Web/njw-xarvis"
echo ""
