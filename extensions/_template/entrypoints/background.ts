import { onRuntimeMessage } from "@hub/shared/messaging";

export default defineBackground(() => {
  onRuntimeMessage({
    TEMPLATE_PING: () => {
      return {
        pong: true,
        timestamp: Date.now(),
      };
    },
  });
});
