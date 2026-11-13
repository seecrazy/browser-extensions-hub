export default defineBackground(() => {
  // The New Tab Dashboard has no persistent background work. This worker exists
  // so automation can resolve the extension origin without hardcoding an ID.
});
