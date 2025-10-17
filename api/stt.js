// api/stt.js — VirtualMix Whisper Proxy (fixed for Vercel)
import FormData from "form-data";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  try {
    // odbieramy dane audio z body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // tworzymy form-data dla HuggingFace
    const form = new FormData();
    form.append("file", buffer, { filename: "audio.mp3", contentType: "audio/mpeg" });

    const response = await fetch(
      "https://api-inference.huggingface.co/models/openai/whisper-small-v2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("STT Proxy Error:", err);
    res.status(500).json({ error: err.message });
  }
}

