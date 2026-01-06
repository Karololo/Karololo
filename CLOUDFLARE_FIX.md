# ⚠️ Cloudflare Blocking Issue

## Problem
Netlify Functions are getting **403 Forbidden** errors from Cloudflare. Node.js functions cannot bypass Cloudflare protection as effectively as Python's `cloudscraper`.

## Solutions

### Option 1: Use a Cloudflare Bypass Service (Recommended)
Use a third-party service that handles Cloudflare bypass:

1. **ScraperAPI** (https://www.scraperapi.com/)
2. **ScrapingBee** (https://www.scrapingbee.com/)
3. **Bright Data** (https://brightdata.com/)

### Option 2: Host Python Proxy Separately
Deploy the Python proxy (`wallet_proxy.py`) to a service that supports Python:
- **Heroku** (free tier available)
- **Railway** (free tier available)
- **Render** (free tier available)
- **Fly.io** (free tier available)

Then update `index.html` to point to your Python proxy URL instead of Netlify Functions.

### Option 3: Use Netlify Edge Functions (Experimental)
Netlify Edge Functions run closer to users and might have better success rates.

### Option 4: Contact GMGN.ai
Ask if they have an official API or can whitelist your Netlify IP addresses.

## Current Status
The functions have been updated with enhanced headers, but Cloudflare is still blocking requests. The functions will return 500 errors until Cloudflare blocking is resolved.

