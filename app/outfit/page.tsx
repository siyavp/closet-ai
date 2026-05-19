'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface OutfitSuggestion {
  outfit_name: string
  weather_note: string
  items: string[]
  styling_tip: string
}

interface ClothingItem {
  id: string
  name: string
  image_url: string
  category: string
  color: string
}

export default function OutfitPage() {
  const [loading, setLoading] = useState(false)
  const [weather, setWeather] = useState('')
  const [suggestion, setSuggestion] = useState<OutfitSuggestion | null>(null)
  const [matchedItems, setMatchedItems] = useState<ClothingItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/login')
    else setUserId(user.id)
  }

  async function getSuggestion() {
    setLoading(true)
    setError('')
    setSuggestion(null)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords
      const res = await fetch('/api/outfit-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lat, lon })
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else { setWeather(data.weather); setSuggestion(data.suggestion); setMatchedItems(data.matchedItems) }
      setLoading(false)
    }, () => { setError('Allow location access to get weather-based suggestions'); setLoading(false) })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f7f3ee; font-family: 'Jost', sans-serif; }
        .app-header { background: #f7f3ee; border-bottom: 1px solid #e8e0d5; padding: 0 2.5rem; display: flex; align-items: center; justify-content: space-between; height: 64px; }
        .logo { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 600; color: #2c2420; letter-spacing: 0.02em; }
        .logo span { color: #c17b5c; }
        .btn-ghost { background: transparent; color: #7a6a60; border: 1px solid #d9cfc7; padding: 8px 18px; border-radius: 30px; font-family: 'Jost', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .btn-ghost:hover { border-color: #9a8a80; color: #2c2420; }
        .suggest-btn { width: 100%; padding: 18px; background: #2c2420; color: #f7f3ee; border: none; border-radius: 18px; font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 500; cursor: pointer; transition: background 0.2s; letter-spacing: 0.02em; }
        .suggest-btn:hover:not(:disabled) { background: #c17b5c; }
        .suggest-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .outfit-card { background: #fff; border-radius: 20px; padding: 1.75rem; border: 1px solid #f0e8e0; margin-bottom: 1.5rem; }
        .item-card { background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #f0e8e0; transition: transform 0.2s; }
        .item-card:hover { transform: translateY(-4px); }
      `}</style>

      <header className="app-header">
        <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>dres<span>s</span>ed</div>
        <button className="btn-ghost" onClick={() => router.push('/')}>← My Closet</button>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 3rem 5rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.8rem', fontWeight: '500', color: '#2c2420', lineHeight: 1 }}>
            What should I wear?
          </h1>
          <p style={{ color: '#9a8a80', fontSize: '13px', marginTop: '8px' }}>AI picks an outfit from your closet based on today's weather</p>
        </div>

        <button className="suggest-btn" onClick={getSuggestion} disabled={loading}>
          {loading ? '✨ Styling your outfit...' : '🌤 Get today\'s outfit'}
        </button>

        {error && <p style={{ color: '#e05555', fontSize: '13px', marginTop: '1rem' }}>{error}</p>}

        {weather && (
          <p style={{ color: '#9a8a80', fontSize: '13px', marginTop: '1rem', letterSpacing: '0.02em' }}>📍 {weather}</p>
        )}

        {suggestion && (
          <div style={{ marginTop: '1.5rem' }}>
            <div className="outfit-card">
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: '500', color: '#2c2420', marginBottom: '10px' }}>
                {suggestion.outfit_name}
              </h2>
              <p style={{ fontSize: '14px', color: '#7a6a60', marginBottom: '8px', lineHeight: 1.6 }}>🌡 {suggestion.weather_note}</p>
              <p style={{ fontSize: '13px', color: '#b0a090', lineHeight: 1.6, borderTop: '1px solid #f0e8e0', paddingTop: '10px', marginTop: '4px' }}>
                💡 {suggestion.styling_tip}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
              {matchedItems.map((item: ClothingItem) => (
                <div key={item.id} className="item-card">
                  <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '15px', fontWeight: '500', color: '#2c2420', textTransform: 'capitalize' }}>{item.name}</p>
                    <p style={{ fontSize: '11px', color: '#9a8a80', marginTop: '2px', textTransform: 'capitalize' }}>{item.color} · {item.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  )
}