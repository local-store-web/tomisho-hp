/** Actual-browser acceptance test. Dev-only: requires Playwright installed in the QA environment.
 * Run: node tests/browser-qa.cjs
 * Optional: BROWSER_EXECUTABLE=/path/to/chromium node tests/browser-qa.cjs
 * Local HTTP only; never deploys, calls the restaurant, or opens external destinations.
 */
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const evidence = path.join(root, 'docs', 'qa', 'screenshots');
fs.mkdirSync(evidence, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  const report = { testedAt: new Date().toISOString(), viewports: [], status: 'running' };
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const url = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
    for (const width of [360, 390, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: width < 701 ? 844 : 1000 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const errors = [], failedRequests = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('requestfailed', r => failedRequests.push(r.url()));
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(evidence, `${width}-first-view.png`) });
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').getAttribute('class'), 'skip-link');
      const focusOutline = await page.locator(':focus').evaluate(el => getComputedStyle(el).outlineStyle);
      assert.notEqual(focusOutline, 'none');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator(':focus').getAttribute('id'), 'main');
      // Traverse the document so lazy images are actually requested before the full-page capture.
      await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });
      await page.waitForTimeout(500);
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      const measurements = await page.evaluate(() => ({
        viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
        images: [...document.images].map(image => ({ src: image.getAttribute('src'), loaded: image.complete && image.naturalWidth > 0, width: image.width, height: image.height })),
        undersizedTargets: [...document.querySelectorAll('a,button')].filter(el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && (r.width < 43.5 || r.height < 43.5); }).map(el => ({ text: el.textContent.trim(), width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })),
        localResources: performance.getEntriesByType('resource').map(r => ({ name: r.name.split('/').pop(), bytes: r.transferSize })),
        headingCount: document.querySelectorAll('h1').length
      }));
      assert.equal(measurements.documentWidth, width, `Horizontal overflow at ${width}`);
      assert(measurements.images.every(image => image.loaded), `Unloaded image at ${width}`);
      assert.equal(measurements.headingCount, 1);
      assert.equal(measurements.undersizedTargets.length, 0, `Touch targets at ${width}: ${JSON.stringify(measurements.undersizedTargets)}`);
      assert.equal(errors.length, 0, `Runtime errors at ${width}: ${errors}`);
      assert.equal(failedRequests.length, 0);
      if (width > 700) {
        await page.locator('.dish-next').click();
        await page.waitForTimeout(700);
        assert(await page.locator('.tasting').evaluate(el => el.scrollLeft > 0));
        await page.locator('.dish-prev').click();
        await page.waitForTimeout(700);
        assert(await page.locator('.tasting').evaluate(el => el.scrollLeft < 5));
        await page.locator('.tasting').focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(700);
        assert(await page.locator('.tasting').evaluate(el => el.scrollLeft > 0), `Keyboard tasting scroll at ${width}`);
      } else {
        assert(await page.locator('.mobile-booking').isVisible());
        await page.locator('.mobile-booking a[href="#access"]').click();
        assert.equal(new URL(page.url()).hash, '#access');
        await page.locator('.back-top').click();
        assert.equal(new URL(page.url()).hash, '#entrance');
      }
      await page.locator('.motion-control').click();
      assert.equal(await page.locator('.motion-control').getAttribute('aria-pressed'), 'true');
      await page.locator('.motion-control').click();
      assert.equal(await page.locator('.motion-control').getAttribute('aria-pressed'), 'false');
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: path.join(evidence, `${width}-full.png`), fullPage: true });
      report.viewports.push({ width, status: 'passed', ...measurements, errors, failedRequests });
      await context.close();
    }
    const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const reducedPage = await reduced.newPage();
    await reducedPage.goto(url, { waitUntil: 'networkidle' });
    assert(await reducedPage.locator('.motion-control').isHidden());
    assert.equal(await reducedPage.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
    report.reducedMotion = 'passed: no atmospheric animation; normal readable content and native navigation';
    await reduced.close();
    const motion = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await motion.addInitScript(() => {
      window.rafRequested = 0;
      const nativeRequest = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => { window.rafRequested++; return nativeRequest(callback); };
    });
    const motionPage = await motion.newPage();
    await motionPage.goto(url, { waitUntil: 'networkidle' });
    assert(await motionPage.evaluate(() => window.rafRequested > 0));
    await motionPage.locator('.motion-control').click();
    const stoppedAt = await motionPage.evaluate(() => window.rafRequested);
    await motionPage.waitForTimeout(160);
    assert.equal(await motionPage.evaluate(() => window.rafRequested), stoppedAt, 'Canvas continues when stopped');
    await motionPage.locator('.motion-control').click();
    await motionPage.waitForTimeout(160);
    assert(await motionPage.evaluate(stopped => window.rafRequested > stopped, stoppedAt), 'Canvas did not resume');
    await motionPage.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    const hiddenAt = await motionPage.evaluate(() => window.rafRequested);
    await motionPage.waitForTimeout(160);
    assert.equal(await motionPage.evaluate(() => window.rafRequested), hiddenAt, 'Canvas continues in hidden tab');
    await motionPage.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    await motionPage.waitForTimeout(160);
    assert(await motionPage.evaluate(hidden => window.rafRequested > hidden, hiddenAt), 'Canvas did not resume after visibility');
    report.canvasLifecycle = 'passed: stop, resume, simulated document.hidden / visibilitychange transitions';
    await motion.close();
    for (const fallback of ['missing-context', 'save-data', 'low-memory']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addInitScript(kind => {
        if (kind === 'missing-context') HTMLCanvasElement.prototype.getContext = () => null;
        if (kind === 'save-data') Object.defineProperty(navigator, 'connection', { configurable: true, get: () => ({ saveData: true }) });
        if (kind === 'low-memory') Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => 1 });
      }, fallback);
      const fallbackPage = await context.newPage();
      await fallbackPage.goto(url, { waitUntil: 'networkidle' });
      assert(await fallbackPage.locator('.motion-control').isHidden(), `Canvas control visible with ${fallback}`);
      assert(await fallbackPage.locator('h1').isVisible(), `Content hidden with ${fallback}`);
      report[fallback] = 'passed: decoration unavailable; content visible';
      await context.close();
    }
    const noScript = await browser.newContext({ viewport: { width: 360, height: 844 }, javaScriptEnabled: false });
    const noScriptPage = await noScript.newPage();
    await noScriptPage.goto(url, { waitUntil: 'networkidle' });
    assert.equal(await noScriptPage.locator('h1').count(), 1);
    assert(await noScriptPage.locator('#access').isVisible());
    assert.equal(await noScriptPage.locator('a[href="tel:0333927002"]').count(), 3);
    report.noJavaScript = 'passed: all content and reservation links are available';
    await noScript.close();
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed-or-blocked';
    report.error = String(error.stack || error);
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(path.join(root, 'docs', 'qa', 'browser-results.json'), JSON.stringify(report, null, 2));
    if (browser) await browser.close();
    server.close();
    console.log(JSON.stringify(report, null, 2));
  }
})();
