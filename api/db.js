module.exports = async (req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.GITHUB_REPO; // e.g. "username/pw-nexus"

    if (!TOKEN || !REPO) {
        return res.status(500).json({ error: "GITHUB_TOKEN or GITHUB_REPO is missing from Vercel Environment Variables." });
    }

    const FILE_PATH = "data.json";
    const URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Vercel-Serverless-Function'
    };

    try {
        if (req.method === 'GET') {
            // Read data from GitHub
            const response = await fetch(URL, { method: 'GET', headers });
            
            if (response.status === 404) {
                return res.status(404).json({ error: "No data found" });
            }
            
            const data = await response.json();
            if (response.ok && data.content) {
                // GitHub returns content in Base64
                const decodedText = Buffer.from(data.content, 'base64').toString('utf8');
                return res.status(200).json(JSON.parse(decodedText));
            } else {
                return res.status(500).json({ error: "Failed to fetch from GitHub API" });
            }

        } else if (req.method === 'POST') {
            // Write data to GitHub
            let bodyData = '';
            
            req.on('data', chunk => {
                bodyData += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    // 1. Get the SHA of the existing file (required by GitHub to update it)
                    const getRes = await fetch(URL, { method: 'GET', headers });
                    let sha = null;
                    if (getRes.ok) {
                        const existingData = await getRes.json();
                        sha = existingData.sha;
                    }

                    // 2. Encode the new data to Base64
                    const base64Content = Buffer.from(bodyData).toString('base64');

                    // 3. Commit the change
                    const commitBody = {
                        message: "Admin Panel: Update team data",
                        content: base64Content,
                    };
                    if (sha) commitBody.sha = sha;

                    const putRes = await fetch(URL, {
                        method: 'PUT',
                        headers: headers,
                        body: JSON.stringify(commitBody)
                    });
                    
                    if (putRes.ok) {
                        res.status(200).json({ success: true, message: "Data saved successfully to GitHub!" });
                    } else {
                        const errData = await putRes.json();
                        res.status(500).json({ success: false, error: errData.message });
                    }
                } catch (err) {
                    res.status(500).json({ success: false, error: err.message });
                }
            });
        } else {
            res.status(405).json({ error: "Method not allowed" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
