const express = require('express');
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

// Create subscription checkout session (Stripe integration placeholder)
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tier, billingCycle = 'monthly' } = req.body;

    if (!['pro', 'enterprise'].includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription tier'
      });
    }

    // TODO: Integrate with Stripe for actual payment processing
    // For now, return mock checkout session
    const mockCheckoutSession = {
      id: `cs_mock_${Date.now()}`,
      url: `https://checkout.stripe.com/mock/${userId}/${tier}`,
      tier,
      billingCycle,
      amount: getPrice(tier, billingCycle)
    };

    res.json({
      success: true,
      checkoutSession: mockCheckoutSession
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
  try {
    // TODO: Implement Stripe webhook signature verification
    const event = JSON.parse(req.body.toString());
    
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
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(400).json({
      success: false,
      error: 'Webhook processing failed'
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

async function handleSubscriptionUpdate(subscription) {
  // Update user subscription in database
  console.log('Subscription updated:', subscription.id);
  // Implementation details for Stripe integration
}

async function handleSubscriptionCancellation(subscription) {
  // Handle subscription cancellation
  console.log('Subscription cancelled:', subscription.id);
  // Implementation details for Stripe integration
}

async function handlePaymentSuccess(invoice) {
  // Handle successful payment
  console.log('Payment succeeded:', invoice.id);
  // Implementation details for Stripe integration
}

async function handlePaymentFailure(invoice) {
  // Handle failed payment
  console.log('Payment failed:', invoice.id);
  // Implementation details for Stripe integration
}

module.exports = router;