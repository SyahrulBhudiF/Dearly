import { expect, test } from "@playwright/test";

const date = "2026-07-13";

test("Our photo opens the saved canvas preview and offers WebP download", async ({ page }) => {
  await page.goto("/tests/e2e/photoPreview.html");
  await page.getByRole("button", { name: `Preview photo from ${date}` }).click();
  const dialog = page.getByRole("dialog", { name: `Photo from ${date}` });
  await expect(dialog).toBeVisible();
  const download = dialog.getByRole("link", { name: "Download" });
  await expect(download).toHaveAttribute("href", /\/media\//);
  await expect(download).toHaveAttribute("download", `dearly-${date}.webp`);
  await dialog.getByRole("button", { name: "Close photo preview" }).last().click();
  await expect(dialog).toBeHidden();
});
