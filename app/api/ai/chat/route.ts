import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'

const SYSTEM_PROMPT = `You are a friendly business setup assistant for a garment shop management system called "Lalitha Garments". Your job is to help the shop owner set up their business profile by collecting the following 7 fields through a natural conversation:

1. **businessName** — The name of their shop/business
2. **ownerName** — The owner's full name
3. **email** — Business email address
4. **phone** — Phone number
5. **whatsappNumber** — WhatsApp number (can be same as phone)
6. **address** — Full shop/business address
7. **gstNumber** — GST number (optional, they can skip this)

IMPORTANT RULES:
- Ask for ONE field at a time. Start by greeting and asking for the business name.
- Be warm, friendly, and conversational. Use simple language. You can use a few emojis.
- If the user provides multiple fields in one message, acknowledge ALL of them and move to the next missing field.
- If the user says their WhatsApp number is the same as their phone number, accept that.
- GST number is optional — if they say they don't have one or want to skip, that's fine.
- After collecting ALL fields (or user skips GST), show a summary and ask for confirmation.
- The summary MUST be formatted as a JSON code block like this:

\`\`\`json
{
  "businessName": "...",
  "ownerName": "...",
  "email": "...",
  "phone": "...",
  "whatsappNumber": "...",
  "address": "...",
  "gstNumber": "..."
}
\`\`\`

- After showing the JSON summary, ask: "Does everything look correct? You can say 'yes' to save, or tell me what to change."
- If the user wants to edit a field, update it and show the JSON summary again.
- If the user confirms (says yes, correct, save, looks good, etc.), respond with the FINAL JSON block again and say "CONFIRMED".
- Keep your responses SHORT and concise — maximum 2-3 sentences per message.
- Do NOT ask for any other information beyond these 7 fields.
- Respond ONLY in English.`

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { messages, provider = 'gemini', modelId, apiKey: providedApiKey } = body as { messages: ChatMessage[], provider?: 'gemini' | 'groq', modelId?: string, apiKey?: string }

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Messages array is required' },
                { status: 400 }
            )
        }

        let reply = ''

        if (provider === 'gemini') {
            const apiKey = providedApiKey || process.env.GEMINI_API_KEY
            if (!apiKey) {
                return NextResponse.json(
                    { success: false, message: 'Gemini API key not configured or provided.' },
                    { status: 500 }
                )
            }
            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: modelId || 'gemini-2.0-flash' })

            const contents = messages.map((msg) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            }))

            const result = await model.generateContent({
                contents,
                systemInstruction: {
                    role: 'user',
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.9,
                    maxOutputTokens: 1024,
                },
            })
            reply = result.response.text()
        }
        else if (provider === 'groq') {
            const apiKey = providedApiKey || process.env.GROQ_API_KEY
            if (!apiKey) {
                return NextResponse.json(
                    { success: false, message: 'Groq API key not configured or provided.' },
                    { status: 500 }
                )
            }
            const groq = new Groq({ apiKey })

            // Groq expects messages in standard format: {role: 'system'|'user'|'assistant', content: string}
            const groqMessages = [
                { role: 'system' as const, content: SYSTEM_PROMPT },
                ...messages.map(msg => ({ role: msg.role, content: msg.content }))
            ]

            const chatCompletion = await groq.chat.completions.create({
                messages: groqMessages,
                model: modelId || 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 1024,
                top_p: 0.9,
            })
            reply = chatCompletion.choices[0]?.message?.content || ''
        } else {
            return NextResponse.json(
                { success: false, message: 'Invalid AI provider selected.' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            reply,
        })
    } catch (error: any) {
        console.error('AI Chat error:', error)

        const errorMessage = error?.message || ''

        // Rate limit handling
        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests') || errorMessage.includes('rate_limit')) {
            const retryMatch = errorMessage.match(/retry in (\d+)/i) || errorMessage.match(/Please try again in (\d+)s/i)
            const retrySeconds = retryMatch ? parseInt(retryMatch[1]) : 60

            return NextResponse.json(
                {
                    success: false,
                    message: `API rate limit reached. Please wait ~${retrySeconds}s and try again. If this persists, the daily quota may be exhausted.`,
                    retryAfter: retrySeconds,
                    isRateLimit: true,
                },
                { status: 429 }
            )
        }

        // Auth errors
        if (errorMessage.includes('API_KEY') || errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('authentication')) {
            return NextResponse.json(
                { success: false, message: 'Invalid API key provided. Please check the key and try again.' },
                { status: 401 }
            )
        }

        return NextResponse.json(
            { success: false, message: 'Failed to get AI response. Please try again.' },
            { status: 500 }
        )
    }
}
