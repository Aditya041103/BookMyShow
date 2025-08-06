import { buffer } from 'micro';
import stripePackage from 'stripe';
import Booking from '../server/models/Booking.js';
import Show from '../server/models/Show.js';
import { inngest } from '../server/inngest/index.js';

const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false, // Required for Stripe webhooks
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const sessionList = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id
        });

        const session = sessionList.data[0];
        const { bookingId } = session.metadata;

        const booking = await Booking.findByIdAndUpdate(bookingId, {
          isPaid: true,
          paymentLink: ""
        }, { new: true });

        console.log('Payment succeeded for booking:', bookingId);
        
        if (booking) {
          const showData = await Show.findById(booking.show);
          booking.bookedSeats.forEach(seat => {
            showData.occupiedSeats[seat] = booking.user;
          });
          showData.markModified('occupiedSeats');
          await showData.save();
        }

        // Send Confirmation Email
        await inngest.send({
          name: "app/show.booked",
          data: { bookingId }
        });

        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).send("Internal Server Error");
  }
}
