import { test, expect } from "@playwright/test";
import { apiAs, loginUser } from "../helpers/api";

test.describe("chat between owner and advisor", () => {
  test("owner opens a conversation and the advisor can reply", async ({ playwright }) => {
    const owner = await apiAs(playwright, "owner");
    const advisor = await apiAs(playwright, "advisor");

    const created = await owner.ctx.post("/chat/threads", {
      headers: owner.headers,
      data: { advisorId: advisor.user.id, subject: "e2e chat", text: "Hello, any update on my car?" },
    });
    expect(created.status(), await created.text()).toBe(201);
    const thread = (await created.json()) as { id: string; ownerId: string; advisorId: string };
    expect(thread.ownerId).toBe(owner.user.id);
    expect(thread.advisorId).toBe(advisor.user.id);

    const advisorReply = await advisor.ctx.post("/chat/messages", {
      headers: advisor.headers,
      data: { threadId: thread.id, text: "Yes, it is ready for pickup." },
    });
    expect(advisorReply.ok(), await advisorReply.text()).toBeTruthy();

    const ownerThreads = (await (await owner.ctx.get("/chat/threads", { headers: owner.headers })).json()) as {
      id: string;
      unread: number;
      messages: { sender: string; text: string }[];
    }[];
    const ownerView = ownerThreads.find((t) => t.id === thread.id);
    expect(ownerView, "owner should see their conversation").toBeTruthy();
    expect(ownerView!.unread).toBe(1);
    expect(ownerView!.messages.some((m) => m.text.includes("ready for pickup"))).toBe(true);

    const advisorThreads = (await (await advisor.ctx.get("/chat/threads", { headers: advisor.headers })).json()) as {
      id: string;
      messages: { text: string }[];
    }[];
    expect(advisorThreads.some((t) => t.id === thread.id)).toBe(true);

    // Owner reads the conversation -> unread counter resets.
    const read = await owner.ctx.post(`/chat/threads/${thread.id}/read`, { headers: owner.headers });
    expect(read.ok(), await read.text()).toBeTruthy();
    const afterRead = (await (await owner.ctx.get("/chat/threads", { headers: owner.headers })).json()) as {
      id: string;
      unread: number;
    }[];
    expect(afterRead.find((t) => t.id === thread.id)?.unread).toBe(0);
  });

  test("outsiders cannot post into a conversation", async ({ playwright }) => {
    const owner = await apiAs(playwright, "owner");
    const advisor = await apiAs(playwright, "advisor");
    const outsider = await loginUser(playwright, "david.thompson@example.com", "password123");

    const created = await owner.ctx.post("/chat/threads", {
      headers: owner.headers,
      data: { advisorId: advisor.user.id, subject: "e2e private", text: "private message" },
    });
    const thread = (await created.json()) as { id: string };

    const res = await outsider.ctx.post("/chat/messages", {
      headers: outsider.headers,
      data: { threadId: thread.id, text: "I should not be here" },
    });
    expect(res.status()).toBe(403);
  });
});
