/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "budget-ch-app",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "eu-central-1",
        },
      },
    };
  },
  async run() {
    const web = new sst.aws.Nextjs("MyWeb");

    // Subscription Expiry Check (Daily at 9 AM UTC)
    new sst.aws.Cron("SubscriptionNotifications", {
      schedule: "cron(0 9 * * ? *)",
      function: {
        handler: "src/functions/scheduled-notifications.handler",
        nodejs: {
          install: ["pg", "nodemailer"],
          esbuild: {
            external: ["pg", "nodemailer"],
          },
        },
        environment: {
          DATABASE_URL: process.env.DATABASE_URL!,
          SMTP_HOST: process.env.SMTP_HOST!,
          MAIL_USER: process.env.MAIL_USER!,
          MAIL_PASS: process.env.MAIL_PASS!,
        },
      } as any,
    });

    // Budget Alerts (Every 1 hour)
    new sst.aws.Cron("BudgetAlerts", {
      schedule: "rate(1 hour)",
      function: {
        handler: "src/functions/budget-alerts.handler",
        nodejs: {
          install: ["pg", "nodemailer"],
          esbuild: {
            external: ["pg", "nodemailer"],
          },
        },
        environment: {
          DATABASE_URL: process.env.DATABASE_URL!,
          SMTP_HOST: process.env.SMTP_HOST!,
          MAIL_USER: process.env.MAIL_USER!,
          MAIL_PASS: process.env.MAIL_PASS!,
        },
      } as any,
    });

    // Budget Monthly Rollover (1st of each month at 00:05 UTC)
    new sst.aws.Cron("BudgetMonthlyRollover", {
      schedule: "cron(5 0 1 * ? *)",
      function: {
        handler: "src/functions/budget-rollover.handler",
        nodejs: {
          install: ["pg"],
          esbuild: {
            external: ["pg"],
          },
        },
        environment: {
          DATABASE_URL: process.env.DATABASE_URL!,
        },
      } as any,
    });

    // Savings Goal Auto-Allocation (1st of each month at 01:00 UTC)
    // Runs after rollover to ensure budget is settled first
    new sst.aws.Cron("SavingsGoalAutoAllocation", {
      schedule: "cron(0 1 1 * ? *)",
      function: {
        handler: "src/functions/savings-goal-allocation.handler",
        nodejs: {
          install: ["pg"],
          esbuild: {
            external: ["pg"],
          },
        },
        environment: {
          DATABASE_URL: process.env.DATABASE_URL!,
        },
      } as any,
    });

    // Recurring Transaction Generation (Daily at 02:00 UTC)
    // Runs daily to generate transactions from active recurring templates
    new sst.aws.Cron("RecurringTransactionGeneration", {
      schedule: "cron(0 2 * * ? *)",
      function: {
        handler: "src/functions/recurring-transactions-generator.handler",
        nodejs: {
          install: ["pg"],
          esbuild: {
            external: ["pg"],
          },
        },
        environment: {
          DATABASE_URL: process.env.DATABASE_URL!,
        },
      } as any,
    });

    return {
      web,
    };
  },
});
