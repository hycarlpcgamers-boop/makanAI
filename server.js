import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = Number(process.env.PORT || 8000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OFF_HEADERS = {
  "User-Agent": "MakanAI-World/4.0 (educational nutrition app)",
  "Accept": "application/json"
};

app.use(express.json({ limit: "15mb" }));
app.use(express.static(__dirname));

function cleanText(value) {
  return Array.isArray(value) ? value.filter(Boolean).join(", ") : String(value || "").trim();
}
function normaliseProduct(product = {}) {
  const n = product.nutriments || {};
  const sodiumMg = Number(n.sodium_100g || 0) * 1000;
  return {
    code: product.code || "",
    name: cleanText(product.product_name) || cleanText(product.generic_name) || "Unnamed product",
    brand: cleanText(product.brands),
    country: cleanText(product.countries) || "Worldwide",
    category: cleanText(product.categories).split(",")[0] || "Packaged Food",
    serving: cleanText(product.serving_size) || "100 g",
    calories: Number(n["energy-kcal_100g"] || n["energy-kcal"] || 0),
    protein: Number(n.proteins_100g || 0),
    carbs: Number(n.carbohydrates_100g || 0),
    fat: Number(n.fat_100g || 0),
    sugar: Number(n.sugars_100g || 0),
    sodium: Math.round(sodiumMg),
    nutriScore: cleanText(product.nutriscore_grade).toUpperCase(),
    source: "Open Food Facts"
  };
}

app.get("/api/global-products", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (query.length < 2) return res.status(400).json({ error: "Enter at least two characters." });
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "20",
      fields: "code,product_name,generic_name,brands,countries,categories,serving_size,nutriments,nutriscore_grade"
    });
    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`, {
      headers: OFF_HEADERS,
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error(`Open Food Facts ${response.status}`);
    const data = await response.json();
    const products = (data.products || []).map(normaliseProduct).filter(p => p.name !== "Unnamed product");
    res.json({
      products,
      attribution: "Product data from Open Food Facts under ODbL.",
      source: "Open Food Facts"
    });
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Worldwide product search is unavailable." });
  }
});

app.get("/api/barcode/:code", async (req, res) => {
  try {
    const code = String(req.params.code || "").replace(/\D/g, "");
    if (!code) return res.status(400).json({ error: "Invalid barcode." });
    const fields = "code,product_name,generic_name,brands,countries,categories,serving_size,nutriments,nutriscore_grade";
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${encodeURIComponent(fields)}`, {
      headers: OFF_HEADERS,
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error(`Open Food Facts ${response.status}`);
    const data = await response.json();
    if (!data.product) return res.status(404).json({ error: "Product not found." });
    res.json(normaliseProduct(data.product));
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Barcode lookup is unavailable." });
  }
});

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
            text: `Identify every visible food or drink in this image, including international dishes.
Return ONLY valid JSON:
{"foods":[{"name":"common food or dish name","portion":1,"unit":"serving","confidence":85}]}
Use confidence from 0 to 100. Give realistic serving estimates.
Do not calculate nutrition; the app matches names to its own food library.`
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
app.listen(port, () => console.log(`MakanAI World running at http://localhost:${port}`));
