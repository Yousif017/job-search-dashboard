// Runs on a schedule via GitHub Actions (see .github/workflows/scan-opportunities.yml).
// Reads the institutions already in index.html + suggestions.json, asks Claude
// (with web search) to find genuinely new ones, and appends any new finds to
// suggestions.json. That file is committed back to the repo, which triggers a
// redeploy — so the live site always reflects the latest scan.

const fs = require("fs");
const path = require("path");

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY environment variable / secret.");
    process.exit(1);
  }

  const rootDir = path.join(__dirname, "..");
  const indexPath = path.join(rootDir, "index.html");
  const suggestionsPath = path.join(rootDir, "suggestions.json");

  const html = fs.readFileSync(indexPath, "utf-8");
  const match = html.match(/const DIRECTORY = (\[[\s\S]*?\n\]);/);
  if (!match) {
    console.error("Could not find the DIRECTORY array inside index.html.");
    process.exit(1);
  }
  const directory = JSON.parse(match[1]);

  let suggestionsData = { lastScanned: null, suggestions: [] };
  if (fs.existsSync(suggestionsPath)) {
    suggestionsData = JSON.parse(fs.readFileSync(suggestionsPath, "utf-8"));
  }

  const existingNames = new Set([
    ...directory.map((d) => d.name),
    ...suggestionsData.suggestions.map((s) => s.name),
  ]);

  const prompt = `You are helping a PhD holder in Chemistry Education / Discipline-Based Education Research (DBER) build the MOST COMPREHENSIVE possible map of employers across Saudi Arabia's broader education and training landscape — not limited narrowly to chemistry or DBER-specific roles, and not limited to any particular region.

Consider the full breadth of sub-sectors within this scope, including: K-12 schools (public and private), higher education, vocational/technical training, corporate learning & development, adult and continuing education, examination and accreditation bodies (assessment design), professional certification bodies, edtech companies (curriculum/content design), education-focused NGOs and foundations, government education-policy bodies, healthcare/medical education (foundation-year science teaching), and special/inclusive education programs with a STEM-accessibility focus.

Institutions already identified (do NOT repeat any of these): ${Array.from(existingNames).join("; ")}

Search the web across ALL regions of Saudi Arabia — do not limit to any particular city or region — and find up to 6 NEW real institutions not in the list above that could be relevant. Prioritize sectors or niches that are underrepresented or entirely missing from the existing list, wherever in the country they are. If you cannot find any genuinely new, real institutions, return an empty array — do not invent or guess.

Respond with ONLY a JSON array, no markdown formatting, no explanation before or after. Exact format:
[{"name":"...","sector":"University|Institute|Center|Organization|Foundation|Company/Industry","city":"...","region":"...","focus":"short description of relevant dept/focus area","careers":"URL or empty string"}]`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1800,
      messages: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });

  if (!response.ok) {
    console.error("API request failed:", response.status, await response.text());
    process.exit(1);
  }

  const data = await response.json();
  const textBlocks = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const cleaned = textBlocks.replace(/```json/gi, "").replace(/```/g, "").trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);

  const now = new Date().toISOString();

  if (!jsonMatch) {
    console.log("No parseable suggestions returned this
