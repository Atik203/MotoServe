import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3500";
