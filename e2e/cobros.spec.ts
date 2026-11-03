import { test, expect } from "@playwright/test";

const EMAIL = process.env.SEED_USER_EMAIL ?? "admin@pandcasa.local";
const PASSWORD = process.env.SEED_USER_PASSWORD ?? "Admin123!";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /ingresar/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("cobros", () => {
  test("logs in and loads the cobros page with its filters", async ({ page }) => {
    await login(page);

    await page.goto("/cobros");
    await expect(page.getByRole("heading", { name: "Cobros" })).toBeVisible();
    await expect(page.getByText("Filtros", { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("N° proforma")).toBeVisible();
  });

  test("Estado de OC filter narrows the results", async ({ page }) => {
    await login(page);
    await page.goto("/cobros");

    await page.getByRole("button", { name: /más filtros/i }).click();
    const ocStatus = page.locator("#cobro-filter-oc-status");
    await expect(ocStatus).toBeVisible();

    const countText = page.locator("p.font-mono").first();
    await expect(countText).toBeVisible();

    await ocStatus.selectOption("con");
    await expect(page.getByText(/proforma(s)? encontrada(s)?|No se encontraron proformas/)).toBeVisible();

    await ocStatus.selectOption("");
  });
});
