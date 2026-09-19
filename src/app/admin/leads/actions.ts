"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { leadNoteSchema } from "@/lib/validation";
import { notify } from "@/lib/notifications";
import type { ActionResult } from "@/types";
import type { LeadStatus } from "@prisma/client";

export async function updateLeadStatusAction(
  id: string,
  status: LeadStatus,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "leads.write")) {
    return { ok: false, message: "You do not have permission to manage leads." };
  }

  await prisma.lead.update({ where: { id }, data: { status } });
  await prisma.leadNote.create({
    data: {
      leadId: id,
      authorId: user.id,
      body: `Status changed to ${status.toLowerCase()}.`,
    },
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);

  const lead = await prisma.lead.findUnique({ where: { id }, select: { name: true } });
  await notify({
    kind: "LEAD",
    level: status === "WON" ? "SUCCESS" : status === "LOST" ? "WARNING" : "INFO",
    title: `Lead moved to ${status.toLowerCase()} — ${lead?.name ?? ""}`,
    href: `/admin/leads/${id}`,
    entityType: "lead",
    entityId: id,
  });

  return { ok: true, message: `Marked as ${status.toLowerCase()}.` };
}

export async function assignLeadAction(
  id: string,
  assignedToId: string | null,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "leads.write")) {
    return { ok: false, message: "You do not have permission to manage leads." };
  }

  const assignee = assignedToId
    ? await prisma.adminUser.findUnique({ where: { id: assignedToId }, select: { name: true } })
    : null;

  await prisma.lead.update({
    where: { id },
    data: { assignedToId: assignedToId || null },
  });
  await prisma.leadNote.create({
    data: {
      leadId: id,
      authorId: user.id,
      body: assignee ? `Assigned to ${assignee.name}.` : "Assignment cleared.",
    },
  });

  revalidatePath(`/admin/leads/${id}`);
  return { ok: true, message: assignee ? `Assigned to ${assignee.name}.` : "Assignment cleared." };
}

export async function addLeadNoteAction(
  leadId: string,
  body: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "leads.write")) {
    return { ok: false, message: "You do not have permission to manage leads." };
  }

  const parsed = leadNoteSchema.safeParse({ leadId, body });
  if (!parsed.success) return { ok: false, message: "Write a note before saving." };

  await prisma.leadNote.create({
    data: { leadId, authorId: user.id, body: parsed.data.body },
  });

  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true, message: "Note added." };
}

export async function deleteLeadAction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "leads.delete")) {
    return { ok: false, message: "Only super admins can delete leads." };
  }

  await prisma.lead.delete({ where: { id } });
  revalidatePath("/admin/leads");
  return { ok: true, message: "Lead deleted." };
}

export async function updateApplicationStatusAction(
  id: string,
  status: "NEW" | "REVIEWING" | "SHORTLISTED" | "REJECTED" | "HIRED",
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "leads.write")) {
    return { ok: false, message: "You do not have permission to manage applications." };
  }

  await prisma.jobApplication.update({ where: { id }, data: { status } });
  revalidatePath("/admin/applications");
  return { ok: true, message: `Marked as ${status.toLowerCase()}.` };
}
