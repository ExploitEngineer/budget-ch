// Runs the Stripe CLI in listen mode and forwards requests to the local server
import "dotenv/config";
import { spawn } from "node:child_process";

const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
    console.error("Missing STRIPE_SECRET_KEY. Add it to .env before running this script.");
    process.exit(1);
}

const child = spawn(
    "stripe",
    ["listen", "--api-key", key, "--forward-to", "http://localhost:3000/api/webhooks/stripe"],
    { stdio: "inherit" }
);

child.on("error", (error) => {
    console.error("Failed to start Stripe CLI:", error);
    process.exit(1);
});

child.on("exit", (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal);
    } else {
        process.exit(code ?? 0);
    }
});

