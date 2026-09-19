"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { updateApplicationStatusAction } from "@/app/admin/leads/actions";
import { formatDate } from "@/lib/utils";
import type { ApplicationStatus } from "@prisma/client";

type Application = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  linkedin: string | null;
  portfolio: string | null;
  message: string | null;
  status: ApplicationStatus;
  jobTitle: string;
  createdAt: string;
};

const STATUSES: ApplicationStatus[] = ["NEW", "REVIEWING", "SHORTLISTED", "REJECTED", "HIRED"];

export function ApplicationTable({
  applications,
  canWrite,
}: {
  applications: Application[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);

  const setStatus = (id: string, status: ApplicationStatus) =>
    startTransition(async () => {
      const result = await updateApplicationStatusAction(id, status);
      if (result.ok) {
        toast.success(result.message ?? "Updated.");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });

  return (
    <Table>
      <thead>
        <tr>
          <Th>Applicant</Th>
          <Th>Role</Th>
          <Th>Links</Th>
          <Th>Status</Th>
          <Th>Applied</Th>
        </tr>
      </thead>
      <tbody>
        {applications.map((application) => (
          <Fragment key={application.id}>
            <tr
              className="cursor-pointer transition-colors hover:bg-[var(--a-hover)]"
              onClick={() =>
                setExpanded(expanded === application.id ? null : application.id)
              }
            >
              <Td>
                <span className="flex items-center gap-1.5 font-medium text-[var(--a-fg-strong)]">
                  <ChevronDown
                    className={`size-3.5 text-[var(--a-subtle)] transition-transform ${
                      expanded === application.id ? "rotate-180" : ""
                    }`}
                  />
                  {application.name}
                </span>
                <a
                  href={`mailto:${application.email}`}
                  onClick={(event) => event.stopPropagation()}
                  className="mt-0.5 block text-[12px] text-[var(--accent)] hover:underline"
                >
                  {application.email}
                </a>
              </Td>
              <Td className="text-[var(--a-muted)]">{application.jobTitle}</Td>
              <Td>
                <span className="flex items-center gap-2">
                  {[
                    { label: "LinkedIn", url: application.linkedin },
                    { label: "Portfolio", url: application.portfolio },
                  ]
                    .filter((link) => link.url)
                    .map((link) => (
                      <a
                        key={link.label}
                        href={link.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--a-border)] px-2 py-0.5 text-[11.5px] text-[var(--a-muted)] hover:border-[var(--a-border-strong)] hover:text-[var(--a-fg)]"
                      >
                        {link.label}
                        <ExternalLink className="size-3" />
                      </a>
                    ))}
                  {!application.linkedin && !application.portfolio ? (
                    <span className="text-[var(--a-subtle)]">—</span>
                  ) : null}
                </span>
              </Td>
              <Td>
                {canWrite ? (
                  <select
                    value={application.status}
                    disabled={pending}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      setStatus(application.id, event.target.value as ApplicationStatus)
                    }
                    className="h-8 rounded-lg border border-[var(--a-border)] bg-[var(--a-input)] px-2 text-[12.5px] text-[var(--a-fg)] outline-none"
                  >
                    {STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {value.charAt(0) + value.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={application.status} />
                )}
              </Td>
              <Td className="whitespace-nowrap text-[var(--a-muted)]">
                {formatDate(application.createdAt)}
              </Td>
            </tr>

            {expanded === application.id ? (
              <tr>
                <Td className="bg-[var(--a-panel-2)]" />
                <td colSpan={4} className="border-b border-[var(--a-border)] bg-[var(--a-panel-2)] px-4 py-4">
                  {application.phone ? (
                    <p className="mb-2 text-[12.5px] text-[var(--a-muted)]">
                      Phone: <span className="text-[var(--a-fg)]">{application.phone}</span>
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--a-fg)]">
                    {application.message || "No message provided."}
                  </p>
                </td>
              </tr>
            ) : null}
          </Fragment>
        ))}
      </tbody>
    </Table>
  );
}
