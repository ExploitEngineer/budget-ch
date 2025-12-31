# BudgetHub

BudgetHub is a powerful, full-featured budgeting application designed to help users track expenses, manage budgets, savings goals, and recurring transactions, and generate insightful financial reports. It combines a clean, responsive UI with robust backend support and modern web technologies.

## Features

- **Budgets Management:** Create, edit, delete, and track monthly/weekly budgets.
- **Transactions:** Full CRUD support for transactions with categories, recurring transactions, and transfer functionality.
- **Savings Goals:** Create, edit, allocate, and delete savings goals with progress tracking.
- **Recurring Transactions:** Automatic recurring transaction generation with notifications.
- **Dashboard:** Dynamic charts, recent transactions, top categories, and budget progress sections.
- **Reports:** Detailed income, expense, balance, and savings rate reports with CSV export.
- **Multi-language Support:** English, German, French, and Italian translations.
- **Authentication & Security:** Email verification, Google Sign-In, password reset, two-factor authentication (2FA), and data privacy controls.
- **Subscriptions:** Stripe integration for subscription management and feature restrictions.
- **Import/Export:** Import users and export data in CSV and JSON formats.
- **Responsive UI:** Optimized for mobile, tablet, and desktop with ShadcnUI components.
- **Notifications:** Browser and email notifications for important actions and reminders.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, ShadcnUI, TailwindCSS
- **State Management:** Zustand, React Query
- **Backend:** Node.js, SST (Serverless Stack)
- **Database:** Drizzle-ORM
- **Authentication:** Better-Auth, Google OAuth, 2FA
- **Payments:** Stripe (Subscriptions & Webhooks)
- **Validation:** Zod
- **i18n:** next-intl for translations

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/ExploitEngineer/budget-ch.git
   cd budget-ch
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Configure environment variables (see `.env.example`).
4. Run development server:

   ```bash
   pnpm dev
   ```

5. Access the app at `http://localhost:3000`.

## Folder Structure

- `/app` - main Next.js app pages
- `/components` - reusable UI components
- `/store` - Zustand & React Query stores
- `/services` - backend service functions
- `/schemas` - Zod validation schemas
- `/public/assets` - images and logos

## Contributing

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes.
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature`
6. Open a Pull Request.

## License

MIT License
