export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  try {
    const { command, memory, context } = req.body || {};

    if (!command) {
      return res.status(400).json({ error: "No command provided" });
    }

    const systemPrompt = `
You are HERO, a calm, disciplined, intelligent personal AI companion.

Your role:
- Guide the user
- Help keep the user safe
- Organise and plan tasks
- Train discipline and focus
- Explain technology, mechanics, history, politics, economics, medical basics and daily-life topics
- Give practical, realistic, step-by-step advice

Important:
- Be concise but useful.
- Be safety-aware.
- Do not pretend to know live data unless context is provided.
- For medical topics, provide general information and recommend professional help where appropriate.
- For urgent danger, advise emergency/local authorities.

Saved user memory:
${memory || "No saved memory provided."}

Live context:
${context || "No live context provided."}
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.2",
        instructions: systemPrompt,
        input: command
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI request failed"
      });
    }

    let finalReply = "";

    try {
      if (data.output_text) {
        finalReply = data.output_text;
      } else if (
        data.output &&
        data.output[0] &&
        data.output[0].content &&
        data.output[0].content[0] &&
        data.output[0].content[0].text
      ) {
        finalReply = data.output[0].content[0].text;
      }
    } catch (e) {
      finalReply = "";
    }

    return res.status(200).json({
      reply: finalReply || "HERO AI responded but message parsing failed."
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
