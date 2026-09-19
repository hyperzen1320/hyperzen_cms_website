import "server-only";

import { cache } from "react";
import { getCurrentUser } from "@/lib/auth";

/**
 * Draft preview.
 *
 * Adding `?preview=1` to any public URL renders unpublished content — but only
 * for a signed-in CMS user. For everyone else the flag is ignored entirely, so
 * a preview link cannot leak drafts.
 */
export const isPreview = cache(async (flag?: string | string[]): Promise<boolean> => {
  const value = Array.isArray(flag) ? flag[0] : flag;
  if (value !== "1" && value !== "true") return false;
  const user = await getCurrentUser();
  return Boolean(user);
});

