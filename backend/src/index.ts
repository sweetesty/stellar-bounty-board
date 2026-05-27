import "dotenv/config";
import { app } from "./app";
import { logStructured } from "./logger";
import { validateGitHubWebhookSecret } from "./validation/webhookSecretValidation";

// Validate critical environment variables before starting the server
validateGitHubWebhookSecret();

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  logStructured("info", "server_listen", { port });
});
