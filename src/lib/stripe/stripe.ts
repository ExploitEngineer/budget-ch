import Stripe from "stripe";
import { subscriptionLookupKeys } from "./stripe-constants";

// Server-only: Stripe instance with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
