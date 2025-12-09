/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "budget-ch-app",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const web = new sst.aws.Nextjs("MyWeb");

    // Scheduled notifications Lambda function (runs daily at 9 AM UTC)
    new sst.aws.Cron("ScheduledNotifications", {
      schedule: "cron(0 9 * * ? *)", // Daily at 9 AM UTC
      function: {
        handler: "src/functions/scheduled-notifications.handler",
        environment: {
          DATABASE_URL: process.env.DATABASE_URL!,
          SMTP_HOST: process.env.SMTP_HOST!,
          MAIL_USER: process.env.MAIL_USER!,
          MAIL_PASS: process.env.MAIL_PASS!,
        },
      } as any, // Type assertion needed due to SST v3 type definitions
    });

    return {
      web,
    };
  },
});
