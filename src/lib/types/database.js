/**
 * Hand-written Supabase type definitions matching the schema in
 * supabase/migrations/001_initial_schema.sql
 *
 * These are passed to `createClient<Database>(...)` so every query
 * is type-checked at development time.
 */

/** @typedef {'pending' | 'paid' | 'failed' | 'refunded'} PaymentStatus */

/**
 * @typedef {Object} ProductDimensions
 * @property {number}  [width]
 * @property {number}  [height]
 * @property {number}  [depth]
 * @property {string}  [unit]
 */

/**
 * @typedef {Object} ProductRow
 * @property {string}  id
 * @property {string}  name
 * @property {string}  slug
 * @property {string}  description
 * @property {number}  price
 * @property {number|null} compare_at_price
 * @property {string}  category
 * @property {string[]}  image_url
 * @property {boolean} in_stock
 * @property {ProductDimensions|null} dimensions
 * @property {string[]|null} colors
 * @property {string}  created_at
 * @property {number|null} stock_quantity
 * @property {string[]|null} bundle_component_ids
 */

/**
 * @typedef {Object} ProductInsert
 * @property {string}  [id]
 * @property {string}  name
 * @property {string}  slug
 * @property {string}  [description]
 * @property {number}  price
 * @property {number|null} [compare_at_price]
 * @property {string}  [category]
 * @property {string[]}  [image_url]
 * @property {boolean} [in_stock]
 * @property {ProductDimensions|null} [dimensions]
 * @property {string[]|null} [colors]
 * @property {string}  [created_at]
 * @property {number|null} [stock_quantity]
 * @property {string[]|null} [bundle_component_ids]
 */

/**
 * @typedef {Object} ProductUpdate
 * @property {string}  [id]
 * @property {string}  [name]
 * @property {string}  [slug]
 * @property {string}  [description]
 * @property {number}  [price]
 * @property {number|null} [compare_at_price]
 * @property {string}  [category]
 * @property {string[]}  [image_url]
 * @property {boolean} [in_stock]
 * @property {ProductDimensions|null} [dimensions]
 * @property {string[]|null} [colors]
 * @property {string}  [created_at]
 * @property {number|null} [stock_quantity]
 * @property {string[]|null} [bundle_component_ids]
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} product_id
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 */

/**
 * @typedef {'pickup' | 'ship'} FulfillmentMethod
 */

/**
 * Shape of Stripe's `collected_information.shipping_details` (see
 * src/routes/api/webhooks/stripe/+server.js), stored as-is on the order.
 * @typedef {Object} OrderShippingAddress
 * @property {string|null} name
 * @property {Object} address
 * @property {string|null} address.line1
 * @property {string|null} address.line2
 * @property {string|null} address.city
 * @property {string|null} address.state
 * @property {string|null} address.postal_code
 * @property {string|null} address.country
 */

/**
 * @typedef {Object} OrderRow
 * @property {string}        id
 * @property {string|null}   stripe_session_id
 * @property {string}        customer_email
 * @property {OrderItem[]}   items
 * @property {PaymentStatus} payment_status
 * @property {string}        created_at
 * @property {FulfillmentMethod|null} fulfillment_method
 * @property {string|null}   shipping_zip
 * @property {number|null}   shipping_fee
 * @property {OrderShippingAddress|null} shipping_address
 */

/**
 * @typedef {Object} OrderInsert
 * @property {string}        [id]
 * @property {string}        [stripe_session_id]
 * @property {string}        customer_email
 * @property {OrderItem[]}   items
 * @property {PaymentStatus} [payment_status]
 * @property {string}        [created_at]
 * @property {FulfillmentMethod|null} [fulfillment_method]
 * @property {string|null}   [shipping_zip]
 * @property {number|null}   [shipping_fee]
 * @property {OrderShippingAddress|null} [shipping_address]
 */

/**
 * @typedef {Object} OrderUpdate
 * @property {string}        [id]
 * @property {string}        [stripe_session_id]
 * @property {string}        [customer_email]
 * @property {OrderItem[]}   [items]
 * @property {PaymentStatus} [payment_status]
 * @property {string}        [created_at]
 * @property {FulfillmentMethod|null} [fulfillment_method]
 * @property {string|null}   [shipping_zip]
 * @property {number|null}   [shipping_fee]
 * @property {OrderShippingAddress|null} [shipping_address]
 */

/**
 * @typedef {Object} ShippingRateRow
 * @property {string}  id
 * @property {string}  label
 * @property {number|null} zip_start
 * @property {number|null} zip_end
 * @property {number}  fee
 * @property {number}  sort_order
 * @property {boolean} is_active
 * @property {boolean} is_fallback
 * @property {string}  created_at
 */

/**
 * @typedef {Object} ShippingRateInsert
 * @property {string}  [id]
 * @property {string}  label
 * @property {number|null} [zip_start]
 * @property {number|null} [zip_end]
 * @property {number}  fee
 * @property {number}  [sort_order]
 * @property {boolean} [is_active]
 * @property {boolean} [is_fallback]
 * @property {string}  [created_at]
 */

/**
 * @typedef {Object} ShippingRateUpdate
 * @property {string}  [id]
 * @property {string}  [label]
 * @property {number|null} [zip_start]
 * @property {number|null} [zip_end]
 * @property {number}  [fee]
 * @property {number}  [sort_order]
 * @property {boolean} [is_active]
 * @property {boolean} [is_fallback]
 * @property {string}  [created_at]
 */

/**
 * @typedef {Object} CategoryRow
 * @property {string} id
 * @property {string} value
 * @property {string} label
 * @property {string} slug
 * @property {number} sort_order
 * @property {boolean} is_active
 * @property {string} created_at
 */

/**
 * @typedef {Object} CategoryInsert
 * @property {string} [id]
 * @property {string} value
 * @property {string} label
 * @property {string} [slug]
 * @property {number} [sort_order]
 * @property {boolean} [is_active]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} CategoryUpdate
 * @property {string} [id]
 * @property {string} [value]
 * @property {string} [label]
 * @property {string} [slug]
 * @property {number} [sort_order]
 * @property {boolean} [is_active]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} QuoteRow
 * @property {string} id
 * @property {string} quote
 * @property {string} reviewer
 * @property {string} created_at
 */

/**
 * @typedef {Object} QuoteInsert
 * @property {string} [id]
 * @property {string} quote
 * @property {string} reviewer
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} QuoteUpdate
 * @property {string} [id]
 * @property {string} [quote]
 * @property {string} [reviewer]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} PageViewRow
 * @property {number} id
 * @property {string} path
 * @property {string|null} search
 * @property {string} visitor_id
 * @property {string|null} referrer
 * @property {string} created_at
 */

/**
 * @typedef {Object} PageViewInsert
 * @property {number} [id]
 * @property {string} path
 * @property {string|null} [search]
 * @property {string} visitor_id
 * @property {string|null} [referrer]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} PageViewUpdate
 * @property {number} [id]
 * @property {string} [path]
 * @property {string|null} [search]
 * @property {string} [visitor_id]
 * @property {string|null} [referrer]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} SearchQueryRow
 * @property {string} id
 * @property {string} term
 * @property {number} result_count
 * @property {string|null} category
 * @property {string|null} visitor_id
 * @property {string} created_at
 */

/**
 * @typedef {Object} SearchQueryInsert
 * @property {string} [id]
 * @property {string} term
 * @property {number} result_count
 * @property {string|null} [category]
 * @property {string|null} [visitor_id]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} SearchQueryUpdate
 * @property {string} [id]
 * @property {string} [term]
 * @property {number} [result_count]
 * @property {string|null} [category]
 * @property {string|null} [visitor_id]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} ReportRow
 * @property {string} id
 * @property {'week'|'month'|'quarter'} period_type
 * @property {string} period_start
 * @property {string} period_end
 * @property {object} metrics
 * @property {string} recipient
 * @property {'sent'|'failed'} status
 * @property {string|null} error_message
 * @property {string} created_at
 */

/**
 * @typedef {Object} ReportInsert
 * @property {string} [id]
 * @property {'week'|'month'|'quarter'} period_type
 * @property {string} period_start
 * @property {string} period_end
 * @property {object} metrics
 * @property {string} recipient
 * @property {'sent'|'failed'} status
 * @property {string|null} [error_message]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} ReportUpdate
 * @property {string} [id]
 * @property {'week'|'month'|'quarter'} [period_type]
 * @property {string} [period_start]
 * @property {string} [period_end]
 * @property {object} [metrics]
 * @property {string} [recipient]
 * @property {'sent'|'failed'} [status]
 * @property {string|null} [error_message]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} PendingCheckoutItemRow
 * @property {string} session_id
 * @property {Object[]} items
 * @property {string} created_at
 */

/**
 * @typedef {Object} PendingCheckoutItemInsert
 * @property {string} session_id
 * @property {Object[]} items
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} PendingCheckoutItemUpdate
 * @property {string} [session_id]
 * @property {Object[]} [items]
 * @property {string} [created_at]
 */

/**
 * Supabase Database type definition.
 *
 * Each table carries a `Relationships` field and the schema carries empty
 * `Views`/`Functions` maps even though this project doesn't use either -
 * @supabase/supabase-js's `SupabaseClient<Database>` only resolves table
 * Row/Insert/Update types when `Database['public']` structurally satisfies
 * its internal `GenericSchema` constraint (which requires exactly those
 * fields). Without them, the constraint fails to match and every typed
 * query silently resolves to `never` instead of raising a visible error -
 * which is what was happening before these were added.
 *
 * @typedef {Object} Database
 * @property {Object} public
 * @property {Object} public.Tables
 * @property {Object} public.Tables.products
 * @property {ProductRow}    public.Tables.products.Row
 * @property {ProductInsert} public.Tables.products.Insert
 * @property {ProductUpdate} public.Tables.products.Update
 * @property {never[]} public.Tables.products.Relationships
 * @property {Object} public.Tables.orders
 * @property {OrderRow}    public.Tables.orders.Row
 * @property {OrderInsert} public.Tables.orders.Insert
 * @property {OrderUpdate} public.Tables.orders.Update
 * @property {never[]} public.Tables.orders.Relationships
 * @property {Object} public.Tables.quotes
 * @property {QuoteRow}    public.Tables.quotes.Row
 * @property {QuoteInsert} public.Tables.quotes.Insert
 * @property {QuoteUpdate} public.Tables.quotes.Update
 * @property {never[]} public.Tables.quotes.Relationships
 * @property {Object} public.Tables.categories
 * @property {CategoryRow}    public.Tables.categories.Row
 * @property {CategoryInsert} public.Tables.categories.Insert
 * @property {CategoryUpdate} public.Tables.categories.Update
 * @property {never[]} public.Tables.categories.Relationships
 * @property {Object} public.Tables.shipping_rates
 * @property {ShippingRateRow}    public.Tables.shipping_rates.Row
 * @property {ShippingRateInsert} public.Tables.shipping_rates.Insert
 * @property {ShippingRateUpdate} public.Tables.shipping_rates.Update
 * @property {never[]} public.Tables.shipping_rates.Relationships
 * @property {Object} public.Tables.page_views
 * @property {PageViewRow}    public.Tables.page_views.Row
 * @property {PageViewInsert} public.Tables.page_views.Insert
 * @property {PageViewUpdate} public.Tables.page_views.Update
 * @property {never[]} public.Tables.page_views.Relationships
 * @property {Object} public.Tables.pending_checkout_items
 * @property {PendingCheckoutItemRow}    public.Tables.pending_checkout_items.Row
 * @property {PendingCheckoutItemInsert} public.Tables.pending_checkout_items.Insert
 * @property {PendingCheckoutItemUpdate} public.Tables.pending_checkout_items.Update
 * @property {never[]} public.Tables.pending_checkout_items.Relationships
 * @property {Object} public.Tables.search_queries
 * @property {SearchQueryRow}    public.Tables.search_queries.Row
 * @property {SearchQueryInsert} public.Tables.search_queries.Insert
 * @property {SearchQueryUpdate} public.Tables.search_queries.Update
 * @property {never[]} public.Tables.search_queries.Relationships
 * @property {Object} public.Tables.reports
 * @property {ReportRow}    public.Tables.reports.Row
 * @property {ReportInsert} public.Tables.reports.Insert
 * @property {ReportUpdate} public.Tables.reports.Update
 * @property {never[]} public.Tables.reports.Relationships
 * @property {Record<never, never>} public.Views
 * @property {Record<never, never>} public.Functions
 */

export {};
