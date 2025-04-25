// friendly.js
import express from "express";
import axios from "axios";
import OpenAI from "openai";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.get("/", async (req, res) => {
  const { url, type } = req.query;
  if (!url || !type) {
    return res.status(400).json({ error: "Missing url or type parameter" });
  }

  try {
    const { data: html } = await axios.get(url);
    const prompt = `Extract an AI-SEO ${type} report from this HTML:\n\n${html}`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0].message.content;
    const json = JSON.parse(content);
    res.json(json);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to process URL", detail: err.message });
  }
});

export { router as FriendlyRouter };