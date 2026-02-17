# **Implementation Plan: Furniture E-Commerce Store**

### **Project Overview**

- **Website Description:** A lightweight, high-performance e-commerce platform modeled after "Henry's Liquidation Store," specifically designed for selling discounted furniture. The site features a clean, infinite-scroll catalog to handle inventory efficienty without overwhelming the user.

- **Purpose:** To enable a small business to display and sell furniture online with minimal overhead. It provides a public-facing storefront for customers to browse "on-demand" inventory and purchase items securely via Stripe, alongside a private, secure administrative portal for the manager to photograph, upload, and manage products directly from any device.
  **Tech Stack:** SvelteKit, Bun, Supabase, Stripe, Tailwind CSS  
  **Deployment:** Vercel

## **Phase 1: Environment Setup & Architecture**

_Goal: Initialize a high-performance development environment using Bun and prepare the project structure for Vercel deployment._

### **1\. Project Initialization**

- **Initialize Project:** Use the Bun command line tool to create a new SvelteKit skeleton project. Select TypeScript for type safety and Prettier/ESLint for code formatting.
- **Install Dependencies:** Run the installation command to download all necessary node modules using Bun's fast package manager.
- **Version Control:** Initialize a Git repository to track all changes from the start.

### **2\. Vercel Configuration**

- **Install Adapter:** Add the specific Vercel adapter package to the project.
- **Configure Svelte Config:** Update the main configuration file to use the Vercel adapter instead of the default auto-adapter. This ensures the app builds correctly as Serverless Functions.
- **Environment Variables:** Create a secure local `.env` file to store sensitive API keys (Supabase URL, Supabase Anon Key, Stripe Secret Key). Add this file to the ignore list so it is not uploaded to Git.
- **Secrets Encryption (dotenvx):** Use `@dotenvx/dotenvx` to encrypt the `.env` file in place. The encrypted `.env` is safe to commit to Git (secrets are encrypted with a public key). The private decryption key lives in `.env.keys`, which is gitignored and must never be committed. All `package.json` scripts (`dev`, `build`, `preview`) are prefixed with `dotenvx run --` so secrets are decrypted at runtime. For production (Vercel), set the `DOTENV_PRIVATE_KEY` environment variable in the hosting dashboard.

### **3\. Architecture Planning**

- **Directory Structure:** Organize the source folder to separate reusable UI components, server-side logic (database calls), and public routes.
- **Bun vs Node Runtime:** Configure the local script commands to use Bun for development speed, while ensuring the build output remains compatible with Vercel's standard Node.js runtime.

## **Phase 2: Database & Storage (Supabase)**

_Goal: Design the data schema to support furniture inventory and secure file hosting._

### **1\. Database Schema Design**

- **Create Products Table:** Define a table to store inventory. Required fields include:
  - Unique ID (UUID)
  - Product Name (Text)
  - Product Slug (Text, for SEO-friendly URLs)
  - Description (Text)
  - Price (Number/Decimal)
  - Category (Text, e.g., "Living Room", "Bedroom")
  - Image URL (Text)
  - Stock Status (Boolean or Text)
  - Created At (Timestamp)
- **Create Orders Table:** Define a table to track sales. Required fields include:
  - Order ID (UUID)
  - Stripe Session ID (Text, for cross-referencing payments)
  - Customer Email (Text)
  - List of Items Purchased (JSON format)
  - Payment Status (Text, e.g., "Paid", "Pending")

### **2\. Security & Permissions (Row Level Security)**

- **Enable RLS:** Activate Row Level Security on all tables to prevent unauthorized access.
- **Public Read Policy:** Create a rule allowing any visitor (logged in or not) to view rows in the Products table.
- **Manager Write Policy:** Create a strict rule allowing only authenticated users (the manager) to insert, update, or delete rows in the Products table.
- **Private Orders Policy:** Create a rule ensuring only the server-side admin client can read or write to the Orders table.

### **3\. Asset Storage (Images)**

- **Create Storage Bucket:** Initialize a dedicated bucket for product images.
- **Public Access Settings:** Configure the bucket permissions to allow public viewing of files so product images load for customers.
- **Upload Restrictions:** Configure policy rules so that only authenticated users (managers) can upload new files.

## **Phase 3: Manager Portal (Admin Area)**

_Goal: Create a secure, private interface for managing inventory._

### **1\. Authentication**

- **Login Interface:** Design a minimal login page requiring an email and password.
- **Auth Implementation:** Connect the form to the backend authentication service to verify credentials.
- **Session Management:** specific logic to store the user's session secure cookie upon successful login.
- **Route Protection:** Implement a server-side check (hook) that intercepts any attempt to access the Admin area. If the user is not logged in, immediately redirect them to the Login page.

### **2\. Product Management Interface**

- **Dashboard View:** Create a table view that lists all current products from the database, showing thumbnail, name, price, and stock status.
- **Delete Functionality:** Add a button to each row allowing the manager to remove a product from the database.
- **Add Product Form:** Develop a form with inputs for all product details (Name, Price, Category, Description).
- **Edit Product Form:** Create a route to edit existing products, pre-filling the form with current data and allowing updates to all fields including the image.

### **3\. Image Upload Pipeline**

- **File Picker:** Add a file input field to the Add Product form that accepts image files only.
- **Upload Logic:** Implement a function that detects when a file is selected, uploads it directly to the Storage Bucket, and retrieves the resulting public URL.
- **Database Entry:** Ensure the form submission includes this specific image URL when saving the new product to the database.

## **Phase 4: Customer Storefront (Frontend)**

_Goal: Build a fast, "On Demand" shopping experience that loads quickly._

### **1\. Layout & Navigation**

- **Global Layout:** Create a master layout file containing the Navigation Bar (Logo image, Links, Cart Icon) and Footer. This ensures consistency across all pages.
- **Logo:** The Navbar displays the store logo from `static/logo.png.avif` as an image link back to the home page.
- **Navigation Links:** The Navbar contains three primary links — **Home** (`/`), **Shop** (`/shop`), and **Cart** (`/cart`).
- **Responsive Design:** Ensure the layout adjusts automatically for mobile phones, tablets, and desktop screens.

### **2\. Home Page**

- **Landing Page:** The root URL (`/`) is a dedicated Home page separate from the Shop.
- **Hero Section:** Displays the store logo, a headline, a tagline, and a prominent "Shop Now" call-to-action button linking to `/shop`.
- **Value Propositions:** A section highlighting key selling points (liquidation prices, quality, secure checkout).

### **3\. Shop Page & Infinite Scroll (On-Demand Loading)**

- **Shop Route:** The product catalog lives at `/shop`, not the root URL.
- **Initial Fetch:** Configure the server to load only a small batch (e.g., 12 items) of products when the shop page first loads.
- **Pagination API:** Create a specific API endpoint that accepts a "page number" or "offset" parameter and returns the next batch of products from the database.
- **Intersection Observer:** Implement a UI detector at the bottom of the product grid. When the user scrolls down and this detector becomes visible, automatically trigger the API to fetch the next batch of products.
- **State Appending:** detailed logic to take the new products and append them to the existing list without refreshing the page.

### **4\. Product Details**

- **Dynamic Routing:** Create a specific route that captures the product ID or Slug from the URL.
- **Data Fetching:** Configure the page to fetch full details for that specific single product from the database upon load.
- **Image Optimization:** Apply lazy-loading attributes to the product image to prioritize performance.

### **5\. Shopping Cart System**

- **Cart Store:** Create a state management store to track selected items.
- **Persistence:** Link the store to Local Storage so the cart contents remain saved even if the user refreshes the browser.
- **UI Feedback:** Add visual cues (toast notifications or cart icon counter updates) when a user adds an item.

## **Phase 5: Payments (Stripe)**

_Goal: Securely process transactions using Stripe Checkout._

### **1\. Checkout Integration**

- **Checkout Endpoint:** Create a server-side API route to handle checkout requests.
- **Price Verification:** _Critical Task:_ When a checkout request comes in, ignore the price sent by the frontend. Instead, use the product IDs to look up the authentic prices from the database to prevent fraud.
- **Session Creation:** Send the verified line items to the payment provider to generate a secure Checkout Session URL.
- **Redirection:** Send this URL back to the frontend to redirect the customer to the secure payment page.

### **2\. Post-Payment Handling**

- **Success Page:** Create a "Thank You" page to display after a successful purchase.
- **Cancel Page:** Create a page to handle cases where the user backs out of the payment screen.

## **Phase 6: Styling & Polish**

_Goal: Apply a professional look using utility-first CSS._

### **1\. Tailwind Configuration**

- **Setup:** Initialize the utility CSS framework and configure it to scan all component files for class names.
- **Theme Config:** Define brand colors and fonts in the configuration file to match the desired "Liquidator" aesthetic.

### **2\. UI Components**

- **Grid Layout:** Apply responsive grid classes to the product list (e.g., 1 column on mobile, 3 on tablet, 4 on desktop).
- **Typography:** Style headings, prices, and descriptions for readability.
- **Interactive Elements:** Add hover states and focus rings to buttons and inputs for better accessibility.

## **Phase 7: Deployment & Maintenance**

_Goal: Launch the site to the public._

### **1\. Pre-Deployment Check**

- **Build Verification:** Run a local build command to ensure there are no TypeScript errors or missing dependencies.
- **Environment Secrets:** Verify that all production API keys are ready to be added to the hosting platform.

### **2\. Vercel Deployment**

- **Git Push:** Commit and push the final code to the repository.
- **Import Project:** Connect the repository to Vercel.
- **Add Variables:** Input the environment variables (Supabase keys, Stripe keys) into the Vercel dashboard.
- **Deploy:** Trigger the build and verify the live URL.
