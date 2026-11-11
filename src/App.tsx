import { useEffect, useState } from 'react'
import { Bell, ChevronDown, Menu, Search, X } from 'lucide-react'
import AuthPanel from './components/AuthPanel'
import Sidebar, { type Page } from './components/Sidebar'
import Overview from './pages/Overview'
import Muscles from './pages/Muscles'
import Planner from './pages/Planner'
import WorkoutLog from './pages/WorkoutLog'
import Progress from './pages/Progress'
import { hasSupabaseConfig, supabase } from './lib/supabase'

const pageTitles:Record<Page,string>={overview:'Ringkasan',muscles:'Katalog otot',planner:'Planner mingguan',log:'Catat latihan',progress:'Progres'}
export default function App(){
 const [user,setUser]=useState<{email:string;name:string}|null>(null)
 const [authReady,setAuthReady]=useState(false)
 const [page,setPage]=useState<Page>('overview')
 const [mobileNav,setMobileNav]=useState(false)
 useEffect(()=>{if(!supabase){setAuthReady(true);return}
  supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user?{email:session.user.email||'',name:session.user.user_metadata?.full_name||''}:null);setAuthReady(true)})
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user?{email:session.user.email||'',name:session.user.user_metadata?.full_name||''}:null))
  return()=>subscription.unsubscribe()
 },[])
 async function signOut(){if(supabase)await supabase.auth.signOut();setUser(null)}
 if(!authReady)return <div className="loading-screen"><div className="brand-mark">F</div><span>Menyiapkan FORM...</span></div>
 if(!user)return <><AuthPanel onDone={()=>{}}/>{!hasSupabaseConfig&&<div className="config-ribbon">MODE SETUP · Supabase belum terhubung. Baca README untuk konfigurasi backend.</div>}</>
 const pageComponent=page==='overview'?<Overview name={user.name.split(' ')[0]} setPage={setPage}/>:page==='muscles'?<Muscles/>:page==='planner'?<Planner/>:page==='log'?<WorkoutLog/>:<Progress/>
 return <div className="app-shell">{mobileNav&&<div className="mobile-overlay" onClick={()=>setMobileNav(false)}><button className="mobile-close" onClick={e=>{e.stopPropagation();setMobileNav(false)}}><X/></button></div>}<div className={mobileNav?'sidebar-holder mobile-open':'sidebar-holder'}><Sidebar page={page} setPage={p=>{setPage(p);setMobileNav(false)}} email={user.email} onSignOut={signOut}/></div>
 <main className="main-area"><header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" onClick={()=>setMobileNav(true)}><Menu size={20}/></button><span className="breadcrumb">Workspace</span><span className="breadcrumb-slash">/</span><strong>{pageTitles[page]}</strong></div><div className="topbar-right"><div className="date-chip">{new Date().toLocaleDateString('id-ID',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}</div><span className="topbar-divider"/><div className="user-chip"><div className="avatar small">{user.email.slice(0,1).toUpperCase()}</div><ChevronDown size={15}/></div></div></header><div className="page-content">{pageComponent}<footer className="app-footer"><span>FORM / PERSONAL TRAINING SYSTEM</span><span>MOVE WITH INTENTION © {new Date().getFullYear()}</span></footer></div></main></div>
}
