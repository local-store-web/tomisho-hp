/* Run in a browser-capable environment with Playwright installed:
   node qa/verify_browser.cjs
   Optional: CHROMIUM_PATH=/path/to/chromium node qa/verify_browser.cjs
   No product dependencies are introduced. Artifacts go to qa/evidence/. */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const out = path.join(__dirname, "evidence");
fs.mkdirSync(out, { recursive: true });
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
const report = { viewports: [], accessibilityAutomated: "Not run unless axe-core is available", failures: [] };
async function traverse(page) {
  const height = await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; return document.documentElement.scrollHeight; });
  const viewport = page.viewportSize().height;
  for (let y = 0; y < height; y += viewport * .65) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(300);
  await page.evaluate(() => { window.scrollTo({ top: 0, behavior: "instant" }); document.documentElement.style.scrollBehavior = ""; });
  await page.waitForTimeout(450);
}
let browser;
(async () => {
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const url = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  for (const width of [360, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: width < 701 ? 844 : 1000 }, deviceScaleFactor: 1 });
    await page.addInitScript(() => {
      window.__labVitals = { lcpMs: null, cls: 0 };
      try {
        new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__labVitals.lcpMs = Math.round(entry.startTime); }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__labVitals.cls += entry.value; }).observe({ type: "layout-shift", buffered: true });
      } catch (_) {}
    });
    const errors = [];
    page.on("pageerror", err => errors.push(err.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(out, `type-b-${width}-first-view.png`) });
    const firstViewVitals = await page.evaluate(() => ({ ...window.__labVitals, loadMs: Math.round(performance.getEntriesByType("navigation")[0].loadEventEnd) }));
    // Scroll every segment to exercise lazy loading and reveal observers.
    await traverse(page);
    const layout = await page.evaluate(() => {
      const visible = el => { const b = el.getBoundingClientRect(); return b.width && b.height && getComputedStyle(el).visibility !== "hidden"; };
      return {
        viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        overflowing: [...document.querySelectorAll("body *")].filter(el => visible(el) && !el.classList.contains("sr-only") && !el.classList.contains("skip-link") && (el.getBoundingClientRect().right > innerWidth + 1 || el.getBoundingClientRect().left < -1)).map(el => `${el.tagName}.${el.className}`),
        smallTargets: [...document.querySelectorAll("a,summary,button")].filter(el => visible(el) && !el.classList.contains("skip-link") && (el.getBoundingClientRect().height < 43.9 || el.getBoundingClientRect().width < 43.9)).map(el => ({ text: el.innerText, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })),
        brokenImages: [...document.images].filter(el => visible(el) && (!el.complete || !el.naturalWidth)).map(el => el.src),
        heading: document.querySelector("h1").innerText,
        bytes: performance.getEntriesByType("resource").reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
      };
    });
    await page.screenshot({ path: path.join(out, `type-b-${width}-full.png`), fullPage: true });
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; document.querySelector("#access").scrollIntoView(); });
    await page.screenshot({ path: path.join(out, `type-b-${width}-access.png`) });
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = ""; });
    if (layout.scrollWidth > width || layout.overflowing.length || layout.smallTargets.length || layout.brokenImages.length || errors.length) report.failures.push(`Viewport ${width}`);
    if (width < 701) {
      layout.fixedBarOcclusions = [];
      for (const selector of [".reservation-phone", ".back-top", ".info-phone"]) {
        await page.locator(selector).evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
        if (selector === ".reservation-phone") await page.screenshot({ path: path.join(out, `type-b-${width}-reservation.png`) });
        const blocked = await page.locator(selector).evaluate(el => {
          const b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
          return y < 0 || y >= innerHeight || !el.contains(document.elementFromPoint(x, y));
        });
        if (blocked) layout.fixedBarOcclusions.push(selector);
      }
      if (layout.fixedBarOcclusions.length) report.failures.push(`${width}: fixed bar occlusion`);
      await page.locator(".mobile-menu summary").click();
      await page.locator(".mobile-menu summary").click();
      if (await page.locator(".mobile-menu").evaluate(el => el.open)) report.failures.push(`${width}: repeated click did not close navigation`);
      await page.locator(".mobile-menu summary").click();
      await page.screenshot({ path: path.join(out, `type-b-${width}-navigation.png`) });
      await page.keyboard.press("Escape");
      if (await page.locator(".mobile-menu").evaluate(el => el.open)) report.failures.push(`${width}: Escape did not close navigation`);
      if (!(await page.locator(".mobile-menu summary").evaluate(el => el === document.activeElement))) report.failures.push(`${width}: Escape did not restore focus`);
      await page.locator(".mobile-menu summary").click();
      await page.locator('.mobile-menu a[href="#food"]').click();
      if (await page.locator(".mobile-menu").evaluate(el => el.open)) report.failures.push(`${width}: anchor did not close navigation`);
      if (await page.evaluate(() => document.activeElement.id) !== "food") report.failures.push(`${width}: anchor focus not moved`);
    }
    await page.goto(url);
    await page.keyboard.press("Tab");
    if (!(await page.locator(".skip-link").evaluate(el => el === document.activeElement))) report.failures.push(`${width}: skip link not first focusable`);
    const focusStyle = await page.locator(".skip-link").evaluate(el => getComputedStyle(el).outlineStyle);
    if (focusStyle === "none") report.failures.push(`${width}: focus outline missing`);
    try {
      const axe = require.resolve("axe-core/axe.min.js");
      await page.addScriptTag({ path: axe });
      const axeResult = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations);
      report.accessibilityAutomated = "axe-core WCAG 2/2.1 A and AA run";
      if (axeResult.length) report.failures.push(`${width}: axe violations`);
      layout.axeViolations = axeResult;
    } catch (error) {
      if (error.code !== "MODULE_NOT_FOUND") throw error;
    }
    report.viewports.push({ width, errors, firstViewVitals, ...layout });
    await page.close();
  }
  const fallback = await browser.newPage({ viewport: { width: 360, height: 844 }, javaScriptEnabled: false, reducedMotion: "reduce" });
  await fallback.goto(url, { waitUntil: "networkidle" });
  await traverse(fallback);
  report.noJavaScript = { mainVisible: await fallback.locator("#philosophy-title").isVisible(), reservationLinks: await fallback.locator('a[href="tel:0333927002"]').count(), brokenVisibleImages: await fallback.evaluate(() => [...document.images].filter(el => el.getBoundingClientRect().width && !el.naturalWidth).map(el => el.src)) };
  if (report.noJavaScript.brokenVisibleImages.length) report.failures.push("No-JS visible image");
  await fallback.screenshot({ path: path.join(out, "type-b-360-no-js.png"), fullPage: true });
  await fallback.close();
  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await reduced.goto(url);
  report.reducedMotion = await reduced.evaluate(() => ({ smoothScrolling: getComputedStyle(document.documentElement).scrollBehavior, arrivingAnimations: [...document.querySelectorAll("[data-reveal]")].some(el => getComputedStyle(el).animationName !== "none") }));
  if (report.reducedMotion.smoothScrolling !== "auto" || report.reducedMotion.arrivingAnimations) report.failures.push("Reduced motion");
  await reduced.close();
  fs.writeFileSync(path.join(out, "browser-results.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.failures.length ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
