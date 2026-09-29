import { test, expect } from "@playwright/test";
import { apiAs, completeTask, createTaskForOwner } from "../helpers/api";

async function loginViaUi(page: import("@playwright/test").Page, buttonName: string, urlPattern: RegExp) {
  await page.goto("/login");
  await page.getByRole("button", { name: buttonName, exact: true }).click();
  await expect(page).toHaveURL(urlPattern);
}

test.describe("PDF generation", () => {
  test("owner downloads the invoice PDF", async ({ page, playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");
    const task = await createTaskForOwner(advisor, owner.user.id, { issues: "e2e invoice pdf" });
    await completeTask(advisor, task.id);

    await loginViaUi(page, "Owner", /\/dashboard(\/|$)/);
    await page.goto("/dashboard/payments");

    const pdfButton = page.getByRole("button", { name: "PDF", exact: true }).first();
    await expect(pdfButton).toBeVisible();

    const [download] = await Promise.all([page.waitForEvent("download"), pdfButton.click()]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test("service advisor downloads the task card PDF", async ({ page, playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");
    const task = await createTaskForOwner(advisor, owner.user.id, { issues: "e2e task card pdf" });

    await loginViaUi(page, "Advisor", /\/advisor(\/|$)/);
    await page.goto(`/advisor/tasks/${task.id}`);

    const downloadButton = page.getByRole("button", { name: "Download PDF" });
    await expect(downloadButton).toBeVisible();

    const [download] = await Promise.all([page.waitForEvent("download"), downloadButton.click()]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test("mechanic downloads the task card PDF", async ({ page, playwright }) => {
    const advisor = await apiAs(playwright, "advisor");
    const owner = await apiAs(playwright, "owner");
    const mechanic = await apiAs(playwright, "mechanic");
    const task = await createTaskForOwner(advisor, owner.user.id, {
      issues: "e2e mechanic task card pdf",
      mechanicIds: [mechanic.user.id],
    });

    await loginViaUi(page, "Mechanic", /\/mechanic(\/|$)/);
    await page.goto(`/mechanic/tasks/${task.id}`);

    const downloadButton = page.getByRole("button", { name: "Download Task Card" });
    await expect(downloadButton).toBeVisible();

    const [download] = await Promise.all([page.waitForEvent("download"), downloadButton.click()]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });
});
