import { sendMessage } from "@hub/shared/messaging";
import "@hub/shared/ui/styles.css";

const status = document.querySelector<HTMLParagraphElement>("#status");

document.querySelector<HTMLButtonElement>("#ping")?.addEventListener("click", async () => {
  if (!status) {
    return;
  }

  status.textContent = "Pinging...";
  const response = await sendMessage<"TEMPLATE_PING", { pong: boolean; timestamp: number }>({
    type: "TEMPLATE_PING",
  });
  status.textContent = response.ok
    ? `Pong at ${new Date(response.data.timestamp).toISOString()}`
    : response.error.message;
});
