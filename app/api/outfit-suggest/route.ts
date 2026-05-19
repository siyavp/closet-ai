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
    const { userId, lat, lon } = await request.json()

    // Get weather
    const weatherRes = await fetch(
  `https://wttr.in/?format=j1`
    )       
    const weather = await weatherRes.json()
    const temp = weather.current_condition[0].temp_C
    const desc = weather.current_condition[0].weatherDesc[0].value
    const city = weather.nearest_area[0].areaName[0].value
    const weatherDesc = `${temp}°C, ${desc} in ${city}`

    // Get user's clothes
    const { data: items } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', userId)

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No clothes in closet' }, { status: 400 })
    }

    const closetSummary = items.map(item =>
      `- ${item.name} (${item.category}, ${item.color}) — ${item.ai_description}`
    ).join('\n')

    // Ask Groq to suggest an outfit
    const result = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: `You are a personal stylist. The weather today is: ${weatherDesc}.
          
Here are the clothes in my wardrobe:
${closetSummary}

Suggest a complete outfit for today. Respond in JSON only, no markdown:
{
  "outfit_name": "short catchy name for the outfit",
  "weather_note": "one sentence about why this works for the weather",
  "items": ["exact item name 1", "exact item name 2"],
  "styling_tip": "one quick styling tip"
}`
        }
      ]
    })

    const text = result.choices[0].message.content?.replace(/```json|```/g, '').trim() || ''
    const suggestion = JSON.parse(text)

    // Match suggested items back to actual closet items with images
    const matchedItems = suggestion.items.map((suggestedName: string) => {
      return items.find(item =>
        item.name.toLowerCase().includes(suggestedName.toLowerCase()) ||
        suggestedName.toLowerCase().includes(item.name.toLowerCase())
      )
    }).filter(Boolean)

    return NextResponse.json({
      weather: weatherDesc,
      suggestion,
      matchedItems
    })

  } catch (err) {
    console.log('Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}