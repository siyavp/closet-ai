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
  const router = useRouter()

  useEffect(() => { checkUser() }, [])
  useEffect(() => {
    setFiltered(activeCategory === 'all' ? items : items.filter(i => i.category === activeCategory))
  }, [activeCategory, items])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user.id)
    fetchItems(user.id)
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f7f3ee; font-family: 'Jost', sans-serif; min-height: 100vh; }
        .app-header { background: #f7f3ee; border-bottom: 1px solid #e8e0d5; padding: 0 4rem; display: flex; align-items: center; justify-content: space-between; height: 64px; position: sticky; top: 0; z-index: 10; } 
        .logo { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 600; color: #2c2420; letter-spacing: 0.02em; }
        .logo span { color: #c17b5c; }
        .nav-actions { display: flex; gap: 10px; align-items: center; }
        .btn-primary { background: #2c2420; color: #f7f3ee; border: none; padding: 9px 20px; border-radius: 30px; font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 400; cursor: pointer; letter-spacing: 0.03em; transition: background 0.2s; }
        .btn-primary:hover { background: #c17b5c; }
        .btn-ghost { background: transparent; color: #7a6a60; border: 1px solid #d9cfc7; padding: 8px 18px; border-radius: 30px; font-family: 'Jost', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .btn-ghost:hover { border-color: #9a8a80; color: #2c2420; }
        .filter-bar { display: flex; gap: 8px; flex-wrap: wrap; margin: 1.5rem 0; }
        .filter-pill { padding: 6px 18px; border-radius: 30px; border: 1px solid #d9cfc7; background: transparent; font-family: 'Jost', sans-serif; font-size: 12px; color: #7a6a60; cursor: pointer; transition: all 0.15s; text-transform: capitalize; letter-spacing: 0.04em; }
        .filter-pill.active { background: #c17b5c; color: #fff; border-color: #c17b5c; }
        .filter-pill:hover:not(.active) { border-color: #b0a090; color: #2c2420; }
        .upload-zone { border: 1.5px dashed #c9bdb3; border-radius: 20px; padding: 2.5rem; text-align: center; cursor: pointer; transition: all 0.2s; background: #fff9f5; margin-bottom: 0.5rem; }
        .upload-zone.drag, .upload-zone:hover { border-color: #c17b5c; background: #fdf0e8; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
        .card { background: #fff; border-radius: 18px; overflow: hidden; position: relative; transition: transform 0.25s ease, box-shadow 0.25s ease; border: 1px solid #f0e8e0; }
        .card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(44,36,32,0.12); }
        .card:hover .del-btn { opacity: 1; transform: scale(1); }
        .del-btn { position: absolute; top: 10px; right: 10px; width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,0.95); border: none; cursor: pointer; font-size: 15px; display: flex; align-items: center; justify-content: center; opacity: 0; transform: scale(0.8); transition: all 0.2s; color: #666; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
        .del-btn:hover { background: #e05555; color: #fff; }
        .card-body { padding: 14px 16px 16px; }
        .card-name { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 500; color: #2c2420; margin-bottom: 4px; text-transform: capitalize; }
        .card-desc { font-size: 12px; color: #9a8a80; line-height: 1.5; margin-bottom: 10px; }
        .tags { display: flex; gap: 5px; flex-wrap: wrap; }
        .tag { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: #f4ede7; color: #9a6a50; letter-spacing: 0.02em; }
        .section-title { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; color: #9a8a80; font-weight: 400; letter-spacing: 0.05em; }
        .empty-state { text-align: center; padding: 5rem 0; }
        .empty-state p { color: #b0a090; font-size: 14px; margin-top: 12px; }
      `}</style>

      <header className="app-header">
        <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>dres<span>s</span>ed</div>
        <div className="nav-actions">
          <button className="btn-primary" onClick={() => router.push('/outfit')}>✨ What should I wear?</button>
          <button className="btn-ghost" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

     <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 3rem 4rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.8rem', fontWeight: '500', color: '#2c2420', lineHeight: 1 }}>My Closet</h1>
            <p style={{ color: '#b0a090', fontSize: '13px', marginTop: '6px', letterSpacing: '0.03em' }}>{items.length} pieces in your wardrobe</p>
          </div>
        </div>

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
              <div>
                <p style={{ fontSize: '1.8rem', marginBottom: '10px' }}>✨</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: '#c17b5c' }}>AI is analyzing your piece...</p>
                <p style={{ color: '#b0a090', fontSize: '12px', marginTop: '4px' }}>Identifying colors, style & tags</p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '1.8rem', marginBottom: '10px' }}>📸</p>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: '#5a4a40' }}>Add a piece to your wardrobe</p>
                <p style={{ color: '#b0a090', fontSize: '12px', marginTop: '4px' }}>Drop a photo or click to browse • AI auto-tags everything</p>
              </div>
            )}
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <span className="section-title">{activeCategory === 'all' ? 'All pieces' : activeCategory} — {filtered.length}</span>
          <div className="filter-bar" style={{ margin: 0 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} className={`filter-pill ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
            ))}
          </div>
        </div>

        <div className="grid" style={{ marginTop: '1.25rem' }}>
          {filtered.map(item => (
            <div key={item.id} className="card">
              <button className="del-btn" onClick={() => handleDelete(item.id)}>×</button>
              <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
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
          <div className="empty-state">
            <p style={{ fontSize: '2.5rem' }}>🪞</p>
            <p>{activeCategory === 'all' ? 'Your wardrobe is empty — add your first piece!' : `No ${activeCategory} yet`}</p>
          </div>
        )}
      </main>
    </>
  )
}
