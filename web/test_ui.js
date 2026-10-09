const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('requestfailed', request => console.log('FAILED REQ:', request.url(), request.failure().errorText));
  
  const routes = ['/home', '/medications', '/labs', '/providers', '/handover', '/share', '/timeline', '/connect'];
  
  for (const route of routes) {
    console.log(`\n--- Testing ${route} ---`);
    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle0' });
    const title = await page.title();
    console.log(`Title: ${title}`);
    
    // Extract interactive elements
    const interactiveElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, input, select');
      return Array.from(elements).map(el => ({
        tag: el.tagName,
        text: el.innerText?.trim().replace(/\n/g, ' ') || el.value || el.placeholder || '',
        href: el.href || ''
      }));
    });
    
    console.log(`Interactive elements found: ${interactiveElements.length}`);
    interactiveElements.slice(0, 5).forEach(el => console.log(` - ${el.tag}: ${el.text} ${el.href ? '('+el.href+')' : ''}`));
    if(interactiveElements.length > 5) console.log(`   ...and ${interactiveElements.length - 5} more`);
  }
  
  await browser.close();
})();
