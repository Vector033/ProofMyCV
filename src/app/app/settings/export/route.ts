import { exportAll } from "@/lib/data";

export async function GET() {
  const data = await exportAll();
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": 'attachment; filename="factfit-export.json"',
      "cache-control": "private, no-store",
    },
  });
}
