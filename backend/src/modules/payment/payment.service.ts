import type Stripe from "stripe";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import { CLIENT_URL, stripe } from "./stripe.client.js";

export async function createCheckoutSession(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { job: { include: { vehicle: true } } },
  });
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.customerId !== userId) throw new ApiError(403, "Insufficient permissions");
  if (invoice.status === "PAID") throw new ApiError(409, "Invoice is already paid");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(invoice.total * 100),
          product_data: {
            name: `MotoServe Invoice ${invoice.id}`,
            description: `${invoice.job.vehicle.year} ${invoice.job.vehicle.make} ${invoice.job.vehicle.model}`,
          },
        },
      },
    ],
    metadata: { invoiceId: invoice.id, userId },
    success_url: `${CLIENT_URL}/dashboard/payments?status=success`,
    cancel_url: `${CLIENT_URL}/dashboard/payments?status=cancelled`,
  });

  return session.url;
}

export async function handleCheckoutCompleted(payload: Stripe.Checkout.Session) {
  const invoiceId = payload.metadata?.invoiceId;
  if (!invoiceId) return;
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.status === "PAID") return;

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        jobCardId: invoice.jobId,
        amount: invoice.total,
        method: "CARD",
        status: "PAID",
        paidAt: new Date(),
      },
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paymentMethod: "CARD", paidAt: new Date() },
    }),
  ]);
}
