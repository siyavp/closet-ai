'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface ClothingItem {
  id: string
  category: string
  color: string
}

export default function ProfilePage() {
  const [name, setName] = useState('')
  const [savedName, setSavedName] = useState('')
  const [email, setEmail] = useState('')
  const [items, setItems] = useState<ClothingItem[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)
    setEmail(user.email || '')
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
    if (profile?.name) { setName(profile.name); setSavedName(profile.name) }
    const { data: clothing } = await supabase.from('clothing_items').select('id, category, color').eq('user_id', user.id)
    if (clothing) setItems(clothing)
  }

  async function saveName() {
    setSaving(true)
    await supabase.from('profiles').upsert({ id: userId, name })
    setSavedName(name)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const categoryBreakdown = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'].map(cat => ({
    name: cat,
    count: items.filter(i => i.category === cat).length,
    percent: items.length ? Math.round((items.filter(i => i.category === cat).length / items.length) * 100) : 0
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count)

  const colorBreakdown = Object.entries(
    items.reduce((acc, item) => {
      acc[item.color] = (acc[item.color] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const topCategory = categoryBreakdown[0]?.name || '—'
  const topColor = colorBreakdown[0]?.[0] || '—'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f7f3ee; font-family: 'Jost', sans-serif; }
        .navbar { position: sticky; top: 0; z-index: 100; background: rgba(247,243,238,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid #e8e0d5; display: flex; align-items: center; justify-content: space-between; padding: 0 5vw; height: 70px; }
        .logo { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 600; color: #2c2420; letter-spacing: 0.03em; cursor: pointer; }
        .logo em { color: #c17b5c; font-style: normal; }
        .nav-right { display: flex; align-items: center; gap: 14px; }
        .nav-link { background: none; border: none; font-family: 'Jost', sans-serif; font-size: 14px; color: #5a4a40; cursor: pointer; padding: 6px 4px; transition: color 0.2s; }
        .nav-link:hover { color: #2c2420; }
        .nav-pill { background: #2c2420; color: #f7f3ee; border: none; padding: 10px 24px; border-radius: 30px; font-family: 'Jost', sans-serif; font-size: 14px; cursor: pointer; transition: background 0.2s; }
        .nav-pill:hover { background: #c17b5c; }
        .card { background: #fff; border-radius: 20px; padding: 2rem; border: 1px solid #ede5dc; }
        .input { width: 100%; padding: 14px 18px; border: 1.5px solid #d9cfc7; border-radius: 12px; font-family: 'Jost', sans-serif; font-size: 15px; background: #fff; color: #2c2420; outline: none; transition: border-color 0.2s; margin-bottom: 10px; }
        .input:focus { border-color: #c17b5c; }
        .save-btn { width: 100%; padding: 14px; background: #2c2420; color: #f7f3ee; border: none; border-radius: 12px; font-family: 'Jost', sans-serif; font-size: 14px; cursor: pointer; transition: background 0.2s; }
        .save-btn:hover { background: #c17b5c; }
        .bar-bg { background: #f4ede7; border-radius: 10px; height: 8px; overflow: hidden; flex: 1; }
        .bar-fill { height: 100%; border-radius: 10px; background: #c17b5c; transition: width 0.6s ease; }
      `}</style>

      <nav className="navbar">
        <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>dres<em>s</em>ed</div>
        <div className="nav-right">
          <button className="nav-link" onClick={() => router.push('/')}>My Closet</button>
          <button className="nav-link" onClick={() => router.push('/chat')}>✦ Stylist</button>
          <button className="nav-pill" onClick={() => router.push('/outfit')}>✨ What should I wear?</button>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 5vw 5rem' }}>

        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 500, color: '#2c2420', marginBottom: '2.5rem' }}>
          Your Profile
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px', alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            <div className="card">
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: '#2c2420', marginBottom: '1.25rem' }}>Display Name</h2>
              <input className="input" type="text" placeholder="What should we call you?" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveName()} />
              <button className="save-btn" onClick={saveName} disabled={saving}>
                {saved ? '✓ Saved' : saving ? '...' : 'Save name'}
              </button>
              <p style={{ fontSize: '13px', color: '#9a8a80', marginTop: '12px' }}>{email}</p>
            </div>

            <div className="card">
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: '#2c2420', marginBottom: '1.25rem' }}>Your Colors</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {colorBreakdown.map(([color, count]) => (
                  <div key={color} style={{ padding: '10px 18px', background: '#f4ede7', borderRadius: '30px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#2c2420', textTransform: 'capitalize' }}>{color}</p>
                    <p style={{ fontSize: '11px', color: '#9a8a80', marginTop: '2px' }}>{count} piece{Number(count) > 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right column */}
          <div className="card">
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: '#2c2420', marginBottom: '1.5rem' }}>Wardrobe Stats</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { num: items.length, label: 'Total pieces' },
                { num: topCategory, label: 'Top category' },
                { num: topColor, label: 'Fave color' }
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '1.25rem', background: '#faf7f4', borderRadius: '14px' }}>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 500, color: '#2c2420', textTransform: 'capitalize' }}>{s.num}</p>
                  <p style={{ fontSize: '12px', color: '#7a6a60', marginTop: '4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.label}</p>
                </div>
              ))}
            </div>

            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: '#2c2420', marginBottom: '1rem' }}>By category</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categoryBreakdown.map(cat => (
                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', color: '#5a4a40', textTransform: 'capitalize', width: '100px' }}>{cat.name}</span>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${cat.percent}%` }} />
                  </div>
                  <span style={{ fontSize: '14px', color: '#7a6a60', width: '30px', textAlign: 'right' }}>{cat.count}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  )
}