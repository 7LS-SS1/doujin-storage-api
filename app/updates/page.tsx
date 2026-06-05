import UpdatesPortalPage from "@/components/reader/reader-portal";

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const query = typeof params.q === "string" ? params.q : "";

  return <UpdatesPortalPage query={query} />;
}
