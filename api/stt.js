// =====================================================
// 🎙️ VirtualMix STT — Whisper API Gateway (Vercel)
// - działa z modelem HuggingFace: Systran/faster-whisper-small
// - wymaga zmiennych środowiskowych:
//   HF_TOKEN  -> Twój token z HuggingFace
// =====================================================

import fetch from "node-fetch";
import FormData from "form-data";

export const config = {
  api: {
    bodyParser: false, // ważne — akceptujemy binarne audio
  },
};

export default async function handler(req, res) {
  // 🧩 1. Obsługa metod HTTP
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = process.env.HF_TOKEN;
    if (!token) {
      return res.status(500).json({
        ok: false,
        error: "Brak tokena HF_TOKEN w środowisku Vercel.",
      });
    }

    // 🧩 2. Pobieramy dane audio z requestu
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const audioBuffer = Buffer.concat(chunks);

    // 🧩 3. Budujemy zapytanie multipart/form-data
    const formData = new FormData();
    formData.append("file", audioBuffer, {
      filename: "audio.mp3",
      contentType: "audio/mpeg",
    });

    // 🧩 4. Wywołanie modelu Whisper (Systran)
    const response = await fetch(
      "https://api-inference.huggingface.co/models/Systran/faster-whisper-small",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const text = await response.text();
    let data = {};

    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    // 🧩 5. Zwracamy wynik
    if (response.ok) {
      res.status(200).json({ ok: true, result: data });
    } else {
      res.status(500).json({
        ok: false,
        error: "Błąd z HuggingFace",
        status: response.status,
        raw: data,
      });
    }
  } catch (err) {
    console.error("❌ Błąd STT:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
