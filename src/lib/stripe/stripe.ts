import Stripe from "stripe";

// Server-only: Stripe instance with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
