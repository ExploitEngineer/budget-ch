"use server"
import { stripe } from "./stripe";
import { subscriptionLookupKeys } from "./stripe-constants";

export async function loadStripePrices() {
    try {
      const prices = await stripe.prices.list({
        // Use the lookup_keys filter for precise fetching
        lookup_keys: subscriptionLookupKeys,
        active: true,
        // Expand the product to get display names/descriptions
        // expand: ['data.product'],
      });
  
      return { success: true, prices };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }