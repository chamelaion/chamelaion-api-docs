import { defineConfig } from "astro/config";
import {
  generateAPIReferenceItems,
  stainlessDocs,
  type ReferenceSidebarConfigItem,
} from "@stainless-api/docs";
import aiChat from "@stainless-api/docs-ai-chat/plugin";

const LIPSYNC_METHOD_ORDER = ["Generate", "Generate With Media", "Retrieve", "List"];

function dedupeMethodEntries(entries: ReferenceSidebarConfigItem[]): ReferenceSidebarConfigItem[] {
  const seen = new Set<string>();
  const result: ReferenceSidebarConfigItem[] = [];

  for (const entry of entries) {
    if (entry.kind === "method_page") {
      const key = `${entry.metadata.httpMethod}:${entry.label.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(entry);
      continue;
    }

    if (entry.kind === "group") {
      result.push({
        ...entry,
        entries: dedupeMethodEntries(entry.entries),
      });
      continue;
    }

    result.push(entry);
  }

  return result;
}

function reorderLipsyncGroup(entries: ReferenceSidebarConfigItem[]): ReferenceSidebarConfigItem[] {
  const methods = entries.filter((entry) => entry.kind === "method_page");
  const others = entries.filter((entry) => entry.kind !== "method_page");

  methods.sort((a, b) => {
    const aIdx = LIPSYNC_METHOD_ORDER.indexOf(a.label);
    const bIdx = LIPSYNC_METHOD_ORDER.indexOf(b.label);

    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.label.localeCompare(b.label);
  });

  return [...others, ...methods];
}

function normalizeApiReferenceSidebar(
  sidebar: ReferenceSidebarConfigItem[],
): ReferenceSidebarConfigItem[] {
  const normalized = sidebar.map((entry) => {
    if (entry.kind !== "group") return entry;
    return {
      ...entry,
      entries: [...entry.entries],
    };
  });

  const findGroupIndex = (label: string) =>
    normalized.findIndex(
      (entry) => entry.kind === "group" && entry.label.toLowerCase() === label.toLowerCase(),
    );

  const lipsyncIdx = findGroupIndex("Lipsync");
  const requestsIdx = findGroupIndex("Requests");

  if (lipsyncIdx !== -1 && requestsIdx !== -1) {
    const lipsync = normalized[lipsyncIdx];
    const requests = normalized[requestsIdx];

    if (lipsync.kind === "group" && requests.kind === "group") {
      const requestMethods = requests.entries.filter((entry) => entry.kind === "method_page");
      lipsync.entries = reorderLipsyncGroup(
        dedupeMethodEntries([...lipsync.entries, ...requestMethods]),
      );
      normalized.splice(requestsIdx, 1);
    }
  }

  const usersIdx = findGroupIndex("Users");
  if (usersIdx !== -1) {
    const users = normalized[usersIdx];
    if (users.kind === "group") {
      const hasMe = users.entries.some(
        (entry) => entry.kind === "method_page" && entry.label === "Me",
      );

      if (hasMe) {
        users.entries = users.entries.filter(
          (entry) =>
            !(entry.kind === "method_page" && entry.label.toLowerCase() === "retrieve current"),
        );
      }

      users.entries = dedupeMethodEntries(users.entries);
    }
  }

  return dedupeMethodEntries(normalized);
}

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
          sidebar: generateAPIReferenceItems(
            {
              excludeResourceOverviewPages: true,
            },
            (sidebar) => normalizeApiReferenceSidebar(sidebar),
          ),
        },
      ],
    }),
  ],
});
