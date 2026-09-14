

import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {
  // Sirf POST requests allow karein
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Sawal khali nahi ho sakta." });
  }

  try {
    // --- Step 1: User ke sawal ko embed karein ---
    const embedResult = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: message,
      config: {
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: 768,
      },
    });
    const queryEmbedding = embedResult.embeddings[0].values;

    // --- Step 2: Supabase se relevant chunks dhoondein ---
    const { data: matches, error: matchError } = await supabase.rpc(
      "match_callrolin_documents",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5,
      }
    );

    if (matchError) throw matchError;


    if (!matches || matches.length === 0) {
      return res.status(200).json({
        answer:
          "Maaf kijiye, mere paas is sawal ka jawab abhi available nahi hai. Aap hamari team se seedha rabta kar sakte hain.",
      });
    }

    const context = matches.map((m) => m.content).join("\n\n---\n\n");
-
    const prompt = `Aap CallRolin (ek AI Voice Infrastructure company) ke liye ek helpful helpcenter assistant hain.
Neeche diye gaye official document context ke base par visitor ke sawal ka jawab dein.
Agar context mein iska jawab maujood na ho, to sachai se bata dein ke ye information abhi available nahi hai — khud se kuch mat banayein.
Jawab clear, concise aur friendly tone mein dein.

Context:
${context}

Visitor ka sawal: ${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const answer = response.text;

    return res.status(200).json({ answer });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({
      error: "Kuch ghalat ho gaya. Thodi der baad dobara koshish karein.",
    });
  }
}