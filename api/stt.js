// api/stt.js — VirtualMix Whisper Proxy (Vercel Edge Safe)
import FormData from "form-data";

export const config = {
  runtime: "nodejs18.x", // wymusza Node runtime zamiast Edge
  api: {
    bodyParser: false,
    responseLimit: false
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const form = new FormData();
    form.append("file", buffer, { filename: "audio.mp3", contentType: "audio/mpeg" });

    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) throw new Error("Brak tokena HuggingFace w zmiennej środowiskowej HF_TOKEN");

    const response = await fetch("https://api-inference.huggingface.co/models/Systran/faster-whisper-small", {
      method: "POST",
      headers: { Authorization: `Bearer ${hfToken}` },
      body: form
    });

    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`Błąd HuggingFace: ${response.status} ${txt}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error("STT Proxy Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
