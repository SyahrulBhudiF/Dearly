import { expect, test, type Locator, type Page } from "@playwright/test";

const textId = "00000000-0000-4000-8000-000000000001";
const imageId = "00000000-0000-4000-8000-000000000002";
const emojiId = "00000000-0000-4000-8000-000000000003";

const historyLength = (page: Page) =>
  page.evaluate(() => window.testState.model.canvas.history.past.length);
const snapshot = (page: Page) =>
  page.evaluate(() => structuredClone(window.testState.model.canvas.elements));
const element = (page: Page, id: string) => page.locator(`[data-canvas-id="${id}"]`);
const changed = async (page: Page, before: number) =>
  expect.poll(() => historyLength(page)).toBe(before + 1);

const typeText = async (page: Page, value: string) => {
  const before = await historyLength(page);
  const editor = element(page, textId).locator(".ProseMirror");
  await editor.click();
  await page.keyboard.press("End");
  await page.keyboard.type(value, { delay: 3 });
  await editor.evaluate((node) => node.blur());
  await changed(page, before);
};

const addShape = async (page: Page, label: string) => {
  const before = await historyLength(page);
  await page.getByRole("button", { name: "Shape", exact: true }).dispatchEvent("click");
  await page.getByRole("button", { name: `Add ${label}` }).dispatchEvent("click");
  await changed(page, before);
  return page.evaluate(
    (shape) =>
      window.testState.model.canvas.elements.findLast(
        (item) => item.payload.kind === "shape" && item.payload.shape === shape.toLowerCase(),
      )!.id,
    label,
  );
};

const select = async (page: Page, id: string) => {
  const item = element(page, id);
  const box = (await item.boundingBox())!;
  await item.dispatchEvent("pointerdown", {
    button: 0,
    pointerId: 9,
    clientX: box.x + 10,
    clientY: box.y + 10,
  });
  await expect(item.locator("[data-canvas-controls]")).toBeVisible();
};

const gesture = async (handle: Locator, dx: number, dy: number) => {
  const box = (await handle.boundingBox())!;
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await handle.dispatchEvent("pointerdown", {
    button: 0,
    pointerId: 1,
    clientX: start.x,
    clientY: start.y,
  });
  await handle.dispatchEvent("pointermove", {
    buttons: 1,
    pointerId: 1,
    clientX: start.x + dx,
    clientY: start.y + dy,
  });
  await handle.dispatchEvent("pointerup", {
    button: 0,
    pointerId: 1,
    clientX: start.x + dx,
    clientY: start.y + dy,
  });
};

const move = async (page: Page, id: string, dx: number, dy: number) => {
  const before = await historyLength(page);
  await select(page, id);
  await gesture(element(page, id).locator("[data-canvas-grab]"), dx, dy);
  await changed(page, before);
};

const resize = async (page: Page, id: string, dx: number, dy: number) => {
  const before = await historyLength(page);
  await select(page, id);
  await gesture(element(page, id).locator('[data-canvas-resize="south-east"]'), dx, dy);
  await changed(page, before);
};

const rotate = async (page: Page, id: string, dx: number, dy: number) => {
  const before = await historyLength(page);
  await select(page, id);
  await gesture(element(page, id).locator("[data-canvas-rotate]"), dx, dy);
  await changed(page, before);
};

const layer = async (page: Page, id: string, edge: "front" | "back") => {
  const before = await historyLength(page);
  if (!(await page.getByRole("complementary", { name: "Canvas layers" }).isVisible()))
    await page.getByRole("button", { name: "Layers" }).dispatchEvent("click");
  const row = page.locator(`[data-layer-id="${id}"]`);
  await row.getByRole("button", { name: new RegExp(`to ${edge}$`, "i") }).dispatchEvent("click");
  await changed(page, before);
};

const checkpoint = async (page: Page, snapshots: unknown[]) => snapshots.push(await snapshot(page));

test("50 concrete mixed Canvas actions undo and redo exactly in the full Foldkit app", async ({
  page,
}) => {
  await page.goto("/tests/e2e/");
  await expect(page.getByRole("heading", { name: /14 July 2026/ })).toBeVisible();
  const snapshots: unknown[] = [await snapshot(page)];

  await typeText(page, "wqeq");
  await checkpoint(page, snapshots); // 1
  await move(page, emojiId, -45, 70);
  await checkpoint(page, snapshots); // 2
  const rectangle = await addShape(page, "Rectangle");
  await checkpoint(page, snapshots); // 3
  await resize(page, imageId, 35, 24);
  await checkpoint(page, snapshots); // 4
  await layer(page, textId, "front");
  await checkpoint(page, snapshots); // 5
  await rotate(page, emojiId, 55, 28);
  await checkpoint(page, snapshots); // 6
  await typeText(page, " 123");
  await checkpoint(page, snapshots); // 7
  await move(page, rectangle, 65, -35);
  await checkpoint(page, snapshots); // 8
  const circle = await addShape(page, "Circle");
  await checkpoint(page, snapshots); // 9
  await layer(page, imageId, "front");
  await checkpoint(page, snapshots); // 10
  await resize(page, emojiId, 28, 42);
  await checkpoint(page, snapshots); // 11
  await rotate(page, rectangle, -45, 38);
  await checkpoint(page, snapshots); // 12
  await move(page, imageId, -80, 55);
  await checkpoint(page, snapshots); // 13
  await layer(page, circle, "back");
  await checkpoint(page, snapshots); // 14
  await typeText(page, " 1");
  await checkpoint(page, snapshots); // 15
  const star = await addShape(page, "Star");
  await checkpoint(page, snapshots); // 16
  await move(page, star, 90, 35);
  await checkpoint(page, snapshots); // 17
  await resize(page, rectangle, 46, -22);
  await checkpoint(page, snapshots); // 18
  await rotate(page, imageId, 50, -35);
  await checkpoint(page, snapshots); // 19
  await layer(page, emojiId, "front");
  await checkpoint(page, snapshots); // 20
  await typeText(page, " mixed");
  await checkpoint(page, snapshots); // 21
  const triangle = await addShape(page, "Triangle");
  await checkpoint(page, snapshots); // 22
  await move(page, triangle, -75, 80);
  await checkpoint(page, snapshots); // 23
  await resize(page, circle, 32, 48);
  await checkpoint(page, snapshots); // 24
  await rotate(page, star, -62, 25);
  await checkpoint(page, snapshots); // 25
  await layer(page, rectangle, "back");
  await checkpoint(page, snapshots); // 26
  await move(page, emojiId, 35, -52);
  await checkpoint(page, snapshots); // 27
  await typeText(page, " diary");
  await checkpoint(page, snapshots); // 28
  const diamond = await addShape(page, "Diamond");
  await checkpoint(page, snapshots); // 29
  await resize(page, diamond, 44, 31);
  await checkpoint(page, snapshots); // 30
  await rotate(page, circle, 58, 34);
  await checkpoint(page, snapshots); // 31
  await layer(page, imageId, "back");
  await checkpoint(page, snapshots); // 32
  await move(page, rectangle, -38, 66);
  await checkpoint(page, snapshots); // 33
  await resize(page, star, -28, 51);
  await checkpoint(page, snapshots); // 34
  await typeText(page, " canvas");
  await checkpoint(page, snapshots); // 35
  const heart = await addShape(page, "Heart");
  await checkpoint(page, snapshots); // 36
  await rotate(page, heart, -48, -32);
  await checkpoint(page, snapshots); // 37
  await move(page, circle, 72, 44);
  await checkpoint(page, snapshots); // 38
  await layer(page, emojiId, "back");
  await checkpoint(page, snapshots); // 39
  await resize(page, imageId, 52, -34);
  await checkpoint(page, snapshots); // 40
  await typeText(page, " history");
  await checkpoint(page, snapshots); // 41
  await move(page, heart, -64, 58);
  await checkpoint(page, snapshots); // 42
  await rotate(page, triangle, 43, 57);
  await checkpoint(page, snapshots); // 43
  await layer(page, textId, "front");
  await checkpoint(page, snapshots); // 44
  await resize(page, emojiId, -36, 29);
  await checkpoint(page, snapshots); // 45
  await move(page, imageId, 41, -63);
  await checkpoint(page, snapshots); // 46
  await layer(page, diamond, "front");
  await checkpoint(page, snapshots); // 47
  await rotate(page, rectangle, 61, -26);
  await checkpoint(page, snapshots); // 48
  await typeText(page, " end");
  await checkpoint(page, snapshots); // 49
  await move(page, star, -57, -41);
  await checkpoint(page, snapshots); // 50

  expect(snapshots).toHaveLength(51);
  await expect.poll(() => historyLength(page)).toBe(50);
  const ledger = await page.evaluate(() =>
    structuredClone(window.testState.model.canvas.history.past),
  );
  for (let index = 0; index < 50; index += 1) {
    expect(ledger[index], `History entry ${index} must equal snapshot ${index}`).toEqual(
      snapshots[index],
    );
  }

  const undo = page.getByRole("button", { name: "Undo" });
  const redo = page.getByRole("button", { name: "Redo" });
  for (let index = 49; index >= 0; index -= 1) {
    await undo.click();
    await expect
      .poll(() => snapshot(page), {
        message: `Undo ${50 - index}/50 must restore snapshot ${index}`,
      })
      .toEqual(snapshots[index]);
  }
  for (let index = 1; index <= 50; index += 1) {
    await redo.click();
    await expect
      .poll(() => snapshot(page), {
        message: `Redo ${index}/50 must restore snapshot ${index}`,
      })
      .toEqual(snapshots[index]);
  }
});

test("Undo icon commits and undoes the active TipTap session", async ({ page }) => {
  await page.goto("/tests/e2e/");
  const before = await snapshot(page);
  const editor = element(page, textId).locator(".ProseMirror");
  await editor.click();
  await page.keyboard.type("active text", { delay: 3 });
  await page.getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => snapshot(page)).toEqual(before);
});
