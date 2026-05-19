import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    console.log('1. File received:', file.name)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${uuidv4()}-${file.name}`

    console.log('2. Uploading to storage...')

    const { error: storageError } = await supabase.storage
      .from('clothing-images')
      .upload(filename, buffer, { contentType: file.type })

    if (storageError) {
      console.log('Storage error:', storageError)
      return NextResponse.json({ error: storageError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('clothing-images')
      .getPublicUrl(filename)

    console.log('3. Calling Groq...')

    const base64 = buffer.toString('base64')
    const result = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${file.type};base64,${base64}` }
            },
            {
              type: 'text',
              text: `Analyze this clothing item and respond in JSON only, no markdown:
              {
                "name": "short name for the item",
                "category": "one of: tops, bottoms, dresses, outerwear, shoes, accessories",
                "color": "main color",
                "tags": ["tag1", "tag2", "tag3"],
                "ai_description": "one sentence description"
              }`
            }
          ]
        }
      ]
    })

    console.log('4. Groq done, saving to DB...')

    let aiData
    try {
      const text = result.choices[0].message.content?.replace(/```json|```/g, '').trim() || ''
      aiData = JSON.parse(text)
    } catch {
      aiData = {
        name: file.name,
        category: 'tops',
        color: 'unknown',
        tags: [],
        ai_description: 'Could not analyze image'
      }
    }

    const { data, error } = await supabase
      .from('clothing_items')
      .insert({
        user_id: formData.get('userId') as string,
        image_url: publicUrl,
        name: aiData.name,
        category: aiData.category,
        color: aiData.color,
        tags: aiData.tags,
        ai_description: aiData.ai_description
      })
      .select()
      .single()

    if (error) {
      console.log('DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('5. All done!')
    return NextResponse.json({ item: data })

  } catch (err) {
    console.log('CAUGHT ERROR:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}