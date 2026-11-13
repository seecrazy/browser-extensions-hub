export default defineBackground(() => {
  // Capture is performed in the popup. This worker only makes the extension
  // discoverable by automation and provides a stable extension lifecycle.
});
