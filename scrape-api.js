const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    console.log('🚀 Launching stealth browser...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    let found = false;
    page.on('response', async (response) => {
        const url = response.url();
        const type = response.request().resourceType();
        if ((type === 'fetch' || type === 'xhr') && /batch|topics|\.json/.test(url)) {
            console.log('\n🎯 Potential batch API:', url);
            try {
                const txt = await response.text();
                console.log('Preview (first 200 chars):', txt.substring(0, 200));
            } catch(e) { console.log('Error reading response'); }
            found = true;
        }
    });
    console.log('🌐 Navigating to RolexCoderz...');
    await page.goto('https://rolexcoderz.com/PW/', { waitUntil: 'networkidle2', timeout: 60000 });
    // Wait additional time for any async XHR after challenge resolves
    await new Promise(r => setTimeout(r, 20000));
    if (!found) {
        console.log('⚠️ No batch API detected.');
    }
    await browser.close();
})();
