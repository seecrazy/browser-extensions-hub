import { onContractMessage } from "@hub/shared/messaging";
import { templateMessages } from "../lib/messages";

export default defineBackground(() => {
  onContractMessage(templateMessages, {
    TEMPLATE_PING: () => ({
      pong: true,
      timestamp: Date.now(),
    }),
  });
});
