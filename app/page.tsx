'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface ClothingItem {
  id: string
  name: string
  category: string
  color: string
  image_url: string
  ai_description: string
  tags: string[]
}

const CATEGORIES = ['all', 'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories']

export default function Home() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [filtered, setFiltered] = useState<ClothingItem[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [greeting, setGreeting] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkUser()
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  useEffect(() => {
    setFiltered(activeCategory === 'all' ? items : items.filter(i => i.category === activeCategory))
  }, [activeCategory, items])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)
    fetchItems(user.id)
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
    if (profile?.name) setUserName(profile.name)
    else setUserName(user.email?.split('@')[0] || 'there')
  }

  async function fetchItems(uid: string) {
    const { data } = await supabase.from('clothing_items').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    if (data) setItems(data)
  }

  async function handleUpload(file: File) {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId!)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.item) setItems(prev => [data.item, ...prev])
    setUploading(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('clothing_items').delete().eq('id', id)
    setItems(prev => prev.filter(item => item.id !== id))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const categoryStats = CATEGORIES.slice(1).map(cat => ({
    name: cat,
    count: items.filter(i => i.category === cat).length
  })).filter(s => s.count > 0)

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
        .nav-link { background: none; border: none; font-family: 'Jost', sans-serif; font-size: 14px; color: #5a4a40; cursor: pointer; padding: 6px 4px; letter-spacing: 0.03em; transition: color 0.2s; }
        .nav-link:hover { color: #2c2420; }
        .nav-pill { background: #2c2420; color: #f7f3ee; border: none; padding: 10px 24px; border-radius: 30px; font-family: 'Jost', sans-serif; font-size: 14px; cursor: pointer; letter-spacing: 0.03em; transition: background 0.2s; }
        .nav-pill:hover { background: #c17b5c; }
        .hero { padding: 4rem 5vw 3rem; border-bottom: 1px solid #e8e0d5; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 2rem; }
        .hero-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.4rem, 5vw, 3.8rem); font-weight: 500; color: #2c2420; line-height: 1.1; }
        .hero-sub { color: #7a6a60; font-size: 15px; margin-top: 12px; letter-spacing: 0.02em; }
        .stats-row { display: flex; gap: 2.5rem; flex-wrap: wrap; }
        .stat { text-align: right; }
        .stat-num { font-family: 'Cormorant Garamond', serif; font-size: 2.6rem; font-weight: 500; color: #2c2420; line-height: 1; }
        .stat-label { font-size: 12px; color: #7a6a60; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 4px; }
        .category-bar { padding: 1.25rem 5vw; border-bottom: 1px solid #e8e0d5; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .cat-pill { padding: 8px 20px; border-radius: 30px; border: 1px solid #d9cfc7; background: transparent; font-family: 'Jost', sans-serif; font-size: 13px; color: #5a4a40; cursor: pointer; transition: all 0.15s; text-transform: capitalize; letter-spacing: 0.03em; }
        .cat-pill.active { background: #2c2420; color: #f7f3ee; border-color: #2c2420; }
        .cat-pill:hover:not(.active) { border-color: #b0a090; color: #2c2420; }
        .content { padding: 2.5rem 5vw 5rem; }
        .section-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.75rem; }
        .section-title { font-family: 'Cormorant Garamond', serif; font-size: 1.8rem; font-weight: 500; color: #2c2420; }
        .section-count { font-size: 14px; color: #7a6a60; letter-spacing: 0.03em; }
        .upload-zone { border: 1.5px dashed #c9bdb3; border-radius: 18px; padding: 2.2rem 2.5rem; text-align: center; cursor: pointer; transition: all 0.2s; background: #fff9f6; margin-bottom: 2.5rem; }
        .upload-zone:hover, .upload-zone.drag { border-color: #c17b5c; background: #fdf0e8; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 22px; }
        .card { background: #fff; border-radius: 18px; overflow: hidden; position: relative; border: 1px solid #ede5dc; transition: transform 0.25s, box-shadow 0.25s; }
        .card:hover { transform: translateY(-5px); box-shadow: 0 16px 48px rgba(44,36,32,0.11); }
        .card:hover .del-btn { opacity: 1; transform: scale(1); }
        .del-btn { position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.95); border: none; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; opacity: 0; transform: scale(0.8); transition: all 0.2s; color: #555; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
        .del-btn:hover { background: #e05555; color: #fff; }
        .card-body { padding: 14px 16px 18px; }
        .card-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 500; color: #2c2420; margin-bottom: 5px; text-transform: capitalize; }
        .card-desc { font-size: 13px; color: #7a6a60; line-height: 1.55; margin-bottom: 10px; }
        .tags { display: flex; gap: 5px; flex-wrap: wrap; }
        .tag { font-size: 12px; padding: 4px 12px; border-radius: 20px; background: #f4ede7; color: #7a5040; }
        .empty { text-align: center; padding: 5rem 0; }
        .empty p { color: #7a6a60; font-size: 15px; margin-top: 12px; }
      `}</style>

      <nav className="navbar">
        <div className="logo" onClick={() => router.push('/')}>dres<em>s</em>ed</div>
        <div className="nav-right">
          <button className="nav-link" onClick={() => router.push('/profile')}>Profile</button>
          <button className="nav-link" onClick={() => router.push('/chat')}>✦ Stylist</button>
          <button className="nav-pill" onClick={() => router.push('/outfit')}>✨ What should I wear?</button>
          <button className="nav-link" onClick={handleSignOut}>Sign out</button>
        </div>
      </nav>

      <section className="hero">
        <div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}>{greeting}, {userName}.</h1>
          <p className="hero-sub">Here's your wardrobe — {items.length} pieces and counting.</p>
        </div>
        <div className="stats-row">
          <div className="stat">
            <div className="stat-num">{items.length}</div>
            <div className="stat-label">Total pieces</div>
          </div>
          {categoryStats.slice(0, 3).map(s => (
            <div key={s.name} className="stat">
              <div className="stat-num">{s.count}</div>
              <div className="stat-label">{s.name}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="category-bar">
        {CATEGORIES.map(cat => (
          <button key={cat} className={`cat-pill ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
            {cat}
          </button>
        ))}
      </div>

      <main className="content">
        <div
          className={`upload-zone ${dragOver ? 'drag' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
        >
          <input type="file" accept="image/*" style={{ display: 'none' }} id="file-input"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
            {uploading ? (
              <>
                <p style={{ fontSize: '1.8rem', marginBottom: '10px' }}>✨</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: '#c17b5c' }}>AI is analyzing your piece...</p>
                <p style={{ color: '#7a6a60', fontSize: '13px', marginTop: '6px' }}>Identifying color, style & tags</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '1.8rem', marginBottom: '10px' }}>📸</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: '#5a4a40' }}>Add a new piece</p>
                <p style={{ color: '#7a6a60', fontSize: '13px', marginTop: '6px' }}>Drop a photo or click to browse · AI auto-tags everything</p>
              </>
            )}
          </label>
        </div>

        <div className="section-header">
          <span className="section-title">{activeCategory === 'all' ? 'All pieces' : activeCategory}</span>
          <span className="section-count">{filtered.length} items</span>
        </div>

        <div className="grid">
          {filtered.map(item => (
            <div key={item.id} className="card">
              <button className="del-btn" onClick={() => handleDelete(item.id)}>×</button>
              <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '260px', objectFit: 'cover' }} />
              <div className="card-body">
                <p className="card-name">{item.name}</p>
                <p className="card-desc">{item.ai_description}</p>
                <div className="tags">
                  <span className="tag">{item.category}</span>
                  <span className="tag">{item.color}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && !uploading && (
          <div className="empty">
            <p style={{ fontSize: '2.5rem' }}>🪞</p>
            <p>{activeCategory === 'all' ? 'Your wardrobe is empty — add your first piece!' : `No ${activeCategory} yet`}</p>
          </div>
        )}
      </main>
    </>
  )
}
