import { defineMessageContract } from "@hub/shared/messaging";

export const templateMessages = defineMessageContract({
  TEMPLATE_PING: {
    payload: undefined,
    response: {} as {
      pong: boolean;
      timestamp: number;
    },
  },
});
