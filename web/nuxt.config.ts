const isPlaywrightTest = process.env.IS_PLAYWRIGHT === "1";
const isApiLocal = process.env.API_LOCAL === "1";
const siteDomain = "markometcalfe.com";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: [
    "./modules/countries",
    "./modules/doodle",
    "./modules/minecraft",
    "./modules/network-status",
    "./modules/play",
    "./modules/pulsar",
    "./modules/resume",
    "./modules/sequencer",
    "./modules/visuals",
  ],
  modules: [
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/test-utils",
    "@pinia/nuxt",
  ],
  devtools: { enabled: !isPlaywrightTest },
  runtimeConfig: {
    public: {
      isPlaywrightTest,
    },
  },
  app: {
    head: {
      title: "Marko Metcalfe",
      htmlAttrs: {
        lang: "en",
      },
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.svg" },
      ],
    },
  },
  appConfig: {
    siteDomain: "markometcalfe.com",
    mailtoLink: "mailto:marko@markometcalfe.com",
  },
  compatibilityDate: "2025-05-28",
  icon: {
    clientBundle: {
      scan: true,
      includeCustomCollections: true,
    },
    customCollections: [
      {
        prefix: "custom",
        dir: "./assets/icons",
      },
    ],
  },
  pinia: {
    storesDirs: ["stores"],
  },
  nitro: {
    // If updating here, also update api/dev.sh and playwright.docker-compose.yml
    devProxy: isApiLocal
      ? {
          "/api/countries": {
            target: "http://localhost:8787/api/countries",
            changeOrigin: true,
          },
          "/api/doodle": {
            target: "http://localhost:8788/api/doodle",
            changeOrigin: true,
          },
          "/api/network-status": {
            target: "http://localhost:8789/api/network-status",
            changeOrigin: true,
          },
          "/api/play": {
            target: "http://localhost:8791/api/play",
            changeOrigin: true,
          },
          "/resume.pdf": {
            target: "http://localhost:8790/resume.pdf",
            changeOrigin: true,
          },
        }
      : {
          "/api": {
            target: `https://${siteDomain}/api`,
            changeOrigin: true,
            prependPath: true,
          },
        },
  },
});
