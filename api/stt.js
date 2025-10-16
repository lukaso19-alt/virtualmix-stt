// api/stt.js — VirtualMix Whisper Proxy
import fetch from "node-fetch";
import FormData from "form-data";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  try {
    const form = new FormData();
    form.append("file", req.body || req, { filename: "audio.mp3", contentType: "audio/mpeg" });

    const response = await fetch("https://api-inference.huggingface.co/models/openai/whisper-small-v2", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`
      },
      body: form
    });

    const data = await response.json();
    return res.status(200).json({ text: data.text || data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
