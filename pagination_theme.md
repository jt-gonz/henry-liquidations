# **Implementation Plan: Pagination & Theme**

## **Part 1: Cursor-Based Pagination (The Algorithm)**

**Goal:** Implement a "Load More" system that scales infinitely without slowing down the database, using the product's creation timestamp as the "cursor" (the bookmark).

### **1\. Database Query Strategy (Supabase)**

* **Index Creation:**  
  * Task: Create a database index on the created\_at column in the products table. This ensures the database can find the "bookmark" instantly without scanning the whole table.  
* **Sorting Logic:**  
  * Task: Always sort results by created\_at in **Descending** order (Newest first).

### **2\. API Endpoint Logic (/api/products)**

* **Input Parameters:**  
  * Task: Configure the API to accept a cursor parameter (a timestamp string) and a limit parameter (default to 12).  
* **Query Logic:**  
  * **First Load:** If no cursor is provided, fetch the newest 12 items.  
  * **Subsequent Loads:** If a cursor *is* provided, fetch 12 items where created\_at is **less than** the cursor timestamp.  
  * *Logic:* SELECT \* FROM products WHERE created\_at \< $cursor ORDER BY created\_at DESC LIMIT 12

### **3\. Frontend Integration (\+page.svelte)**

* **State Management:**  
  * Task: Create a reactive variable products to hold the currently displayed list.  
  * Task: Create a reactive variable nextCursor to store the created\_at date of the *last* item in the current list.  
* **Intersection Observer (The Trigger):**  
  * Task: Attach an element (a transparent div or "Loading..." spinner) to the bottom of the list.  
  * Task: When this element enters the viewport, trigger the fetchNextPage() function using the value in nextCursor.  
* **Append Logic:**  
  * Task: When data returns, add the new items to the end of the products array (products \= \[...products, ...newItems\]).  
  * Task: Update nextCursor to the timestamp of the new last item.

## **Part 2: Theme Implementation**

**Goal:** Apply the provided earthy color palette to create a clean, sophisticated furniture store look. The background remains white (\#ffffff) to keep the focus on the product photography.

### **1\. Color Palette Mapping**

We will assign semantic names to your hex codes to make development easier.

* **Primary Dark (\#373d20):** *Deep Olive*  
  * **Usage:** Main Headings (H1, H2), Navigation Text, Primary "Buy Now" Buttons, Footer Background.  
  * *Why:* High contrast against white; reads as "black" but softer and richer.  
* **Primary Medium (\#717744):** *Muted Olive*  
  * **Usage:** Hover states for buttons, Active navigation links, Icons (Cart, Search), Subheadings.  
  * *Why:* Provides a clear interactive state without being too bright.  
* **Accent / Earth (\#766153):** *Warm Brown*  
  * **Usage:** **Prices**, "Sale" Badges, "Add to Cart" text links, Call-to-Action borders.  
  * *Why:* Brown is associated with wood/leather (furniture). Using it for the Price makes the cost feel natural rather than alarming (like red).  
* **Surface / Secondary (\#eff1ed):** *Off-White / Mist*  
  * **Usage:** Product Card Backgrounds, Form Input Backgrounds, Secondary Buttons (e.g., "Filter").  
  * *Why:* A very subtle grey/green that separates content from the stark white page background without boxing it in.  
* **Border / Divider (\#bcbd8b):** *Sage Beige*  
  * **Usage:** Thin borders between sections, input field borders, lines separating cart items.  
  * *Why:* Strong enough to create structure, but soft enough to not look like a grid.

### **2\. Tailwind Configuration Tasks**

* **Extend Theme:**  
  * Task: Open tailwind.config.js.  
* Task: Under theme.extend.colors, add a custom object:  
  colors: {  
*   brand: {  
*     dark: '\#373d20',  // Text, Main Buttons  
*     mid: '\#717744',   // Hovers, Icons  
*     brown: '\#766153', // Prices, Accents  
*     light: '\#bcbd8b', // Borders  
*     bg: '\#eff1ed',    // Cards, Inputs  
*   }  
* }  
  * 

### **3\. UI Application Guidelines**

* **Navigation Bar:**  
  * Background: White (bg-white).  
  * Text: Deep Olive (text-brand-dark).  
  * Border Bottom: Sage Beige (border-brand-light).  
* **Product Card:**  
  * Background: Mist (bg-brand-bg).  
  * Image: Rounded corners, no border.  
  * Title: Deep Olive (text-brand-dark), font-weight bold.  
  * Price: Warm Brown (text-brand-brown), font-weight medium.  
* **Buttons:**  
  * **Primary (Checkout):** Deep Olive background (bg-brand-dark), White text. Hover changes to Muted Olive (hover:bg-brand-mid).  
  * **Secondary (View Details):** Transparent background, Deep Olive border (border-brand-dark), Deep Olive text.  
* **Footer:**  
  * Background: Deep Olive (bg-brand-dark).  
  * Text: Mist (text-brand-bg).