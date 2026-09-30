EcomApp
A full-stack e-commerce web application built with Next.js App Router, React, TypeScript, Tailwind CSS, and MongoDB.
The application provides a complete commerce flow including product discovery, search, categories, product details, authentication, shopping cart, wishlist, checkout, customer accounts, order tracking, and an admin product-management area.
? Overview
EcomApp is designed as a modern single-application commerce platform where the frontend, backend API routes, authentication, business logic, and MongoDB integration live inside the same Next.js project.
The application uses the Next.js App Router and server-side API route handlers while client-side components handle interactive commerce experiences such as the cart, wishlist, search, authentication forms, and checkout.
The storefront is branded as Maison&Market within the application's UI.
?? Features
Storefront
* Modern responsive e-commerce homepage
* Product catalog
* Product categories
* Featured products
* New-arrival products
* Best-seller filtering
* Product search
* Product detail pages
* Price filtering
* Rating filtering
* Stock-availability filtering
* Product variants
* Responsive mobile navigation
* Responsive product grids
* Loading skeletons
Shopping
* Add products to cart
* Update cart quantities
* Remove cart items
* Cart drawer
* Full cart page
* Product variants
* Subtotal calculation
* Discounts/coupons
* Shipping calculation
* Tax calculation
* Final order total
Wishlist
* Add/remove wishlist products
* Wishlist page
* Guest wishlist support through browser storage
* Wishlist synchronization after authentication
Authentication
* Customer registration
* Customer login
* Session-based authentication
* Logout
* Current-user endpoint
* Customer/admin roles
* Account profile management
* Password change functionality
* Protected customer functionality
* Protected admin functionality
Passwords are hashed using Node.js cryptographic primitives, while application sessions are encoded and signed using HMAC-SHA256.
Customer Account
Customers can access:
* Account information
* Profile details
* Email
* Password management
* Shopping cart
* Wishlist
* Order history
* Individual order details
Orders
The database model supports:
* Order numbers
* Customer information
* Order items
* Product/variant information
* Quantity
* Unit prices
* Subtotals
* Discounts
* Shipping
* Tax
* Total amount
* Shipping address
* Billing address
* Payment method
* Payment status
* Fulfillment status
* Order timeline
* Estimated delivery information
Supported fulfillment statuses include:
pending ? confirmed ? processing ? shipped ? delivered
with additional cancelled and refunded states.
The current data model supports cod and card payment methods and includes an optional Stripe session reference for payment integration.
Admin
The application includes an admin dashboard and admin-protected product management APIs.
Administrators can create products and manage product information such as:
* Name
* Slug
* Description
* Short description
* Price
* Compare-at price
* Cost
* SKU
* Images
* Category
* Tags
* Variants
* Inventory
* Featured status
* Active status
The product creation API requires an authenticated administrator.

?? Technology Stack
TechnologyPurposeNext.js 16Full-stack React frameworkReact 19UITypeScriptType-safe application developmentMongoDBDatabaseMongoDB Node.js DriverDatabase accessTailwind CSS 4StylingFramer MotionUI animationESLintCode qualityTSXTypeScript script executionThe repository currently uses the native mongodb package rather than Mongoose.

?? Project Structure
ecomapp/
?
??? app/
?   ??? account/
?   ?   ??? orders/
?   ?   ??? wishlist/
?   ?
?   ??? admin/
?   ?
?   ??? api/
?   ?   ??? auth/
?   ?   ??? cart/
?   ?   ??? categories/
?   ?   ??? orders/
?   ?   ??? products/
?   ?   ??? profile/
?   ?   ??? search/
?   ?   ??? wishlist/
?   ?
?   ??? cart/
?   ??? checkout/
?   ??? login/
?   ??? product/
?   ?   ??? [slug]/
?   ??? register/
?   ??? shop/
?   ??? globals.css
?   ??? layout.tsx
?   ??? page.tsx
?
??? components/
?   ??? admin/
?   ??? auth/
?   ??? cart/
?   ??? checkout/
?   ??? product/
?   ??? shop/
?   ??? api.ts
?   ??? cart-drawer.tsx
?   ??? footer.tsx
?   ??? header.tsx
?   ??? home-client.tsx
?   ??? product-grid.tsx
?   ??? skeletons.tsx
?   ??? store-provider.tsx
?   ??? toaster.tsx
?
??? lib/
?   ??? auth.ts
?   ??? db.ts
?   ??? http.ts
?   ??? mongodb.ts
?   ??? security.ts
?   ??? seed.ts
?   ??? serialize.ts
?
??? public/
?   ??? static assets
?
??? scripts/
?   ??? seed.ts
?
??? AGENTS.md
??? CLAUDE.md
??? eslint.config.mjs
??? next.config.ts
??? package.json
??? package-lock.json
??? postcss.config.mjs
??? tsconfig.json
??? README.md
The root application uses the @/* TypeScript alias to reference project files from the repository root.

??? Application Architecture
The application follows a Next.js full-stack architecture.
Browser
   ?
   ?
Next.js App Router
   ?
   ??? Server Pages
   ?
   ??? Client Components
   ?
   ??? API Route Handlers
            ?
            ?
       Business Logic
            ?
            ?
        MongoDB Driver
            ?
            ?
         MongoDB
The root layout initializes the shared application environment and renders:
* Store provider
* Header
* Main application content
* Footer
* Cart drawer
* Toast notifications

??? Database
MongoDB is accessed using the official MongoDB Node.js driver.
The application uses a shared MongoDB client promise to avoid repeatedly creating database connections. The database name defaults to ecomapp and can be overridden with MONGODB_DB.
Main Collections
The application works with commerce-oriented MongoDB collections including:
categories
products
users
carts
wishlists
addresses
orders
coupons
reviews
Product Model
Products contain information such as:
name
slug
description
shortDescription
price
compareAt
cost
sku
images
categoryId
tags
variants
inventory
featured
active
ratingAverage
reviewCount
seo
createdAt
updatedAt
Product variants can contain:
id
label
options
sku
price
compareAt
inventory
images
active

?? Authentication & Security
Authentication is implemented inside the Next.js application rather than through a separate backend server.
Password handling uses:
* Random salts
* scrypt
* Constant-time password comparison
* HMAC-SHA256 signed sessions
* Session expiration support
The application distinguishes between:
customer
admin
Protected API operations verify the current session before performing privileged operations.
For example, product creation requires an administrator session.

?? API
The frontend communicates with the application's API through a small shared apiFetch() helper.
The helper:
* Sends JSON requests
* Parses JSON responses
* Normalizes API errors
* Returns typed success/error results
* Disables request caching for API calls
Product API
Get products
GET /api/products
Supported query parameters include:
q
category
tag
featured
minRating
sort
page
limit
min
max
availability
Example:
GET /api/products?q=chair&sort=priceAsc
The API supports pagination and returns:
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 12,
  "pages": 1
}
Create product
POST /api/products
This endpoint requires administrator authentication.

?? Cart API
The application uses the cart API for:
GET    /api/cart
POST   /api/cart
PATCH  /api/cart
DELETE /api/cart
The shared store provider uses these endpoints to add products, update quantities, and remove products.

?? Wishlist
Wishlist operations are handled through:
GET    /api/wishlist
POST   /api/wishlist
DELETE /api/wishlist
Guest wishlist items can be temporarily stored in browser localStorage and synchronized with the user's account after login.

?? Account
The customer account area provides:
/account
/account/orders
/account/orders/[id]
/account/wishlist
The account page supports profile updates and password changes through:
PATCH /api/profile

??? Main Routes
RoutePurpose/Storefront homepage/shopProduct catalog/product/[slug]Product details/cartShopping cart/checkoutCheckout/loginCustomer login/registerCustomer registration/accountCustomer account/account/ordersOrder history/account/orders/[id]Order details/account/wishlistWishlist/adminAdmin dashboard
?? UI & Design
The application uses Tailwind CSS together with a custom design system defined in app/globals.css.
The interface uses:
* Responsive layouts
* Rounded panels
* Product image grids
* Sticky navigation
* Cart drawer
* Mobile navigation drawer
* Skeleton loading states
* Toast notifications
* Responsive forms
* Editorial-style typography
* Product-focused layouts
The visual system uses a warm neutral background with dark typography and a green accent color.
The storefront header provides:
* Shop navigation
* New arrivals
* Best sellers
* Product search
* Account
* Wishlist
* Cart

?? Requirements
Before running the application, install:
* Node.js
* npm
* MongoDB
MongoDB can be:
* A local MongoDB instance
* MongoDB Atlas
* Another MongoDB-compatible deployment

?? Getting Started
1. Clone the repository
git clone https://github.com/AliBhalli/ecomapp.git
cd ecomapp
2. Install dependencies
npm install
3. Configure environment variables
Create:
.env.local
At minimum, configure:
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=ecomapp
NEXT_PUBLIC_APP_URL=http://localhost:3000
For MongoDB Atlas, replace MONGODB_URI with your Atlas connection string.
4. Start development
npm run dev
Open:
http://localhost:3000

?? Available Scripts
npm run dev
Starts the Next.js development server.
npm run build
Creates a production build.
npm run start
Starts the production server.
npm run lint
Runs ESLint.
The repository also contains database-seeding commands, but the current seed script references a lib/dbConnect module that is not present at that path in the inspected repository. This should be corrected before treating the seed command as a verified setup step.

?? Database Seeding
The project contains a seed implementation in:
lib/seed.ts
The seed data creates initial categories and products and is designed to be deterministic/idempotent.
The current seed implementation includes categories such as:
Home
Wear
Accessories
Travel
and sample products such as:
Arc Lounge Chair
No. 7 Table Lamp
Field Carryall
Index Steel Watch
The seed implementation uses natural keys such as category slugs, product SKUs, and user information to avoid unnecessarily creating duplicates.

?? Current Repository Notes
Before deploying this project, review the following items.
1. Seed connector mismatch
scripts/seed.ts imports:
import clientPromise from "../lib/dbConnect";
but the inspected repository does not contain:
lib/dbConnect.ts
The application itself uses:
lib/mongodb.ts
as its MongoDB connection implementation.
2. Dependency verification
Several UI components import lucide-react, while the currently visible package.json does not list lucide-react as a dependency.
This should be resolved before relying on a clean npm install / production build.
3. Existing README mismatch
The previous README describes MongoDB with Mongoose, but the implementation inspected in lib/db.ts and lib/mongodb.ts uses the native MongoDB driver.
4. Package scripts
The current package.json contains duplicated scripts declarations. This should be cleaned up so the project has one authoritative scripts object.

?? Deployment
The application can be deployed as a Next.js application on platforms such as Vercel.
Configure the required environment variables in the deployment environment:
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=ecomapp
NEXT_PUBLIC_APP_URL=https://your-domain.com
Then build the application:
npm run build
and run:
npm start

?? Development Workflow
A typical development workflow is:
1. Start MongoDB
       ?
2. Configure .env.local
       ?
3. npm install
       ?
4. npm run dev
       ?
5. Open localhost:3000
       ?
6. Test storefront
       ?
7. Test authentication
       ?
8. Test cart/wishlist
       ?
9. Test checkout/orders
       ?
10. Test admin functionality
       ?
11. npm run build

?? Project Status
EcomApp contains the foundations of a complete full-stack commerce platform:
* Next.js App Router
* MongoDB persistence
* Customer authentication
* Admin authorization
* Product catalog
* Categories
* Search
* Filtering
* Product variants
* Cart
* Wishlist
* Checkout
* Orders
* Customer accounts
* Admin dashboard
* Responsive storefront
The repository should be treated as an actively developed application and the configuration/dependency issues noted above should be resolved before describing the project as production-ready.

?? License
No license file is currently listed in the repository root.
If this project is intended to be distributed publicly, add an appropriate LICENSE file.

Repository
GitHub:
https://github.com/AliBhalli/ecomapp

