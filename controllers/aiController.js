const axios = require("axios");

exports.getAiRecommendation = async (req, res) => {
  try {
    const { task, data } = req.body;
    
    // FIX 1: Must be 1.5-flash
    const model = "gemini-2.5-flash"; 
    
    const apiKey = process.env.GEMINI_API_KEY;
    const tmdbToken = process.env.TMDB_TOKEN;
    const tmdbBaseUrl = process.env.TMDB_BASE_URL;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    // Persona optimization
    const optimizedData = task === "persona_recommendation" && data 
      ? data.split(',').slice(-5).join(',') 
      : data;

    let promptText = "";
    // We use a "semantic_search" default if task is missing
    const currentTask = task || "semantic_search";

    switch (currentTask) {
      case "semantic_search":
        promptText = `You are an elite cinema historian and recommendation engine. 
        The user wants this vibe: "${data}".

        TASK: Convert this vibe into a highly effective TMDB search query.

        CRITICAL RULES:
        1. NEVER include the user's adjectives like "famous", "best", "good", or "vibe" in the searchQuery.
        2. TRANSLATE the request: If the user asks for "famous horror", search for a specific sub-genre like "Classic Supernatural Horror" or "Slasher Masterpiece".
        3. LANGUAGE ANCHORING: If "Malayalam", "Mollywood", or any language is mentioned, that language MUST be the first word of the 'searchQuery'.
        4. GENERAL KNOWLEDGE: Use your knowledge to pick the most accurate technical genres (e.g., "Neo-noir", "Psychological Thriller", "Period Drama").
        5. DIVERSITY: Ensure the searchQuery is broad enough to return many results but specific enough to match the vibe.

        EXAMPLE: "famous malayalam horror" -> searchQuery: "Malayalam supernatural horror ghost"
        EXAMPLE: "movies like inception" -> searchQuery: "Mind-bending sci-fi heist reality"

        Return ONLY a JSON object. 
        Format: {"searchQuery": "string", "reason": "string", "suggestion": "string"}`;
        break;

      case "persona_recommendation":
        promptText = `Pick ONE movie for this watchlist: "${optimizedData}".
        Format: {"searchQuery": "exact movie title", "persona": "string", "reason": "string"}`;
        break;

      case "vibe_check":
        promptText = `Summarize: "${data}". Format: {"summary": "string"}`;
        break;

      default:
        return res.status(400).json({ success: false, message: "Invalid task" });
    }

    const aiRes = await axios.post(geminiUrl, {
      contents: [{ parts: [{ text: promptText }] }],
    });

    if (!aiRes.data.candidates || !aiRes.data.candidates[0].content) {
        throw new Error("AI Error");
    }

    let rawOutput = aiRes.data.candidates[0].content.parts[0].text.trim();
    const cleanJsonString = rawOutput.replace(/```json|```/g, "").trim();
    let aiParsed = JSON.parse(cleanJsonString);

    if (currentTask === "semantic_search" || currentTask === "persona_recommendation") {
     
      // If TMDB returns nothing, we want to try a simpler version of the query
      let queryToUse = aiParsed.searchQuery.replace(/["']/g, "").trim();
      
      if (currentTask === "semantic_search") {
        queryToUse = queryToUse.split(/\s+/).slice(0, 3).join(" ");
      }

      const tmdbResponse = await axios.get(
        `${tmdbBaseUrl}/search/movie?query=${encodeURIComponent(queryToUse)}&include_adult=false`,
        { headers: { Authorization: `Bearer ${tmdbToken}` } }
      );

      let results = tmdbResponse.data.results;

      // If NO results, do a backup search with just the first word
      if (results.length === 0) {
        const backupQuery = queryToUse.split(" ")[0];
        const backupRes = await axios.get(
            `${tmdbBaseUrl}/search/movie?query=${encodeURIComponent(backupQuery)}`,
            { headers: { Authorization: `Bearer ${tmdbToken}` } }
        );
        results = backupRes.data.results;
      }

      return res.status(200).json({
        success: true,
        persona: aiParsed.persona || null,
        reason: aiParsed.reason,
        suggestion: aiParsed.suggestion || null,
        movies: currentTask === "persona_recommendation" ? results.slice(0, 1) : results.slice(0, 10),
      });
    }

    if (currentTask === "vibe_check") {
      return res.status(200).json({ success: true, summary: aiParsed.summary });
    }
    
  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};