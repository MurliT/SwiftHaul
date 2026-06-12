# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



SwiftHaul Business Owner Portal
Overview

SwiftHaul is a B2B SaaS platform that helps kirana stores, pharmacies, home bakers, and local e-commerce sellers manage same-day deliveries through a single dashboard. Instead of coordinating multiple drivers through calls and WhatsApp groups, businesses can book, track, and manage deliveries from one platform.

Key Features
Authentication & Role-Based Access Control (RBAC)
SMS OTP login using business phone numbers
Role-based access:
Owner
Manager
Dispatcher
Secure access control for different operational responsibilities
Delivery Management
Instant driver matching
Same-day delivery booking
Real-time driver tracking
Driver assignment monitoring
Order status updates
Communication
WhatsApp tracking links
SMS fallback notifications
Customer delivery updates
Automated status alerts
Billing & Compliance
Automated GST invoice generation
Monthly invoice summaries
UPI payment support
Cash-on-Delivery support
Progressive Web App (PWA)
Mobile-first experience
Installable web application
Service worker support
Offline-friendly architecture
Optimized for low-cost Android devices
Technology Stack
Frontend
React 19
React DOM 19
React Router DOM 7
Vite 8
Tailwind CSS 4
Networking
Axios for API communication
Documents
jsPDF for invoice generation and PDF exports
UI & Icons
Lucide React Icons
Development Tools
ESLint
PostCSS
Autoprefixer

Project Structure
SwiftHaul/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── routes/
│   ├── hooks/
│   └── assets/
│
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── favicon.svg
│
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
