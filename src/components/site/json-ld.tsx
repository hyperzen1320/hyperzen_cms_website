import type { JsonLd } from "@/lib/seo";

/**
 * Emits structured data. The payload is produced on the server from CMS
 * content and serialised with `<` escaped so it can never break out of the
 * script tag.
 */
export function JsonLdScript({ data, id }: { data: JsonLd | null; id?: string }) {
  if (!data) return null;
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\u003c"),
      }}
    />
  );
}
