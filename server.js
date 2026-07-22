import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = Number(process.env.PORT || 8000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "15mb" }));
app.use(express.static(__dirname));

app.post("/api/analyze-food", async (req, res) => {
  try {
    const { image } = req.body || {};
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "An image is required." });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "AI is not configured. The frontend will use demo mode." });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5",
      input: [{
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Identify the Malaysian foods visible in this image.
Return ONLY valid JSON in this exact structure:
{"foods":[{"name":"food name","portion":1,"unit":"serving","confidence":85}]}
Use confidence from 0 to 100. Give realistic serving estimates.
Do not calculate calories because the app matches results to its own nutrition database.`
          },
          { type: "input_image", image_url: image }
        ]
      }]
    });

    const text = String(response.output_text || "").trim()
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.foods)) throw new Error("Invalid AI response.");
    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Food analysis failed." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.listen(port, () => console.log(`MakanAI running at http://localhost:${port}`));
