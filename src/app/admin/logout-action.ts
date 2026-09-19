"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth";

/** Ends the CMS session and returns to the shared sign-in portal. */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
