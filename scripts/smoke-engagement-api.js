const { neon } = require("@neondatabase/serverless");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  const sql = neon(process.env.DATABASE_URL);
  const smokeUser = "codex-smoke-user";
  const smokeKey = "codex-smoke-key";

  const chapterRows = await sql(
    "SELECT id::text AS chapter_id, comic_id::text AS comic_id FROM chapters ORDER BY created_at DESC LIMIT 1"
  );

  if (!chapterRows.length) {
    throw new Error("No chapters found for smoke test");
  }

  const row = chapterRows[0];

  await sql(
    "INSERT INTO chapter_view_events (event_type, comic_id, chapter_id, user_id, session_id, dedupe_key, source, counted) VALUES ($1, $2, $3, $4, $5, $6, $7, true)",
    [
      "chapter_view",
      row.comic_id,
      row.chapter_id,
      smokeUser,
      smokeUser,
      smokeKey,
      "smoke_test",
    ]
  );

  const viewCount = await sql(
    "SELECT COUNT(*)::int AS total FROM chapter_view_events WHERE dedupe_key = $1",
    [smokeKey]
  );

  await sql("DELETE FROM chapter_view_events WHERE dedupe_key = $1", [smokeKey]);

  await sql(
    "INSERT INTO comic_likes (comic_id, user_id, source) VALUES ($1, $2, $3) ON CONFLICT (comic_id, user_id) DO UPDATE SET updated_at = NOW()",
    [row.comic_id, smokeUser, "smoke_test"]
  );

  const likeCount = await sql(
    "SELECT COUNT(*)::int AS total FROM comic_likes WHERE comic_id = $1 AND user_id = $2",
    [row.comic_id, smokeUser]
  );

  await sql("DELETE FROM comic_likes WHERE comic_id = $1 AND user_id = $2", [
    row.comic_id,
    smokeUser,
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        chapter_view_events: viewCount[0]?.total ?? 0,
        comic_likes: likeCount[0]?.total ?? 0,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
