import { Router } from "express";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET, { apiVersion: '2023-10-16' });
const router = Router();

router.post('/create-session', async (req, res) => {
  // Create Stripe Checkout session
});

export { router as billingRouter };