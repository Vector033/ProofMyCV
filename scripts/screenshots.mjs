// README screenshots. Needs `npm run dev` + local Supabase with the demo account
// seeded (npm run seed:demo). Paste the body into Playwright MCP's run_code, or run
// with any Playwright install: node scripts/screenshots.mjs
// Uses the fictional demo account only; never point this at real resume data.

export async function shoot(page, base = "http://localhost:3000", dir = "docs/screenshots/") {
  const hideDevUi = () => page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  const at = async (w, h) => page.setViewportSize({ width: w, height: h });
  // Still frames: the hero shader holds one frame and the scroll entrances are off.
  await page.emulateMedia({ reducedMotion: "reduce" });

  await at(1440, 900);
  await page.goto(`${base}/`);
  await hideDevUi();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${dir}landing.png` });

  // The guard demo in use: a typed draft in the sandbox, then the pipeline blocking an invented one.
  await page.getByRole("button", { name: "Try the guard" }).click();
  await page
    .getByRole("textbox", { name: "Draft bullet" })
    .fill("Responsible for cutting the report job to 2 minutes using MongoDB.");
  await page.waitForTimeout(400); // let the toggle colours settle
  await page.locator("#demo").screenshot({ path: `${dir}guard-sandbox.png` });
  await page.getByRole("button", { name: "Invented draft" }).click();
  await page.waitForTimeout(400);
  await page.locator("#architecture").screenshot({ path: `${dir}pipeline.png` });
  await page.evaluate(() => window.scrollTo(0, 0));

  await at(390, 844);
  await page.reload();
  await hideDevUi();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${dir}landing-mobile.png` });

  await at(1440, 900);
  await page.goto(`${base}/login`);
  await hideDevUi();
  await page.screenshot({ path: `${dir}login.png` });
  await page.getByRole("button", { name: "Try the demo account" }).click();
  await page.waitForURL("**/app");
  await page.goto(`${base}/app/facts`);
  await hideDevUi();
  await page.screenshot({ path: `${dir}fact-bank.png` });

  await page.goto(`${base}/app`);
  await page.locator('a[href^="/app/applications/"]:not([href$="/new"])').first().click();
  await page.waitForURL("**/applications/**");
  await hideDevUi();
  await page.waitForTimeout(1400); // score ring finishes drawing
  await page.screenshot({ path: `${dir}application.png` });

  // Bullet studio with one honest bullet and one the guard blocks (not saved).
  const add = page.getByRole("button", { name: "Add", exact: true });
  await add.nth(0).click();
  await add.nth(0).click();
  await add.nth(1).click();
  await page
    .getByRole("textbox", { name: /Bullet 2 for/ })
    .fill("Cut the daily report job by 90% by adding a PostgreSQL index and Redis caching.");
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.evaluate(() => {
    document.getElementById("bullets-heading")?.scrollIntoView();
    window.scrollBy(0, -70);
  });
  await page.screenshot({ path: `${dir}bullet-studio.png` });

  await at(390, 844);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${dir}application-mobile.png` });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || process.argv[1]?.endsWith("screenshots.mjs")) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("dialog", (d) => d.accept()); // beforeunload prompt when leaving unsaved edits
  await shoot(page);
  await browser.close();
}
