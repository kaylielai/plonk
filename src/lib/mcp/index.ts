import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listFeed from "./tools/list-feed";
import createIdea from "./tools/create-idea";
import listGroups from "./tools/list-groups";
import listStamps from "./tools/list-stamps";

// OAuth issuer MUST be the direct Supabase host, not the .lovable.cloud proxy.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "plonk-mcp",
  title: "plonk",
  version: "0.1.0",
  instructions:
    "Tools for plonk, a hangout-planning app for close friends. Use these to list the signed-in user's feed, groups, and passport stamps, and to float new hangout ideas to a group or friend.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listFeed, createIdea, listGroups, listStamps],
});
