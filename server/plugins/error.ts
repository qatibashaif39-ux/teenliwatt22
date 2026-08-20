import { defineNitroPlugin } from "nitropack/runtime";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("error", async (error, { event }) => {
    console.error(
      "[Nitro Hook Error]:",
      error,
      "for URL:",
      event?.node?.req?.url || event?.req?.url,
    );
  });
});
