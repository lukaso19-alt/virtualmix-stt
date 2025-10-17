// =======================================================
// VirtualMix — STT Proxy (Whisper Final Vercel Version)
// =======================================================
// Działa z natywnym fetch w Node 18 — bez node-fetch!
// =======================================================

import FormData from "form-data";

export const config = {
  runtime: "nodejs18.x",
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🔹 Odbierz dane audio z body
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    // 🔹 Utwórz form-data dla Whisper API
    const form = new FormData();
    form.append("file", buffer, {
      filename: "audio.mp3",
      contentType: "audio/mpeg",
    });
    form.append("model", "whisper-1");

    // 🔹 Wywołaj OpenAI Whisper API
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
      },
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    // 🔹 Odbierz wynik transkrypcji
    const data = await response.json();
    res.status(200).json({ text: data.text || "" });

  } catch (err) {
    console.error("STT Proxy error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
