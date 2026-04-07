import { defineConfig } from "astro/config";
import { generateAPIReferenceItems, stainlessDocs } from "@stainless-api/docs";
import aiChat from "@stainless-api/docs-ai-chat/plugin";

// https://astro.build/config
export default defineConfig({
  integrations: [
    stainlessDocs({
      apiReference: {
        stainlessProject: "chamelaion",
        propertySettings: {
          collapseDescription: false,
          expandDepth: 2,
        },
      },
      title: "Chamelaion",
      logo: {
        dark: "./src/assets/logo-dark.svg",
        light: "./src/assets/logo-light.svg",
        alt: "Chamelaion",
      },
      customCss: ["./theme.css"],
      header: {
        layout: "stacked",
        links: [
          {
            label: "Dashboard",
            link: "https://app.chamelaion.com",
          },
          {
            label: "Get API Key",
            link: "https://app.chamelaion.com/settings/api-keys",
          },
        ],
      },
      experimental: {
        aiChat: aiChat(),
      },
      tabs: [
        {
          label: "Guides",
          link: "/",
          sidebar: [
            {
              label: "Getting Started",
              items: [
                "",
                "guides/quickstart",
                "guides/authentication",
              ],
            },
            {
              label: "Core Guides",
              items: [
                "guides/generate-lipsync",
                "guides/polling-status",
                "guides/error-handling",
              ],
            },
          ],
        },
        {
          label: "API Reference",
          link: "/api",
          sidebar: generateAPIReferenceItems({
            excludeResourceOverviewPages: true,
          }),
        },
      ],
    }),
  ],
});
