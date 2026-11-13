import { createMessageSender } from "@hub/shared/messaging";
import "@hub/shared/ui/styles.css";
import { templateMessages } from "../../lib/messages";

const status = document.querySelector<HTMLParagraphElement>("#status");
const sendMessage = createMessageSender(templateMessages);

document.querySelector<HTMLButtonElement>("#ping")?.addEventListener("click", async () => {
  if (!status) {
    return;
  }

  status.textContent = "Pinging...";
  const response = await sendMessage({
    type: "TEMPLATE_PING",
  });
  status.textContent = response.ok
    ? `Pong at ${new Date(response.data.timestamp).toISOString()}`
    : response.error.message;
});
