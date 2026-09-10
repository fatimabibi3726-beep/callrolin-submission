// Ye script sirf EK BAAR chalani hai (ya jab bhi knowledge base document update ho).
// Ye kya karta hai:
// 1. chunks.json se saare document chunks read karta hai
// 2. Har chunk ke liye Gemini se embedding (numbers ki list) banata hai
// 3. Chunk + embedding ko Supabase table mein save karta hai

import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// --- Setup ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// --- Chunks load karein ---
const chunks = JSON.parse(readFileSync("./chunks.json", "utf-8"));
console.log(`Total ${chunks.length} chunks mile. Upload shuru ho raha hai...\n`);

// --- Helper: ek chunk ko embed + upload karna ---
async function processChunk(chunk, index) {
  try {
    const result = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: chunk.content,
      config: {
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: 768, // hamari Supabase table vector(768) expect karti hai
      },
    });

    const embedding = result.embeddings[0].values;

    const { error } = await supabase.from("callrolin_documents").insert({
      content: chunk.content,
      section: chunk.section,
      embedding,
    });

    if (error) throw error;

    console.log(`[${index + 1}/${chunks.length}] ✅ Uploaded: ${chunk.section.slice(0, 60)}`);
  } catch (err) {
    console.error(`[${index + 1}/${chunks.length}] ❌ Failed: ${chunk.section.slice(0, 60)}`);
    console.error("   Error:", err.message);
  }
}

// --- Sab chunks process karein (thodi delay ke sath, free tier rate limits ke liye) ---
async function main() {
  for (let i = 0; i < chunks.length; i++) {
    await processChunk(chunks[i], i);
    // Free tier rate limits se bachne ke liye chhota sa pause
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  console.log("\n🎉 Sab chunks upload ho gaye!");
}

main();
