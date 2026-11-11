import { useState } from 'react'
import { Dumbbell, ArrowRight, Mail, Lock, UserRound } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AuthPanel({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) { setMessage('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local.'); return }
    setBusy(true); setMessage('')
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        if (error) throw error
        setMessage('Pendaftaran dikirim. Jika konfirmasi email aktif, buka email untuk mengonfirmasi akun sebelum login.')
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onDone()
      }
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan autentikasi.') }
    finally { setBusy(false) }
  }
  return <div className="auth-wrap">
    <div className="auth-brand"><div className="brand-mark"><Dumbbell size={22}/></div><span>FORM</span><span className="brand-dot">.</span></div>
    <div className="auth-copy"><span className="eyebrow">YOUR PERSONAL GYM COMPANION</span><h1>Build strength.<br/><em>Track progress.</em></h1><p>Rencanakan latihan, pelajari otot, dan lihat progresmu—satu sesi dalam satu waktu.</p>
      <div className="auth-points"><span>01 / Rencana mingguan</span><span>02 / Log latihan</span><span>03 / Progres terukur</span></div>
    </div>
    <form className="auth-card" onSubmit={submit}>
      <div className="auth-tabs"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => {setMode('login');setMessage('')}}>Masuk</button><button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => {setMode('signup');setMessage('')}}>Buat akun</button></div>
      <h2>{mode === 'login' ? 'Selamat datang kembali' : 'Mulai perjalananmu'}</h2><p className="muted">Gunakan akun FORM untuk menyimpan data latihanmu.</p>
      {mode === 'signup' && <label>Nama lengkap<div className="input-wrap"><UserRound size={17}/><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Nama kamu"/></div></label>}
      <label>Email<div className="input-wrap"><Mail size={17}/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com"/></div></label>
      <label>Password<div className="input-wrap"><Lock size={17}/><input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 6 karakter"/></div></label>
      {message && <div className="notice">{message}</div>}
      <button className="btn-primary full" disabled={busy}>{busy ? 'Memproses...' : mode === 'login' ? 'Masuk ke FORM' : 'Buat akun'} <ArrowRight size={17}/></button>
      <p className="auth-legal">Dengan melanjutkan, kamu menyetujui penggunaan data latihan untuk akunmu.</p>
    </form>
    <div className="auth-foot"><span>© FORM FITNESS</span><span>MOVE WITH INTENTION</span></div>
  </div>
}
