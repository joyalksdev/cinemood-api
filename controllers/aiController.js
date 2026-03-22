const axios = require("axios");

exports.getAiRecommendation = async (req, res) => {
  try {
    const { task, data } = req.body;
    
    const model = "gemini-2.5-flash"; 
    
    const apiKey = process.env.GEMINI_API_KEY;
    const tmdbToken = process.env.TMDB_TOKEN;
    const tmdbBaseUrl = process.env.TMDB_BASE_URL;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    const currentTask = task || "semantic_search";
    let promptText = "";

    switch (currentTask) {
      case "semantic_search":
        promptText = `You are a world-class cinema curator. 
        The user is looking for this vibe: "${data}".

        TASK: Provide a list of 10 of the most iconic and popular movies that define this specific mood.
        
        CRITICAL RULES:
        1. PRIORITY: Choose movies that are globally recognized "must-watches" for this vibe (e.g., if 'inspired', think 'The Shawshank Redemption' or 'Forrest Gump').
        2. LANGUAGE ANCHOR: If a language like "Malayalam" is mentioned, ONLY provide legendary/popular hits from that specific industry.
        3. DATA INTEGRITY: Use exact movie titles as they appear on TMDB.
        4. NO FILLER: Avoid obscure or low-budget films unless they are cult classics.

        Return ONLY a JSON object. 
        Format: {
            "movieTitles": ["Title 1", "Title 2", ...], 
            "reason": "Explain why these specific iconic films match the vibe", 
            "suggestion": "The absolute #1 'gold standard' movie for this vibe"
        }`;
        break;

      case "persona_recommendation":
      
        promptText = `Based on these recent movies: "${data}", suggest ONE similar movie.
        Format: {"movieTitles": ["Title"], "reason": "string"}`;
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

    const rawOutput = aiRes.data.candidates[0].content.parts[0].text.trim();
    const cleanJsonString = rawOutput.replace(/```json|```/g, "").trim();
    const aiParsed = JSON.parse(cleanJsonString);

    if (currentTask === "semantic_search" || currentTask === "persona_recommendation") {
      const titles = aiParsed.movieTitles;

     
      const moviePromises = titles.map(async (title) => {
        try {
          const tmdbRes = await axios.get(
            `${tmdbBaseUrl}/search/movie?query=${encodeURIComponent(title)}&include_adult=false`,
            { headers: { Authorization: `Bearer ${tmdbToken}` } }
          );
          return tmdbRes.data.results[0]; 
        } catch (err) {
          console.error(`TMDB error for ${title}:`, err.message);
          return null;
        }
      });

      const movieResults = await Promise.all(moviePromises);
      const finalMovies = movieResults.filter(movie => movie !== null && movie !== undefined);

      return res.status(200).json({
        success: true,
        reason: aiParsed.reason,
        suggestion: aiParsed.suggestion || null,
        movies: finalMovies,
      });
    }

    if (currentTask === "vibe_check") {
      return res.status(200).json({ success: true, summary: aiParsed.summary });
    }
    
  } catch (error) {
    console.error("AI Controller Error:", error.message);
    res.status(500).json({ success: false, error: "Failed to process AI recommendation" });
  }
};