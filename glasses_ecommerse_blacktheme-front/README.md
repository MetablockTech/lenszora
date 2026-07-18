# LensZora - Premium Eyewear Platform

LensZora is a high-end eyewear platform featuring a curated collection of sunglasses, eyeglasses, and accessories.

## Features

- **Premium Design**: Sleek black-and-gold theme with a modern, responsive interface.
- **Dynamic Branding**: Easily update website name, logo, and contact info from the admin panel.
- **Wishlist System**: Persistent wishlist for users to save their favorite products.
- **Rating & Reviews**: Comprehensive feedback system for verified purchases.
- **Admin Dashboard**: Powerful administrative tools for managing products, orders, and site settings.
- **Maintenance Mode**: Toggleable maintenance page for site updates.

## Technology Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, MongoDB (Atlas)
- **Payment**: Razorpay Integration
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js & npm installed

### Installation

1. Clone the repository:
   ```sh
   git clone <YOUR_GIT_URL>
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the `server` directory with your MongoDB URI and other secrets.

4. Start the development server:
   ```sh
   # Frontend
   npm run dev

   # Backend (in server directory)
   npm run dev
   ```

## Deployment

The project is ready for deployment on platforms like Vercel, Netlify, or your own VPS. Ensure all environment variables are correctly configured in your deployment settings.
