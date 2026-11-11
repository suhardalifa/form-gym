import { useEffect, useState } from 'react'
import { CalendarDays, Check, Circle, Plus, Save, Trash2 } from 'lucide-react'
import { DAY_NAMES } from '../lib/types'
import { supabase } from '../lib/supabase'

type DayRow={id?:string;day_of_week:number;is_rest_day:boolean;title:string;exercise_ids:string[]}
const initial=()=>DAY_NAMES.map((_,i)=>({day_of_week:i+1,is_rest_day:i===6,title:i===6?'Rest day':'',exercise_ids:[]} as DayRow))
export default function Planner(){
 const [days,setDays]=useState<DayRow[]>(initial()); const [exerciseOptions,setExerciseOptions]=useState<{id:string;name:string}[]>([])
 const [saving,setSaving]=useState(false);const [message,setMessage]=useState('')
 useEffect(()=>{if(!supabase)return;let alive=true
 async function load(){const {data:{user}}=await supabase!.auth.getUser();if(!user)return
 const [{data:d},{data:e}]=await Promise.all([supabase!.from('workout_plan_days').select('id,day_of_week,is_rest_day,title,workout_plan_exercises(exercise_id)').eq('user_id',user.id),supabase!.from('exercises').select('id,name').order('name')])
 if(alive){if(e)setExerciseOptions(e);if(d?.length){const map=new Map(d.map(x=>[x.day_of_week,x]));setDays(initial().map(day=>{const row=map.get(day.day_of_week);return row?{id:row.id,day_of_week:row.day_of_week,is_rest_day:row.is_rest_day,title:row.title||'',exercise_ids:(row.workout_plan_exercises||[]).map((x:{exercise_id:string})=>x.exercise_id)}:day}))}}
 }load();return()=>{alive=false}},[])
 function update(i:number,patch:Partial<DayRow>){setDays(prev=>prev.map((d,j)=>j===i?{...d,...patch}:d))}
 async function save(){if(!supabase){setMessage('Hubungkan Supabase untuk menyimpan planner secara online.');return}
 setSaving(true);setMessage('')
 try{const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('Sesi login tidak ditemukan.')
  const {data:old}=await supabase.from('workout_plan_days').select('id').eq('user_id',user.id)
  const ids=(old||[]).map(x=>x.id)
  if(ids.length){const {error}=await supabase.from('workout_plan_exercises').delete().in('plan_day_id',ids);if(error)throw error;const {error:e}=await supabase.from('workout_plan_days').delete().in('id',ids);if(e)throw e}
  const {data:inserted,error}=await supabase.from('workout_plan_days').insert(days.map(d=>({user_id:user.id,day_of_week:d.day_of_week,is_rest_day:d.is_rest_day,title:d.title}))).select('id,day_of_week')
  if(error)throw error
  const rows=(inserted||[]).flatMap(d=>{const day=days.find(x=>x.day_of_week===d.day_of_week)!;return day.exercise_ids.map((exercise_id,index)=>({plan_day_id:d.id,exercise_id,order_index:index,target_sets:3,target_reps:'8-12'}))})
  if(rows.length){const {error:e}=await supabase.from('workout_plan_exercises').insert(rows);if(e)throw e}
  setMessage('Planner berhasil disimpan ke Supabase.')
 }catch(e){setMessage(e instanceof Error?e.message:'Gagal menyimpan planner.')}finally{setSaving(false)}}
 return <div className="page-stack"><div className="page-title-row"><div><div className="eyebrow">PLAN YOUR WEEK / 03</div><h1>Planner mingguan<span className="accent-period">.</span></h1><p className="muted">Susun rutinitas yang realistis, termasuk waktu pemulihan.</p></div><button className="btn-primary" onClick={save} disabled={saving}><Save size={17}/>{saving?'Menyimpan...':'Simpan rencana'}</button></div>
 <div className="planner-note"><CalendarDays size={20}/><div><strong>Consistency over intensity.</strong><p>Jadwalkan latihan sesuai kemampuanmu. Hari istirahat adalah bagian dari progres.</p></div></div>
 <div className="planner-list">{days.map((d,i)=><section className={`planner-day ${d.is_rest_day?'is-rest':''}`} key={d.day_of_week}><div className="day-number">{String(i+1).padStart(2,'0')}</div><div className="day-main"><div className="day-head"><h3>{DAY_NAMES[i]}</h3><label className="toggle-label"><input type="checkbox" checked={d.is_rest_day} onChange={e=>update(i,{is_rest_day:e.target.checked,exercise_ids:e.target.checked?[]:d.exercise_ids})}/><span className="toggle-ui"/><span>Rest day</span></label></div><input className="day-title-input" value={d.title} onChange={e=>update(i,{title:e.target.value})} placeholder={d.is_rest_day?'Pemulihan / mobilitas ringan':'Contoh: Upper body / Push day'} disabled={d.is_rest_day}/>{!d.is_rest_day&&<div className="day-exercises"><div className="exercise-pills">{d.exercise_ids.map(id=><span className="exercise-pill" key={id}>{exerciseOptions.find(e=>e.id===id)?.name||id}<button title="Hapus" onClick={()=>update(i,{exercise_ids:d.exercise_ids.filter(x=>x!==id)})}>×</button></span>)}</div><select value="" onChange={e=>{if(e.target.value&&!d.exercise_ids.includes(e.target.value))update(i,{exercise_ids:[...d.exercise_ids,e.target.value]})}}><option value="">+ Tambah gerakan dari katalog</option>{exerciseOptions.filter(e=>!d.exercise_ids.includes(e.id)).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>{exerciseOptions.length===0&&<small className="muted">Daftar gerakan online muncul setelah SQL seed dijalankan.</small>}</div>}</div><div className="day-status">{d.is_rest_day?<span className="rest-pill"><Circle size={12}/> Recovery</span>:<span className="train-pill"><Check size={12}/> Training</span>}</div></section>)}</div>
 {message&&<div className="notice planner-message">{message}</div>}
 <div className="planner-footer"><span><Plus size={15}/> 7 hari tersedia setiap minggu</span><button className="btn-secondary" onClick={()=>setDays(initial())}><Trash2 size={15}/> Reset ke awal</button></div>
 </div>
}
