import { expect, test } from "@playwright/test";

const canvasElements = (page: import("@playwright/test").Page) =>
  page.evaluate(() => structuredClone(window.testState.model.canvas.elements));

test("pasting clipboard text on the canvas creates a Text Canvas Element", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  await page.goto(`${baseURL}/tests/e2e/`);

  await page.evaluate(() => navigator.clipboard.writeText("Pasted from clipboard"));
  await page.keyboard.press("ControlOrMeta+V");

  await expect.poll(async () => (await canvasElements(page)).length).toBe(4);
  expect((await canvasElements(page)).at(-1)?.payload).toMatchObject({
    kind: "text",
    document: { root: { children: [{ children: [{ text: "Pasted from clipboard" }] }] } },
  });

  await context.close();
});

test("clipboard shortcuts work when canvas focus is lost", async ({ page }) => {
  await page.goto("/tests/e2e/");

  const source = page.locator('[data-canvas-id="00000000-0000-4000-8000-000000000002"]');
  await source.click();
  await expect(page.locator("[data-entry-canvas]")).toHaveAttribute("data-canvas-selection");
  await page.locator("body").focus();
  await page.keyboard.press("ControlOrMeta+C");
  await page.keyboard.press("ControlOrMeta+V");

  await expect.poll(async () => (await canvasElements(page)).length).toBe(4);
  const elements = await canvasElements(page);
  const copy = elements.at(-1)!;
  expect(copy).toMatchObject({
    payload: elements[1]!.payload,
    x: elements[1]!.x + 24,
    y: elements[1]!.y + 24,
    layer: 3,
  });
  expect(copy.id).not.toBe(elements[1]!.id);
  await expect(page.getByRole("heading", { name: "Name this image" })).not.toBeVisible();
  expect(await page.evaluate(() => window.testState.model.canvas.selectedElementId)).toBe(copy.id);
});

test("cut removes the selected Canvas Element and undo restores it", async ({ page }) => {
  await page.goto("/tests/e2e/");

  const source = page.locator('[data-canvas-id="00000000-0000-4000-8000-000000000003"]');
  await source.click();
  await expect(page.locator("[data-entry-canvas]")).toHaveAttribute("data-canvas-selection");
  await page.keyboard.press("ControlOrMeta+X");
  await expect.poll(async () => (await canvasElements(page)).length).toBe(2);

  await page.keyboard.press("ControlOrMeta+Z");
  await expect.poll(async () => (await canvasElements(page)).length).toBe(3);
});

test("Delete opens confirmation and removes the selected Canvas Element", async ({ page }) => {
  await page.goto("/tests/e2e/");

  const source = page.locator('[data-canvas-id="00000000-0000-4000-8000-000000000001"]');
  await source.click();
  await expect(page.locator("[data-entry-canvas]")).toHaveAttribute("data-canvas-selection");
  await page.keyboard.press("Delete");
  await expect(page.getByRole("heading", { name: "Delete element?" })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).dispatchEvent("click");
  await expect.poll(async () => (await canvasElements(page)).length).toBe(2);
});

test("pasting a clipboard image opens the image naming dialog", async ({ page }) => {
  await page.goto("/tests/e2e/");

  const canvas = page.locator("[data-entry-canvas]");
  await canvas.click({ position: { x: 450, y: 350 } });
  await canvas.evaluate((node) => {
    const clipboard = new DataTransfer();
    clipboard.items.add(new File([new Uint8Array([0])], "clipboard.png", { type: "image/png" }));
    node.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: clipboard }));
  });

  await expect(page.getByRole("heading", { name: "Name this image" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue("clipboard.png");
});
