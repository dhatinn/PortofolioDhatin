const MODEL = 'openai/gpt-oss-20b';

// In-memory rate limiter (resets on cold start — acceptable for serverless)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20;

function getRateLimitKey(req) {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.socket?.remoteAddress ||
        'unknown'
    );
}

function isRateLimited(key) {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(key, { windowStart: now, count: 1 });
        return false;
    }

    entry.count++;
    if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }

    return false;
}

// Allowed message roles
const ALLOWED_ROLES = new Set(['user', 'assistant']);
const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000; // characters per message

function sanitizeMessages(messages) {
    if (!Array.isArray(messages)) return null;

    // Reject non-arrays or oversized histories
    const filtered = messages.slice(-MAX_MESSAGES);

    const sanitized = [];
    for (const msg of filtered) {
        if (typeof msg !== 'object' || msg === null) return null;

        const role = msg.role;
        const content = msg.content;

        // Only allow user/assistant roles (block system prompt injection)
        if (!ALLOWED_ROLES.has(role)) continue;

        if (typeof content !== 'string') return null;
        if (content.trim().length === 0) continue;

        // Truncate overly long messages
        sanitized.push({
            role,
            content: content.slice(0, MAX_CONTENT_LENGTH),
        });
    }

    return sanitized.length > 0 ? sanitized : null;
}

export default async function handler(req, res) {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate limiting
    const clientKey = getRateLimitKey(req);
    if (isRateLimited(clientKey)) {
        return res.status(429).json({ error: 'Too many requests. Please wait a moment before trying again.' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error('GROQ_API_KEY is not set');
        return res.status(500).json({ error: 'Service temporarily unavailable.' });
    }

    const rawMessages = req.body?.messages;
    const sanitized = sanitizeMessages(rawMessages);

    if (!sanitized) {
        return res.status(400).json({ error: 'Invalid request: messages must be a non-empty array of valid user/assistant messages.' });
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: sanitized,
                temperature: 0.7,
                max_tokens: 300,
            }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error('Groq API Error:', response.status, errData);
            // Don't leak upstream error details to client
            return res.status(502).json({ error: 'AI service is currently unavailable. Please try again.' });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Groq fetch error:', error);
        return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
    }
}
