const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Load saved PW token (created by pw-auth-setup.js)
let PW_TOKEN = null;
const TOKEN_FILE = path.join(__dirname, 'pw-token.json');
if (fs.existsSync(TOKEN_FILE)) {
    try {
        PW_TOKEN = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8')).token || null;
        if (PW_TOKEN) console.log('✅ PW token loaded from pw-token.json');
    } catch(e) {
        console.warn('⚠️  Could not read pw-token.json:', e.message);
    }
} else {
    console.warn('⚠️  No pw-token.json found. Run: node pw-auth-setup.js');
}

const server = http.createServer((req, res) => {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Example request path: /home/content or /course/all-content
    // We will determine target based on the first part of the path
    const reqUrl = url.parse(req.url, true);
    let pathname = reqUrl.pathname;
    let search = reqUrl.search || '';
    // Support proxy endpoint used by frontend: /api/proxy?endpoint=/rcxapi&action=get_batches
    if (pathname === '/api/proxy') {
        const endpoint = reqUrl.query.endpoint || '';
        // Ensure endpoint starts with a slash
        pathname = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
        // Build search string from remaining query parameters (excluding endpoint)
        const remainingParams = [];
        for (const [key, value] of Object.entries(reqUrl.query)) {
            if (key !== 'endpoint') {
                remainingParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
        }
        search = remainingParams.length ? '?' + remainingParams.join('&') : '';
    }

    let targetHostname = '';

    if (pathname.startsWith('/penpencil/')) {
        // PW official API — strip the /penpencil prefix
        targetHostname = 'api.penpencil.co';
        pathname = pathname.replace('/penpencil', '');
    } else if (pathname.startsWith('/rcxapi')) {
        targetHostname = 'rcxapi.vercel.app';
    } else if (pathname.startsWith('/home/')) {
        targetHostname = 'home.nexttoppers.com';
    } else if (pathname.startsWith('/course/')) {
        targetHostname = 'course.nexttoppers.com';
    } else {
        res.writeHead(404);
        res.end('Not Found. Valid prefixes: /penpencil/, /home/, /course/, /rcxapi/');
        return;
    }

    console.log(`--> ${req.method} https://${targetHostname}${pathname}${search}`);

    // Build PW-specific headers for penpencil API
    const pwHeaders = targetHostname === 'api.penpencil.co' ? {
        'client-id': '5eb393ee95fab7468a79d189',
        'client-version': '343',
        'client-type': 'WEB',
        'randomid': 'pwnexus-' + Date.now(),
        'origin': 'https://www.pw.live',
        'referer': 'https://www.pw.live/',
        'host': 'api.penpencil.co',
        ...(PW_TOKEN ? { 'authorization': `Bearer ${PW_TOKEN}` } : {})
    } : {
        'host': targetHostname,
        'origin': 'https://eduvibe-nt.pages.dev',
        'referer': 'https://eduvibe-nt.pages.dev/'
    };

    const options = {
        hostname: targetHostname,
        port: 443,
        path: pathname + search,
        method: req.method,
        headers: {
            ...req.headers,
            ...pwHeaders
        }
    };

    // Remove headers we don't want to forward exactly as is, if any
    delete options.headers['connection'];

    const proxyReq = https.request(options, (proxyRes) => {
        // We only want to forward some headers back to avoid breaking the browser
        const proxyHeaders = { ...proxyRes.headers };
        delete proxyHeaders['access-control-allow-origin'];
        delete proxyHeaders['access-control-allow-methods'];
        delete proxyHeaders['access-control-allow-headers'];
        delete proxyHeaders['access-control-allow-credentials'];
        
        res.writeHead(proxyRes.statusCode, proxyHeaders);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error('Proxy request error:', err);
        if (!res.headersSent) {
            res.writeHead(500);
            res.end('Proxy Error');
        }
    });

    // Pipe the original request body into the proxy request
    req.pipe(proxyReq, { end: true });
});

server.listen(PORT, () => {
    console.log(`🚀 Proxy server running at http://localhost:${PORT}`);
    console.log(`  /penpencil/*  → https://api.penpencil.co`);
    console.log(`  /home/*       → https://home.nexttoppers.com`);
    console.log(`  /course/*     → https://course.nexttoppers.com`);
    console.log(`  /rcxapi/*     → https://rcxapi.vercel.app`);
});
