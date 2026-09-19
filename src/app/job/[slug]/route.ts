import { redirect } from "next/navigation";

/** Legacy /job/[slug] URLs point at the canonical /careers/[slug] route. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  redirect(`/careers/${slug}`);
}
