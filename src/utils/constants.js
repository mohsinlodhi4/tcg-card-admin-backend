// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

const Stripe = require('stripe');

// Singleton Stripe instance
let stripeInstance;

const getStripeInstance = () => {
  if (!stripeInstance) {
    stripeInstance = Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

module.exports = {
    stripe: getStripeInstance(),
}