const https = require('https');

const TARGETS = {
    '/penpencil/': { host: 'api.penpencil.co', strip: '/penpencil' },
    '/rcxapi':     { host: 'rcxapi.vercel.app', strip: '' },
    '/home/':      { host: 'home.nexttoppers.com', strip: '' },
    '/course/':    { host: 'course.nexttoppers.com', strip: '' },
};

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const endpoint = req.query.endpoint || '';
    let pathname = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

    let target = null;
    for (const [prefix, t] of Object.entries(TARGETS)) {
        if (pathname.startsWith(prefix)) {
            target = t;
            if (t.strip) pathname = pathname.replace(t.strip, '');
            break;
        }
    }

    if (!target) return res.status(404).json({ error: 'Not Found' });

    const body = typeof req.body === 'object' && req.body !== null ? JSON.stringify(req.body) : (req.body || '');

    const options = {
        hostname: target.host,
        port: 443,
        path: pathname,
        method: req.method,
        headers: {
            'accept': req.headers['accept'] || 'application/json',
            'content-type': req.headers['content-type'] || 'application/json',
            'accept-language': req.headers['accept-language'] || '',
            'app_id': req.headers['app_id'] || '1770981347',
            'platform': req.headers['platform'] || '3',
            'user_id': req.headers['user_id'] || '0',
            'version': req.headers['version'] || '1',
            'host': target.host,
            'origin': 'https://eduvibe-nt.pages.dev',
            'referer': 'https://eduvibe-nt.pages.dev/',
            'content-length': Buffer.byteLength(body)
        }
    };

    if (target.host === 'api.penpencil.co') {
        Object.assign(options.headers, {
            'client-id': '5eb393ee95fab7468a79d189',
            'client-version': '343',
            'client-type': 'WEB',
            'randomid': 'pwnexus-' + Date.now()
        });
    }

    const proxyReq = https.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', c => data += c);
        proxyRes.on('end', () => {
            const h = { ...proxyRes.headers };
            delete h['access-control-allow-origin'];
            delete h['access-control-allow-methods'];
            delete h['access-control-allow-headers'];
            delete h['access-control-allow-credentials'];
            delete h['transfer-encoding'];
            delete h['connection'];
            res.writeHead(proxyRes.statusCode, h);
            res.end(data);
        });
    });

    proxyReq.on('error', () => res.status(500).end('Proxy Error'));
    if (body) proxyReq.write(body);
    proxyReq.end();
};
