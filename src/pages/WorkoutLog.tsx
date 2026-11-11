import { useEffect, useState } from 'react'
import { Plus, Save, Trash2, Dumbbell, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { starterExercises } from '../lib/data'

type Ex={id:string;name:string}
type SetRow={weight:string;reps:string}
export default function WorkoutLog(){
 const [exercises,setExercises]=useState<Ex[]>(starterExercises.map(e=>({id:e.id,name:e.name})))
 const [title,setTitle]=useState('Workout session');const [date,setDate]=useState(new Date().toISOString().slice(0,10));const [duration,setDuration]=useState('60')
 const [selected,setSelected]=useState('');const [notes,setNotes]=useState('')
 const [rows,setRows]=useState<{key:number;exercise_id:string;sets:SetRow[]}[]>([])
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');let nextKey=1
 useEffect(()=>{if(!supabase)return;let alive=true;supabase.from('exercises').select('id,name').order('name').then(({data})=>{if(alive&&data?.length)setExercises(data)});return()=>{alive=false}},[])
 function addExercise(){if(!selected)return;setRows(r=>[...r,{key:Date.now()+nextKey++,exercise_id:selected,sets:[{weight:'',reps:''},{weight:'',reps:''},{weight:'',reps:''}]}]);setSelected('')}
 function patchSet(key:number,index:number,field:keyof SetRow,value:string){setRows(prev=>prev.map(r=>r.key===key?{...r,sets:r.sets.map((s,i)=>i===index?{...s,[field]:value}:s)}:r))}
 function addSet(key:number){setRows(prev=>prev.map(r=>r.key===key?{...r,sets:[...r.sets,{weight:'',reps:''}]}:r))}
 async function save(){if(!supabase){setMessage('Supabase belum dikonfigurasi; data belum disimpan.');return}if(!rows.length){setMessage('Tambahkan setidaknya satu gerakan.');return}
 setBusy(true);setMessage('')
 try{const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('Sesi login tidak ditemukan.')
 const {data:session,error}=await supabase.from('workout_sessions').insert({user_id:user.id,performed_at:new Date(`${date}T12:00:00`).toISOString(),notes:title+(notes?` — ${notes}`:''),duration_minutes:duration?Number(duration):null}).select('id').single()
 if(error)throw error
 for(let i=0;i<rows.length;i++){const r=rows[i];const {data:ex,error:exError}=await supabase.from('workout_session_exercises').insert({session_id:session.id,exercise_id:r.exercise_id,order_index:i}).select('id').single();if(exError)throw exError
 const valid=r.sets.filter(s=>s.weight!==''&&s.reps!=='').map((s,i)=>({session_exercise_id:ex.id,set_number:i+1,weight_kg:Number(s.weight),reps:Number(s.reps)}))
 if(valid.length){const {error:e}=await supabase.from('workout_sets').insert(valid);if(e)throw e}}
 setMessage('Sesi latihan berhasil disimpan.');setRows([]);setNotes('');setTitle('Workout session')
 }catch(e){setMessage(e instanceof Error?`Gagal menyimpan: ${e.message}`:'Gagal menyimpan sesi latihan.')}finally{setBusy(false)}}
 const totalSets=rows.reduce((sum,r)=>sum+r.sets.filter(s=>s.weight!==''&&s.reps!=='').length,0)
 return <div className="page-stack"><div className="page-title-row"><div><div className="eyebrow">LOG EVERY REP / 04</div><h1>Catat latihan<span className="accent-period">.</span></h1><p className="muted">Simpan beban, repetisi, dan catatan setiap sesi.</p></div><div className="log-counter"><strong>{totalSets}</strong><span>set terisi</span></div></div>
 <div className="log-layout"><section className="panel log-form"><div className="panel-head"><div><h3>Detail sesi</h3><p className="muted">Isi informasi latihan hari ini.</p></div></div><label>Nama sesi<input className="form-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Contoh: Push day"/></label><div className="form-two"><label>Tanggal<input className="form-input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Durasi (menit)<input className="form-input" type="number" min="1" value={duration} onChange={e=>setDuration(e.target.value)}/></label></div><label>Catatan sesi<textarea className="form-input" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Energi, teknik, atau catatan lain..."/></label><div className="add-exercise-row"><select className="form-input" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Pilih gerakan</option>{exercises.map(e=><option value={e.id} key={e.id}>{e.name}</option>)}</select><button className="btn-secondary" onClick={addExercise}><Plus size={16}/> Tambah</button></div></section>
 <section className="panel log-sets"><div className="panel-head"><div><h3>Gerakan & set</h3><p className="muted">Masukkan berat dalam kilogram.</p></div><span className="subtle-label">{rows.length} GERAKAN</span></div>
 {rows.length===0?<div className="empty-state compact"><div className="empty-icon"><Dumbbell size={22}/></div><strong>Belum ada gerakan</strong><p>Pilih gerakan lalu tambahkan ke sesi ini.</p></div>:rows.map((r,i)=><div className="set-exercise" key={r.key}><div className="set-exercise-head"><div><span className="eyebrow">EXERCISE / {String(i+1).padStart(2,'0')}</span><h4>{exercises.find(e=>e.id===r.exercise_id)?.name||'Gerakan'}</h4></div><button className="icon-button danger" title="Hapus gerakan" onClick={()=>setRows(prev=>prev.filter(x=>x.key!==r.key))}><Trash2 size={16}/></button></div><div className="set-table-head"><span>SET</span><span>BEBAN (KG)</span><span>REPS</span><span/></div>{r.sets.map((s,idx)=><div className="set-input-row" key={idx}><span className="set-number">{String(idx+1).padStart(2,'0')}</span><input type="number" min="0" step="0.5" value={s.weight} onChange={e=>patchSet(r.key,idx,'weight',e.target.value)} placeholder="0"/><input type="number" min="1" step="1" value={s.reps} onChange={e=>patchSet(r.key,idx,'reps',e.target.value)} placeholder="0"/><button className="icon-button" title="Hapus set" onClick={()=>setRows(prev=>prev.map(x=>x.key===r.key?{...x,sets:x.sets.filter((_,j)=>j!==idx)}:x))}><Trash2 size={15}/></button></div>)}<button className="add-set" onClick={()=>addSet(r.key)}><Plus size={14}/> Tambah set</button></div>)}
 <div className="save-session"><div><strong>{totalSets} set terisi</strong><span>Set kosong tidak disimpan.</span></div><button className="btn-primary" onClick={save} disabled={busy}><Save size={16}/>{busy?'Menyimpan...':'Simpan sesi'}</button></div></section></div>
 {message&&<div className="notice planner-message"><CheckCircle2 size={17}/>{message}</div>}
 </div>
}
