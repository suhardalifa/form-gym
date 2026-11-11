import { useEffect, useState } from 'react'
import { ArrowUpRight, CalendarDays, Dumbbell, Flame, Plus, Sparkles } from 'lucide-react'
import type { Page } from '../components/Sidebar'
import type { Session } from '../lib/types'
import { DAY_NAMES } from '../lib/types'
import { supabase } from '../lib/supabase'

export default function Overview({ name, setPage }: { name:string; setPage:(p:Page)=>void }) {
 const [sessions,setSessions]=useState<Session[]>([])
 const [planned,setPlanned]=useState(0)
 useEffect(()=>{ if(!supabase)return; let alive=true
   async function load(){ const {data:{user}}=await supabase!.auth.getUser(); if(!user)return
    const [{data:s},{data:p}]=await Promise.all([
      supabase!.from('workout_sessions').select('id,performed_at,notes,duration_minutes').eq('user_id',user.id).order('performed_at',{ascending:false}).limit(5),
      supabase!.from('workout_plan_days').select('id,is_rest_day').eq('user_id',user.id).eq('is_rest_day',false)
    ])
    if(alive){setSessions((s||[]) as Session[]);setPlanned((p||[]).length)}
   } load(); return ()=>{alive=false}
 },[])
 const today = new Date()
 const mondayIndex = (today.getDay()+6)%7
 return <div className="page-stack">
  <div className="welcome-row"><div><div className="eyebrow">YOUR TRAINING SPACE</div><h1>Let’s get stronger{name ? `, ${name}` : ''}<span className="accent-period">.</span></h1><p className="muted">Konsistensi hari ini adalah kekuatanmu nanti.</p></div><button className="btn-primary" onClick={()=>setPage('log')}><Plus size={17}/> Catat latihan</button></div>
  <section className="hero-banner"><div className="hero-content"><span className="hero-tag"><Sparkles size={13}/> YOUR NEXT LEVEL STARTS HERE</span><h2>Train with purpose.<br/><em>Progress with FORM.</em></h2><p>Rencanakan sesi, catat setiap set, dan bangun kebiasaan yang bertahan lama.</p><button className="btn-dark" onClick={()=>setPage('planner')}>Lihat rencana latihan <ArrowUpRight size={16}/></button></div><div className="hero-art"><div className="hero-ring ring-one"/><div className="hero-ring ring-two"/><div className="hero-number">F<span>.</span></div><div className="hero-art-label">FORM / 001<br/>BUILT BY REPETITION</div></div></section>
  <div className="section-heading"><div><span className="eyebrow">YOUR SNAPSHOT</span><h2>Ringkasan aktivitas</h2></div><span className="subtle-label">OVERVIEW / 01</span></div>
  <div className="stats-grid"><div className="stat-card"><div className="stat-top"><span>Sesi tercatat</span><div className="stat-icon"><Dumbbell size={17}/></div></div><div className="stat-value">{sessions.length}<small> sesi terakhir</small></div><div className="stat-foot">Data dari akunmu</div></div><div className="stat-card"><div className="stat-top"><span>Hari latihan terencana</span><div className="stat-icon"><CalendarDays size={17}/></div></div><div className="stat-value">{planned}<small> hari aktif</small></div><div className="stat-foot">Dalam planner mingguan</div></div><div className="stat-card"><div className="stat-top"><span>Hari ini</span><div className="stat-icon"><Flame size={17}/></div></div><div className="stat-value">{DAY_NAMES[mondayIndex]}<small> / {today.toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}</small></div><div className="stat-foot">Satu langkah lebih baik</div></div></div>
  <div className="content-grid"><section className="panel"><div className="panel-head"><div><h3>Aktivitas terbaru</h3><p className="muted">Sesi latihan yang terakhir kamu simpan.</p></div><button className="text-button" onClick={()=>setPage('progress')}>Lihat progres <ArrowUpRight size={15}/></button></div>{sessions.length===0?<div className="empty-state"><div className="empty-icon"><Dumbbell size={22}/></div><strong>Belum ada sesi latihan</strong><p>Mulai dengan mencatat latihan pertamamu.</p><button className="btn-secondary" onClick={()=>setPage('log')}>Catat latihan pertama</button></div>:<div className="recent-list">{sessions.map(s=><div className="recent-item" key={s.id}><div className="recent-date">{new Date(s.performed_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}</div><div className="recent-info"><strong>{s.notes||'Sesi latihan'}</strong><span>{s.duration_minutes ? `${s.duration_minutes} menit` : 'Durasi tidak diisi'}</span></div><span className="status-pill">Tersimpan</span></div>)}</div>}</section>
  <section className="panel quick-panel"><div className="panel-head"><div><h3>Quick actions</h3><p className="muted">Akses fitur pentingmu.</p></div></div><button className="quick-action" onClick={()=>setPage('muscles')}><span className="quick-icon"><Dumbbell size={18}/></span><span><strong>Jelajahi katalog otot</strong><small>Pelajari anatomi & latihan</small></span><ArrowUpRight size={16}/></button><button className="quick-action" onClick={()=>setPage('planner')}><span className="quick-icon"><CalendarDays size={18}/></span><span><strong>Atur minggu ini</strong><small>Jadwalkan latihan dan rest day</small></span><ArrowUpRight size={16}/></button><button className="quick-action" onClick={()=>setPage('progress')}><span className="quick-icon"><Flame size={18}/></span><span><strong>Lihat progres</strong><small>Pantau beban dan repetisi</small></span><ArrowUpRight size={16}/></button></section></div>
 </div>
}
