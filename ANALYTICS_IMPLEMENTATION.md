# Vercel Analytics Implementation

This document outlines the analytics tracking implementation for the liquidation furniture e-commerce store.

## Installation

- **Package**: `@vercel/analytics` (installed)
- **Integration**: SvelteKit with Vercel deployment

## Implementation Overview

### 1. Base Analytics Setup

**Location**: `src/routes/+layout.svelte`

The Vercel Analytics component has been added to the root layout, enabling automatic page view tracking across the entire application.

```javascript
import { Analytics } from '@vercel/analytics/sveltekit';
```

This automatically tracks:

- Page views
- Navigation patterns
- Time on site
- Bounce rates
- User sessions

### 2. E-commerce Funnel Tracking

#### Product View Tracking

**Location**: `src/routes/product/[slug]/+page.svelte:16-25`

Tracks when users view a product detail page:

```javascript
track('product_view', {
	product_id: product.id,
	product_name: product.name,
	product_price: Number(product.price),
	category: categoryLabel,
	in_stock: product.in_stock
});
```

**Metrics captured**:

- Which products are most viewed
- Product interest by category
- Views of in-stock vs sold items

#### Add to Cart Tracking

**Location**: `src/routes/product/[slug]/+page.svelte:67-75`

Tracks when users add products to their cart:

```javascript
track('add_to_cart', {
	product_id: product.id,
	product_name: product.name,
	product_price: Number(product.price),
	category: categoryLabel,
	color: selectedColor ?? 'none'
});
```

**Metrics captured**:

- Cart addition rate
- Popular products
- Color preferences
- Add-to-cart conversion by category

#### Checkout Initiation Tracking

**Location**: `src/routes/cart/+page.svelte:60-70`

Tracks when users begin the checkout process:

```javascript
track('checkout_initiated', {
	item_count: itemCount,
	total_value: total,
	cart_items: items.map((item) => ({
		product_id: item.id,
		product_name: item.name,
		quantity: item.quantity,
		price: item.price
	}))
});
```

**Metrics captured**:

- Average cart size
- Average order value
- Cart composition
- Checkout initiation rate

#### Purchase Completion Tracking

**Location**: `src/routes/checkout/success/+page.svelte:8-11`

Tracks successful purchases:

```javascript
track('purchase_completed', {
	timestamp: new Date().toISOString()
});
```

**Note**: More detailed purchase data (items, revenue) is available server-side via the Stripe webhook at `/api/webhooks/stripe`

#### Checkout Cancellation Tracking

**Location**: `src/routes/checkout/cancel/+page.svelte:5-10`

Tracks when users cancel checkout:

```javascript
track('checkout_cancelled', {
	timestamp: new Date().toISOString()
});
```

**Metrics captured**:

- Checkout abandonment rate
- Revenue loss from cancellations

### 3. Admin Activity Tracking

#### Admin Access Tracking

**Location**: `src/routes/admin/+layout.svelte:8-14`

Tracks when administrators access the admin panel:

```javascript
track('admin_access', {
	admin_email: data.user.email,
	timestamp: new Date().toISOString()
});
```

**Metrics captured**:

- Admin login frequency
- Active administrators
- Access patterns

#### Product Management Tracking

**Product Creation**
**Location**: `src/routes/admin/add/+page.server.js:196-204`

```javascript
trackServerEvent('product_created', {
	product_name: name,
	product_price: price,
	product_category: category,
	image_count: imageUrls.length,
	has_dimensions: dimensions !== null,
	has_colors: colors !== null
});
```

**Product Updates**
**Location**: `src/routes/admin/edit/[id]/+page.server.js:186-193`

```javascript
trackServerEvent('product_updated', {
	product_id: params.id,
	product_name: name,
	product_price: price,
	product_category: category
});
```

**Product Deletion**
**Location**: `src/routes/admin/+page.server.js:45-48`

```javascript
trackServerEvent('product_deleted', {
	product_id: id
});
```

**Metrics captured**:

- Inventory management activity
- Product lifecycle
- Admin productivity
- Catalog growth rate

## Server-Side Analytics Utility

**Location**: `src/lib/analytics.js`

A helper utility for logging server-side events. Currently logs to console, but can be extended to send events to analytics services:

```javascript
export function trackServerEvent(event, properties = {}) {
	console.log('[Analytics]', event, properties);
}
```

**Future Enhancement**: This utility can be extended to send events to Vercel Analytics API, Segment, or other analytics platforms for server-side event tracking.

## Key Metrics for Administrators

### Revenue Metrics

1. **Conversion Rate**: Track users from product view → add to cart → checkout → purchase
2. **Average Order Value**: Captured in checkout_initiated events
3. **Cart Abandonment Rate**: Compare checkout_initiated vs purchase_completed
4. **Revenue by Category**: Aggregate from product_view and add_to_cart events

### User Behavior

1. **Product Discovery**: Most viewed products and categories
2. **Navigation Patterns**: Automatic page view tracking
3. **Session Duration**: Automatic tracking by Vercel Analytics
4. **Bounce Rate**: Automatic tracking by Vercel Analytics

### Inventory Management

1. **Product Lifecycle**: Track creation, updates, and deletions
2. **Catalog Growth**: Count product_created events
3. **Admin Activity**: Monitor admin_access and management events
4. **Stock Performance**: Which products generate the most interest

### Checkout Funnel Analysis

```
Product Views
    ↓
Add to Cart (conversion rate 1)
    ↓
Checkout Initiated (cart abandonment rate)
    ↓
Purchase Completed (checkout completion rate)
```

## Accessing Analytics Data

### Vercel Dashboard

1. Navigate to your project in Vercel Dashboard
2. Click on the "Analytics" tab
3. View page views, custom events, and user metrics

### Custom Events

All custom events (product_view, add_to_cart, etc.) are available in the Vercel Analytics dashboard under "Events"

### Filtering & Analysis

You can filter and analyze:

- Events by property (e.g., all add_to_cart for a specific category)
- Conversion funnels
- Time-series data
- Geographic distribution (automatic)
- Device types (automatic)

## Next Steps

### Recommended Enhancements

1. **Revenue Tracking**: Add actual revenue values to purchase_completed events
2. **Search Tracking**: Track search queries on the shop page
3. **Filter Usage**: Track which filters users apply
4. **A/B Testing**: Use Vercel's Edge Config for feature flags
5. **Server-Side Events**: Extend `trackServerEvent` to send to analytics APIs
6. **Quote Submissions**: Track quote form submissions
7. **Performance Monitoring**: Add Web Vitals tracking

### Integration Opportunities

- **Stripe Webhook**: Enhance purchase tracking with order details
- **Email Capture**: Track newsletter signups
- **Social Sharing**: Track if users share products
- **Error Tracking**: Log failed checkouts for recovery

## Privacy & Compliance

Vercel Analytics is GDPR-compliant and doesn't use cookies. All data is anonymized and aggregated.

## Support

For questions about Vercel Analytics, visit: https://vercel.com/docs/analytics
