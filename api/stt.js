// ============================================================
// VirtualMix — Whisper STT Proxy (FINAL for Vercel 2025)
// ============================================================
// Obsługuje wysyłanie audio do HuggingFace i zwraca transkrypcję
// Wymaga ustawionego tokena HF_TOKEN w zmiennych środowiskowych
// ============================================================

import FormData from "form-data";

export const config = {
  runtime: "nodejs", // ✅ poprawione z nodejs18.x
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  try {
    // 🟢 Obsługujemy tylko POST (dla wysyłki pliku audio)
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // 🟢 Odbieramy dane binarne (plik audio)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // 🟢 Tworzymy obiekt FormData do wysyłki
    const form = new FormData();
    form.append("file", buffer, {
      filename: "audio.mp3",
      contentType: "audio/mpeg",
    });

    // 🟢 Wysyłamy żądanie do HuggingFace Whisper
    const response = await fetch(
      "https://api-inference.huggingface.co/models/Systran/faster-whisper-small",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
        },
        body: form,
      }
    );

    // 🟠 Sprawdzamy, czy nie zwrócono błędu
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} ${errText}`);
    }

    // 🟢 Parsujemy wynik transkrypcji
    const data = await response.json();

    // 🟢 Zwracamy transkrypcję do klienta
    res.status(200).json(data);
  } catch (err) {
    console.error("STT Proxy Error:", err);
    res.status(500).json({ error: err.message });
  }
}
