import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is missing. Stripe features will not work.');
}

// @ts-ignore
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key_for_build', {
    // @ts-ignore
    apiVersion: '2026-01-28.clover',
    typescript: true,
});
