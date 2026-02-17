# **SvelteKit Page Structure & Route Map**

This document outlines the specific files you need to create within the src/routes directory. In SvelteKit, the folder structure determines the URL of the page.

## **1\. Public Storefront (Customer Facing)**

These pages are accessible to everyone.

### **Home Page**

- **File Path:** src/routes/+page.svelte
- **URL:** /
- **Purpose:** The main landing page. Welcomes visitors and directs them to the shop.
- **Key Features:**
  - **Hero Section:** Store logo (`static/logo.png.avif`), headline, tagline, and a "Shop Now" call-to-action linking to `/shop`.
  - **Value Propositions:** Three-column grid highlighting liquidation prices, quality, and secure checkout.

### **Shop Page**

- **File Path:** src/routes/shop/+page.svelte
- **URL:** /shop
- **Purpose:** The browsable product catalog.
- **Key Features:**
  - **Product Grid:** Displays the thumbnails of furniture items.
  - **Infinite Scroll:** Logic to fetch more items when the user reaches the bottom.
  - **Server Load:** \+page.server.ts fetches the initial batch of 12 products.

### **Product Detail Page**

- **File Path:** src/routes/product/\[slug\]/+page.svelte
- **URL:** /product/blue-velvet-sofa (dynamic)
- **Purpose:** Shows full details for a single item.
- **Key Features:**
  - **Image Gallery:** Large view of the product image.
  - **Info Panel:** Price, description, dimensions, and stock status.
  - **"Add to Cart" Button:** Triggers an update to the global cart store.
  - **Server Load:** \+page.server.ts fetches the specific product data using the slug from the URL.

### **Cart Page (Optional)**

- **File Path:** src/routes/cart/+page.svelte
- **URL:** /cart
- **Purpose:** Allows users to review items before paying.
- **Key Features:**
  - **List View:** Shows all items currently in the cart.
  - **Quantity Adjusters:** \+/- buttons (if you allow multiples).
  - **Remove Button:** Trash icon to delete an item.
  - **Checkout Button:** Triggers the API call to Stripe.
  - _Note:_ You can also implement this as a "Sidebar" component instead of a full page.

### **Checkout Success**

- **File Path:** src/routes/checkout/success/+page.svelte
- **URL:** /checkout/success
- **Purpose:** The page a user lands on after paying on Stripe.
- **Key Features:**
  - "Thank you" message.
  - Order summary (optional).
  - Button to continue shopping.

### **Checkout Cancel**

- **File Path:** src/routes/checkout/cancel/+page.svelte
- **URL:** /checkout/cancel
- **Purpose:** The page a user lands on if they click "Back" inside Stripe.
- **Key Features:**
  - "Your order was not processed" message.
  - Button to return to cart.

## **2\. Manager Portal (Admin Facing)**

These pages should be protected. If a user isn't logged in, they should be redirected to /login.

### **Login Page**

- **File Path:** src/routes/login/+page.svelte
- **URL:** /login
- **Purpose:** Entry point for the manager.
- **Key Features:**
  - Email and Password input fields.
  - "Sign In" button connected to Supabase Auth.
  - Redirects to /admin upon success.

### **Admin Dashboard**

- **File Path:** src/routes/admin/+page.svelte
- **URL:** /admin
- **Purpose:** Overview of inventory.
- **Key Features:**
  - **Product Table:** Lists all items (Name, Price, Status).
  - **Delete Actions:** Buttons to remove items from the database.
  - **"Add New" Button:** Link to the creation page.
  - **Layout:** Should use a separate \+layout.svelte in the admin folder to show a Sidebar/Logout button.

### **Add Product Page**

- **File Path:** src/routes/admin/add/+page.svelte
- **URL:** /admin/add
- **Purpose:** Form to upload new furniture.
- **Key Features:**
  - **File Input:** For uploading the product image to Supabase Storage.
  - **Text Inputs:** Name, Price, Description, Category.
  - **Submit Button:** Saves data to the products table.

## **3\. API Routes (Backend Logic)**

These are not pages users "see," but endpoints your application talks to.

### **Products Pagination**

- **File Path:** src/routes/api/products/+server.ts
- **Method:** GET
- **Purpose:** Returns a JSON list of products based on a page or offset parameter. Used for infinite scroll.

### **Stripe Checkout Session**

- **File Path:** src/routes/api/checkout/+server.ts
- **Method:** POST
- **Purpose:** Receives the cart contents, validates prices against the database, and creates a Stripe Checkout Session URL.

### **Stripe Webhook**

- **File Path:** src/routes/api/webhooks/stripe/+server.ts
- **Method:** POST
- **Purpose:** Listens for "payment success" signals from Stripe servers to update your database (e.g., mark an item as "Sold" or record an order) automatically.

## **4\. Components (Reusable UI)**

These live in src/lib/components and are imported into the pages above.

- Navbar.svelte: The top header. Displays the store logo image (`static/logo.png.avif`) and navigation links (Home, Shop, Cart).
- Footer.svelte: The bottom links.
- ProductCard.svelte: The visual block for a single item (Image \+ Title \+ Price).
- CartDrawer.svelte: (Optional) If you prefer a slide-out cart instead of a page.
