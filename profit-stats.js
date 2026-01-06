const axios = require('axios');

// Enhanced headers to mimic browser behavior
function getHeaders() {
  return {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://gmgn.ai/',
    'Origin': 'https://gmgn.ai',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'DNT': '1',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
    'Accept-CH': 'Sec-CH-UA-Platform-Version, Sec-CH-UA-Model',
    'Upgrade-Insecure-Requests': '1',
    'sec-ch-ua-platform-version': '"15.0.0"'
  };
}

// Retry function with exponential backoff
async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: getHeaders(),
        timeout: 25000, // Reduced timeout for Netlify (10s limit)
        validateStatus: (status) => status < 500, // Don't throw on 4xx
        maxRedirects: 5,
        withCredentials: false,
        decompress: true
      });

      // If we get a 403, it might be Cloudflare - wait and retry
      if (response.status === 403 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Got 403, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // If we get HTML instead of JSON, it's likely a Cloudflare challenge
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('text/html') && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 2000;
        console.log(`Got HTML response (likely Cloudflare challenge), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (response.status === 200 && typeof response.data === 'object') {
        return response.data;
      }

      throw new Error(`API returned status ${response.status}`);
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Request failed, retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
      const wallet = event.queryStringParameters?.wallet || '95L9VfK5Dsshpeiaicsrz9E4D2iTtp9iapBUAtmihmcw';
    const period = event.queryStringParameters?.period || '7d';

    const url = `https://gmgn.ai/pf/api/v1/wallet/sol/${wallet}/profit_stat/${period}?device_id=5f314746-4f28-407f-bb42-6fa36b4c12e5&fp_did=34d0f8ae922f6b5c5397b8cf5cde1117&client_id=gmgn_web_20260105-9509-b9c2d27&from_app=gmgn&app_ver=20260105-9509-b9c2d27&tz_name=Europe%2FWarsaw&tz_offset=3600&app_lang=en-US&os=web&worker=0`;

    console.log('Fetching profit stats from:', url);
    const data = await fetchWithRetry(url);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error fetching profit stats:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        note: 'If this persists, Cloudflare may be blocking requests. Consider using the Python server for local development.'
      })
    };
  }
};
