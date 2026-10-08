// Requires Playwright and Chromium. Start a local server before running.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8765';
(async () => {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) errors.push(`${r.status()}: ${r.url()}`); });
    const routes = ['/', '/id/', '/gallery.html', '/id/gallery.html',
      '/products/frozen-squid.html', '/products/frozen-octopus.html',
      '/products/frozen-vannamei-shrimp.html', '/products/frozen-yellowfin-tuna.html',
      '/id/produk/cumi-beku.html', '/id/produk/gurita-beku.html',
      '/id/produk/udang-vaname-beku.html', '/id/produk/tuna-sirip-kuning-beku.html'];
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await page.goto(base + route);
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `horizontal overflow: ${width} ${route}`);
        if (width === 390) {
          await page.locator('#navToggle').click();
          assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'), 'true');
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'), 'false');
        }
      }
    }
    for (const route of ['/', '/id/']) {
      await page.goto(base + route);
      await page.locator('#contactForm [type=submit]').click();
      assert.equal(await page.locator('.whatsapp-handoff').count(), 0, 'invalid form must not prepare a link');
      for (const [id, value] of Object.entries({ name: 'Buyer & Co', company: '<Buyer>', email: 'buyer@example.com', phone: '+62 123', quantity: '1,000 kg', destination: 'Singapore', message: 'Please quote.\nPack: 25 kg & 10% glaze.' })) {
        await page.locator('#'+id).fill(value);
      }
      await page.locator('#product').selectOption('shrimp');
      await page.locator('#contactForm [type=submit]').click();
      const url = new URL(await page.locator('.whatsapp-handoff').getAttribute('href'));
      assert.equal(url.origin, 'https://wa.me');
      assert.equal(url.pathname, '/6282333842942');
      const message = url.searchParams.get('text');
      for (const value of ['Buyer & Co', '<Buyer>', 'buyer@example.com', '+62 123', '1,000 kg', 'Singapore', 'Pack: 25 kg & 10% glaze.', route === '/' ? 'Vannamei Shrimp' : 'Udang Vaname']) assert(message.includes(value), value);
      assert.equal(await page.locator('#name').inputValue(), 'Buyer & Co', 'keep entered information');
      assert((await page.locator('#formStatus').innerText()).includes(route === '/' ? 'has not been sent' : 'belum terkirim'));
      assert.equal(await page.locator('#formStatus buyer').count(), 0);
      await page.locator('#quantity').fill('2,000 kg');
      assert.equal(await page.locator('.whatsapp-handoff').count(), 0, 'edited data invalidates prepared link');
      await page.locator('#contactForm [type=submit]').click();
      assert(new URL(await page.locator('.whatsapp-handoff').getAttribute('href')).searchParams.get('text').includes('2,000 kg'));
      assert.equal(await page.locator('.product-card').count(), await page.locator('.product-card .product-inquiry').count(), 'no duplicate inquiry buttons');
    }
    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const fallback = await nojs.newPage();
    for (const route of ['/', '/id/']) {
      await fallback.goto(base + route);
      assert.equal(await fallback.locator('.product-card').first().evaluate(el => getComputedStyle(el).opacity), '1');
      assert.equal(await fallback.locator('#contactForm [type=submit]').isDisabled(), true);
      assert.equal(await fallback.locator('#contactForm a[href^="https://wa.me/"]').count(), 1);
      assert.equal(await fallback.locator('.product-card .product-inquiry').count(), 15);
    }
    if (process.env.SCREENSHOT_DIR) {
      const dir = process.env.SCREENSHOT_DIR;
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(base + '/products/frozen-squid.html');
      await page.screenshot({ path: dir+'/product-desktop.png', fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(base + '/id/');
      await page.screenshot({ path: dir+'/home-mobile.png' });
      await page.goto(base + '/id/produk/udang-vaname-beku.html');
      await page.screenshot({ path: dir+'/product-mobile.png', fullPage: true });
      await page.goto(base + '/id/#kontak');
      await page.locator('#contactForm').scrollIntoViewIfNeeded();
      await page.screenshot({ path: dir+'/contact-mobile.png' });
    }
    assert.deepEqual(errors, []);
    console.log('PASS: 12 pages at 390px/1440px, mobile navigation, bilingual form validation and encoded WhatsApp handoff, edits, preserved input, no-JS fallback, no local HTTP/JS errors. No inquiry was sent.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
