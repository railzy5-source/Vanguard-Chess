/**
 * functions/api/coach-insight.js
 *
 * Cloudflare Pages Function - runs server-side, never ships to the browser.
 * Receives a played move + position context and asks Gemini for a short,
 * teaching-focused explanation: opening principles, tactical patterns,
 * positional ideas, or endgame technique depending on game phase.
 *
 * The GEMINI_API_KEY is read from Cloudflare's environment bindings
 * (Pages project -> Settings -> Environment variables), so it is never
 * exposed to the client.
 */

const SYSTEM_INSTRUCTIONS = `You are Coach Naomi, an AI Grandmaster chess coach.
Your job is to help a student genuinely improve, not just praise or criticize.

For every move you are given, write a short coaching note (2-4 sentences) that:
- Explains the underlying chess IDEA behind why the move is good, inaccurate, or a mistake
- Grounds the explanation in one of these depending on the game phase:
  - Opening (phase = "opening"): development, center control, king safety, tempo
  - Middlegame (phase = "middlegame"): tactical motifs (pins, forks, skewers, discovered attacks),
    piece activity, weak squares, pawn structure
  - Endgame (phase = "endgame"): king activity, opposition, passed pawns, piece coordination,
    technique for converting or holding the position
- Is specific to the actual move and position given, not generic filler
- Speaks directly to the student in a warm, encouraging but honest tone
- Avoids restating the move notation excessively

Respond ONLY with strict JSON, no markdown fences, in this exact shape:
{
  "rationale": "2-4 sentence explanation grounded in the position and phase",
  "principle": "one short, memorable, general chess principle the student should take away (under 15 words)"
}`;

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY is not configured on this Cloudflare Pages project.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const {
    san,
    classification,
    bestMoveSan,
    fenBefore,
    fenAfter,
    moveNumber,
    openingName,
    phase
  } = body || {};

  if (!san || !classification) {
    return new Response(JSON.stringify({ error: 'Missing required move context' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const userPrompt = `Move played: ${san}
Classification: ${classification}
Best engine move (if different): ${bestMoveSan || 'same as played'}
Move number: ${moveNumber || 'unknown'}
Game phase: ${phase || 'unknown'}
Opening name (if known): ${openingName || 'none'}
Position before move (FEN): ${fenBefore || 'unknown'}
Position after move (FEN): ${fenAfter || 'unknown'}`;

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTIONS }] },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return new Response(JSON.stringify({ error: 'Gemini request failed', detail: errText }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return new Response(JSON.stringify({ error: 'No content returned from Gemini' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return new Response(JSON.stringify({ error: 'Could not parse Gemini response as JSON' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({
        rationale: parsed.rationale || null,
        principle: parsed.principle || null
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected server error', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
