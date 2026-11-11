import { useEffect, useMemo, useState } from 'react'
import { Search, PlayCircle, ChevronRight, Dumbbell, X, ExternalLink } from 'lucide-react'
import { starterExercises, starterMuscles } from '../lib/data'
import type { Exercise, Muscle } from '../lib/types'
import { supabase } from '../lib/supabase'

export default function Muscles() {
 const [muscles,setMuscles]=useState<Muscle[]>(starterMuscles)
 const [exercises,setExercises]=useState<Exercise[]>(starterExercises)
 const [search,setSearch]=useState('')
 const [selected,setSelected]=useState<Muscle|null>(null)
 const [video,setVideo]=useState<Exercise|null>(null)
 useEffect(()=>{ if(!supabase)return; let alive=true
  async function load(){const [{data:m},{data:e}]=await Promise.all([supabase!.from('muscle_groups').select('*').order('name'),supabase!.from('exercises').select('*,muscles:muscle_groups(*)').order('name')]);if(alive){if(m?.length)setMuscles(m as Muscle[]);if(e?.length)setExercises(e as Exercise[])}}
  load();return()=>{alive=false}
 },[])
 const filtered=useMemo(()=>muscles.filter(m=>`${m.name} ${m.description}`.toLowerCase().includes(search.toLowerCase())),[muscles,search])
 const related=selected ? exercises.filter(e=>e.muscle_group_id===selected.id || e.muscles?.id===selected.id) : []
 return <div className="page-stack"><div className="page-title-row"><div><div className="eyebrow">KNOW YOUR BODY / 02</div><h1>Katalog otot<span className="accent-period">.</span></h1><p className="muted">Kenali fungsi otot dan gerakan yang melatihnya.</p></div></div>
 <div className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari kelompok otot..."/></div>
 <div className="muscle-grid">{filtered.map((m,i)=><button className={`muscle-card muscle-tone-${i%6}`} key={m.id} onClick={()=>setSelected(m)}><div className="muscle-card-top"><span className="muscle-index">MUSCLE GROUP / 0{i+1}</span><span className="circle-arrow"><ChevronRight size={17}/></span></div><div className="muscle-illustration"><div className="muscle-shape"><Dumbbell size={36}/></div></div><h3>{m.name}</h3><p>{m.description}</p><div className="muscle-card-foot"><span>{exercises.filter(e=>e.muscle_group_id===m.id||e.muscles?.id===m.id).length} gerakan contoh</span><span className="learn-link">Pelajari <ChevronRight size={14}/></span></div></button>)}</div>
 <section className="panel exercise-library"><div className="panel-head"><div><span className="eyebrow">MOVEMENT LIBRARY</span><h3>Contoh gerakan</h3><p className="muted">Video hanya ditampilkan jika URL tersedia dan valid.</p></div></div><div className="exercise-grid">{exercises.map(e=><div className="exercise-row" key={e.id}><div className="exercise-thumb"><Dumbbell size={22}/></div><div className="exercise-copy"><strong>{e.name}</strong><span>{e.muscles?.name || muscles.find(m=>m.id===e.muscle_group_id)?.name || 'Kelompok otot' } · {e.equipment}</span></div><button className="icon-button" title="Detail gerakan" onClick={()=>setVideo(e)}><PlayCircle size={20}/></button></div>)}</div></section>
 {selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="modal-card" onClick={e=>e.stopPropagation()}><button className="modal-close icon-button" onClick={()=>setSelected(null)}><X size={19}/></button><span className="eyebrow">MUSCLE GUIDE</span><h2>{selected.name}</h2><p>{selected.description}</p><h4>Fungsi utama</h4><p>{selected.function}</p><h4>Fokus latihan</h4><p>{selected.focus}</p><h4>Gerakan terkait</h4>{related.length?related.map(e=><button className="related-exercise" key={e.id} onClick={()=>{setSelected(null);setVideo(e)}}>{e.name}<ChevronRight size={16}/></button>):<p className="muted">Belum ada gerakan yang terhubung.</p>}</div></div>}
 {video&&<div className="modal-backdrop" onClick={()=>setVideo(null)}><div className="modal-card" onClick={e=>e.stopPropagation()}><button className="modal-close icon-button" onClick={()=>setVideo(null)}><X size={19}/></button><span className="eyebrow">MOVEMENT DETAIL</span><h2>{video.name}</h2><p>{video.description}</p><div className="detail-tags"><span>{video.equipment}</span><span>{video.difficulty}</span></div><h4>Langkah gerakan</h4><ol className="instruction-list">{video.instructions?.map((s,i)=><li key={i}>{s}</li>)}</ol>
{video.video_url && video.video_provider === 'local' ? (
  <div className="video-frame">
    <video
      src={video.video_url}
      controls
      playsInline
      preload="metadata"
      className="w-full aspect-video rounded-xl bg-black object-contain"
    >
      Browser kamu tidak mendukung pemutar video.
    </video>
  </div>
) : video.video_url && isSafeVideoUrl(video.video_url) ? (
  <div className="video-frame">
    {video.video_provider === 'youtube' &&
    youtubeEmbed(video.video_url) ? (
      <iframe
        src={youtubeEmbed(video.video_url)!}
        title={`Video ${video.name}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    ) : (
      <a
        className="video-external"
        href={video.video_url}
        target="_blank"
        rel="noreferrer"
      >
        Buka video latihan
        <ExternalLink size={16} />
      </a>
    )}
  </div>
) : (
  <div className="video-placeholder">
    <PlayCircle size={26} />
    <strong>Video belum ditambahkan</strong>
    <span>
      Admin dapat mengisi video_url dari dashboard Supabase.
    </span>
  </div>
)}
</div></div>}
 </div>
}
function isSafeVideoUrl(value:string){try{const u=new URL(value);return ['https:'].includes(u.protocol)}catch{return false}}
function youtubeEmbed(value:string){try{const u=new URL(value);let id='';if(u.hostname==='youtu.be')id=u.pathname.slice(1);else if(u.hostname.endsWith('youtube.com'))id=u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).pop()||'';return id?`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`:null}catch{return null}}
