import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { userId, messages } = await request.json()

    const { data: items } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', userId)

    const closetSummary = items?.map(item =>
      `- ${item.name} (${item.category}, ${item.color}) — ${item.ai_description}`
    ).join('\n') || 'No items in wardrobe yet'

    const result = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'system',
          content: `You are a fun, friendly, and knowledgeable personal stylist named Stella. You speak in a warm, encouraging, slightly playful tone — like a stylish best friend, not a robot. You know fashion deeply.

The user's wardrobe contains:
${closetSummary}

Always reference their actual wardrobe items when giving advice. Be specific. Keep responses concise — 2-4 sentences max unless they ask for more. Use light formatting if helpful but keep it conversational.`
        },
        ...messages
      ]
    })

    return NextResponse.json({
      message: result.choices[0].message.content
    })

  } catch (err) {
    console.log('Chat error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}