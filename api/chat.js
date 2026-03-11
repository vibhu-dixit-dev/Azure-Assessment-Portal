/**
 * Vercel Serverless Function - Chat API Proxy
 * Keeps the Groq API key server-side (never sent to the browser).
 * 
 * Set GROQ_API_KEY in Vercel Dashboard → Settings → Environment Variables.
 */
export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on server.' });
    }

    try {
        const { messages } = req.body;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error || 'Groq API error' });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Serverless function error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
