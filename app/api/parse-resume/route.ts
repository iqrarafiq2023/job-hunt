import { extractText, getDocumentProxy } from "unpdf";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return Response.json({ error: "No file uploaded." }, { status: 400 });
    if (file.size > 4 * 1024 * 1024)
      return Response.json({ error: "File too large (max 4MB)." }, { status: 400 });

    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const { text } = await extractText(pdf, { mergePages: true });
    return Response.json({ text: text.trim() });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Couldn't read that PDF. Paste the text instead." }, { status: 400 });
  }
}