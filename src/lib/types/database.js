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
 * @property {string}  category
 * @property {string}  image_url
 * @property {boolean} in_stock
 * @property {ProductDimensions|null} dimensions
 * @property {string[]|null} colors
 * @property {string}  created_at
 */

/**
 * @typedef {Object} ProductInsert
 * @property {string}  [id]
 * @property {string}  name
 * @property {string}  slug
 * @property {string}  [description]
 * @property {number}  price
 * @property {string}  [category]
 * @property {string}  [image_url]
 * @property {boolean} [in_stock]
 * @property {ProductDimensions|null} [dimensions]
 * @property {string[]|null} [colors]
 * @property {string}  [created_at]
 */

/**
 * @typedef {Object} ProductUpdate
 * @property {string}  [id]
 * @property {string}  [name]
 * @property {string}  [slug]
 * @property {string}  [description]
 * @property {number}  [price]
 * @property {string}  [category]
 * @property {string}  [image_url]
 * @property {boolean} [in_stock]
 * @property {ProductDimensions|null} [dimensions]
 * @property {string[]|null} [colors]
 * @property {string}  [created_at]
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} product_id
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 */

/**
 * @typedef {Object} OrderRow
 * @property {string}        id
 * @property {string|null}   stripe_session_id
 * @property {string}        customer_email
 * @property {OrderItem[]}   items
 * @property {PaymentStatus} payment_status
 * @property {string}        created_at
 */

/**
 * @typedef {Object} OrderInsert
 * @property {string}        [id]
 * @property {string}        [stripe_session_id]
 * @property {string}        customer_email
 * @property {OrderItem[]}   items
 * @property {PaymentStatus} [payment_status]
 * @property {string}        [created_at]
 */

/**
 * @typedef {Object} OrderUpdate
 * @property {string}        [id]
 * @property {string}        [stripe_session_id]
 * @property {string}        [customer_email]
 * @property {OrderItem[]}   [items]
 * @property {PaymentStatus} [payment_status]
 * @property {string}        [created_at]
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
 * Supabase Database type definition.
 *
 * @typedef {Object} Database
 * @property {Object} public
 * @property {Object} public.Tables
 * @property {Object} public.Tables.products
 * @property {ProductRow}    public.Tables.products.Row
 * @property {ProductInsert} public.Tables.products.Insert
 * @property {ProductUpdate} public.Tables.products.Update
 * @property {Object} public.Tables.orders
 * @property {OrderRow}    public.Tables.orders.Row
 * @property {OrderInsert} public.Tables.orders.Insert
 * @property {OrderUpdate} public.Tables.orders.Update
 * @property {Object} public.Tables.quotes
 * @property {QuoteRow}    public.Tables.quotes.Row
 * @property {QuoteInsert} public.Tables.quotes.Insert
 * @property {QuoteUpdate} public.Tables.quotes.Update
 */

export { };
