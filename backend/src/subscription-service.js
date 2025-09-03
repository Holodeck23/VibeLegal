const express = require('express');
// Initialize Stripe only if API key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;
const { pool } = require('./db/pool');
const { authenticateToken } = require('../middleware/authenticateToken');

const router = express.Router();

/**
 * Subscription Service
 * Handles user tier management, feature access control, and billing
 */

// Get user subscription details
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT u.subscription_tier, u.contracts_used_this_month, u.created_at,
              us.status, us.billing_cycle, us.next_billing_date, us.stripe_subscription_id
       FROM users u
       LEFT JOIN user_subscriptions us ON u.id = us.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];
    const tierLimits = getTierLimits(user.subscription_tier);

    res.json({
      success: true,
      subscription: {
        tier: user.subscription_tier,
        status: user.status || 'active',
        billingCycle: user.billing_cycle,
        nextBillingDate: user.next_billing_date,
        contractsUsed: user.contracts_used_this_month,
        contractsLimit: tierLimits.monthlyContracts,
        features: tierLimits.features,
        stripeSubscriptionId: user.stripe_subscription_id
      }
    });

  } catch (error) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription details'
    });
  }
});

// Check feature access
router.get('/access/:feature', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { feature } = req.params;

    const result = await pool.query(
      'SELECT subscription_tier, contracts_used_this_month FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];
    const tierLimits = getTierLimits(user.subscription_tier);
    const hasAccess = checkFeatureAccess(feature, user.subscription_tier, user.contracts_used_this_month, tierLimits);

    res.json({
      success: true,
      hasAccess,
      tier: user.subscription_tier,
      reason: hasAccess ? 'access_granted' : getAccessDenialReason(feature, user.subscription_tier, user.contracts_used_this_month, tierLimits)
    });

  } catch (error) {
    console.error('Feature access check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check feature access'
    });
  }
});

// Create subscription checkout session (Stripe integration)
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        error: 'Payment processing is not configured. Please contact support.'
      });
    }

    const userId = req.user.id;
    const { tier, billingCycle = 'monthly' } = req.body;

    if (!['pro', 'enterprise'].includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription tier'
      });
    }

    // Get user info for customer creation
    const userResult = await pool.query('SELECT email, name FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = userResult.rows[0];

    // Create or retrieve Stripe customer
    let customer;
    try {
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });
      
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: user.name || user.email,
          metadata: {
            userId: userId.toString()
          }
        });
      }
    } catch (stripeError) {
      console.error('Stripe customer creation error:', stripeError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create customer'
      });
    }

    const price = getPrice(tier, billingCycle);
    const priceId = getPriceId(tier, billingCycle);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId, // Use actual Stripe price IDs when available
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?upgrade=cancelled`,
      metadata: {
        userId: userId.toString(),
        tier,
        billingCycle
      },
      subscription_data: {
        metadata: {
          userId: userId.toString(),
          tier
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto'
    });

    res.json({
      success: true,
      checkoutSession: {
        id: session.id,
        url: session.url,
        tier,
        billingCycle,
        amount: price
      }
    });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session'
    });
  }
});

// Webhook for handling Stripe subscription events
router.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  let event;

  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        error: 'Payment processing is not configured'
      });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret) {
      // Verify webhook signature for security
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // For development/testing without webhook secret
      event = JSON.parse(req.body.toString());
    }
    
    console.log('Stripe webhook event:', event.type);
    
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(400).json({
      success: false,
      error: `Webhook Error: ${error.message}`
    });
  }
});

// Update user subscription tier
router.post('/update-tier', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tier, stripeSubscriptionId } = req.body;

    await pool.query(
      'UPDATE users SET subscription_tier = $1 WHERE id = $2',
      [tier, userId]
    );

    // Create or update subscription record
    await pool.query(
      `INSERT INTO user_subscriptions (user_id, plan_type, status, stripe_subscription_id, created_at)
       VALUES ($1, $2, 'active', $3, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         plan_type = EXCLUDED.plan_type,
         status = EXCLUDED.status,
         stripe_subscription_id = EXCLUDED.stripe_subscription_id,
         updated_at = NOW()`,
      [userId, tier, stripeSubscriptionId]
    );

    res.json({
      success: true,
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    console.error('Tier update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subscription tier'
    });
  }
});

// Helper Functions

function getTierLimits(tier) {
  const limits = {
    basic: {
      monthlyContracts: 5,
      features: ['basic_contract_generation'],
      price: 0
    },
    pro: {
      monthlyContracts: -1, // unlimited
      features: [
        'basic_contract_generation',
        'conversational_ai',
        'advanced_customization',
        'risk_tolerance_controls',
        'legal_stance_selection',
        'contract_versioning',
        'priority_support'
      ],
      price: { monthly: 29, yearly: 290 }
    },
    enterprise: {
      monthlyContracts: -1, // unlimited
      features: [
        'basic_contract_generation',
        'conversational_ai',
        'advanced_customization',
        'risk_tolerance_controls',
        'legal_stance_selection',
        'contract_versioning',
        'team_collaboration',
        'usage_analytics',
        'priority_support',
        'dedicated_support'
      ],
      price: { monthly: 99, yearly: 990 }
    }
  };

  return limits[tier] || limits.basic;
}

function checkFeatureAccess(feature, tier, contractsUsed, tierLimits) {
  // Check if feature is included in tier
  if (!tierLimits.features.includes(feature)) {
    return false;
  }

  // Check monthly contract limits
  if (feature === 'basic_contract_generation' && tierLimits.monthlyContracts !== -1) {
    return contractsUsed < tierLimits.monthlyContracts;
  }

  return true;
}

function getAccessDenialReason(feature, tier, contractsUsed, tierLimits) {
  if (!tierLimits.features.includes(feature)) {
    return 'feature_not_included_in_tier';
  }

  if (feature === 'basic_contract_generation' && tierLimits.monthlyContracts !== -1) {
    if (contractsUsed >= tierLimits.monthlyContracts) {
      return 'monthly_limit_exceeded';
    }
  }

  return 'unknown';
}

function getPrice(tier, billingCycle) {
  const limits = getTierLimits(tier);
  return limits.price[billingCycle] || limits.price.monthly;
}

// Get Stripe price ID based on tier and billing cycle
function getPriceId(tier, billingCycle) {
  // In production, these would be actual Stripe price IDs
  // For now, we'll create them dynamically or use fallback pricing
  const priceIds = {
    'pro': {
      'monthly': process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly_fallback',
      'yearly': process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly_fallback'
    },
    'enterprise': {
      'monthly': process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly_fallback',
      'yearly': process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly_fallback'
    }
  };

  return priceIds[tier]?.[billingCycle] || null;
}

async function handleCheckoutCompleted(session) {
  try {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier;
    
    if (!userId || !tier) {
      console.error('Missing metadata in checkout session:', session.id);
      return;
    }

    // Update user subscription tier
    await pool.query(
      'UPDATE users SET subscription_tier = $1 WHERE id = $2',
      [tier, userId]
    );

    // Create or update subscription record
    await pool.query(
      `INSERT INTO user_subscriptions (user_id, plan_type, status, stripe_subscription_id, stripe_customer_id, created_at)
       VALUES ($1, $2, 'active', $3, $4, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         plan_type = EXCLUDED.plan_type,
         status = EXCLUDED.status,
         stripe_subscription_id = EXCLUDED.stripe_subscription_id,
         stripe_customer_id = EXCLUDED.stripe_customer_id,
         updated_at = NOW()`,
      [userId, tier, session.subscription, session.customer]
    );

    console.log(`Checkout completed for user ${userId}, upgraded to ${tier}`);
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

async function handleSubscriptionUpdate(subscription) {
  try {
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('Missing userId in subscription metadata:', subscription.id);
      return;
    }

    const status = subscription.status;
    const tier = subscription.metadata?.tier || 'pro';

    await pool.query(
      `UPDATE user_subscriptions 
       SET status = $1, 
           current_period_start = to_timestamp($2),
           current_period_end = to_timestamp($3),
           updated_at = NOW()
       WHERE stripe_subscription_id = $4`,
      [status, subscription.current_period_start, subscription.current_period_end, subscription.id]
    );

    // Update user tier if subscription is active
    if (status === 'active') {
      await pool.query(
        'UPDATE users SET subscription_tier = $1 WHERE id = $2',
        [tier, userId]
      );
    } else if (status === 'canceled' || status === 'past_due') {
      await pool.query(
        'UPDATE users SET subscription_tier = $1 WHERE id = $2',
        ['basic', userId]
      );
    }

    console.log(`Subscription ${subscription.id} updated to ${status} for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionCancellation(subscription) {
  try {
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('Missing userId in subscription metadata:', subscription.id);
      return;
    }

    // Downgrade user to basic tier
    await pool.query(
      'UPDATE users SET subscription_tier = $1 WHERE id = $2',
      ['basic', userId]
    );

    // Update subscription record
    await pool.query(
      `UPDATE user_subscriptions 
       SET status = 'canceled', updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [subscription.id]
    );

    console.log(`Subscription ${subscription.id} cancelled for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentSuccess(invoice) {
  try {
    const subscriptionId = invoice.subscription;
    
    if (subscriptionId) {
      await pool.query(
        `UPDATE user_subscriptions 
         SET status = 'active', updated_at = NOW()
         WHERE stripe_subscription_id = $1`,
        [subscriptionId]
      );
    }

    console.log(`Payment succeeded for invoice ${invoice.id}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(invoice) {
  try {
    const subscriptionId = invoice.subscription;
    
    if (subscriptionId) {
      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata?.userId;
      
      if (userId && subscription.status === 'past_due') {
        // Optionally downgrade user or send notifications
        await pool.query(
          `UPDATE user_subscriptions 
           SET status = 'past_due', updated_at = NOW()
           WHERE stripe_subscription_id = $1`,
          [subscriptionId]
        );
      }
    }

    console.log(`Payment failed for invoice ${invoice.id}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

module.exports = router;