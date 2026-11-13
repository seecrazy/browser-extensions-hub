import { createMessageSender } from "@hub/shared/messaging";
import { createStatusView } from "@hub/shared/ui";
import "@hub/shared/ui/styles.css";
import { templateMessages } from "../../lib/messages";

const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));
const sendMessage = createMessageSender(templateMessages);

document.querySelector<HTMLButtonElement>("#ping")?.addEventListener("click", async () => {
  statusView.set("Pinging...");
  const response = await sendMessage({
    type: "TEMPLATE_PING",
  });

  statusView.set(
    response.ok
      ? `Pong at ${new Date(response.data.timestamp).toISOString()}`
      : response.error.message,
  );
});
