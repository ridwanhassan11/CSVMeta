"use client";

// Main Metadata workspace page; shared ImageItem type lives in @/types/image.
import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import UploadCard from "@/components/UploadCard";
import ControlsPanel, { type GenerationSettings, type Provider } from "@/components/ControlsPanel";
import ApiKeyModal from "@/components/ApiKeyModal";
import PreviewGrid from "@/components/PreviewGrid";
import ResultCard from "@/components/ResultCard";
import type { ImageItem } from "@/types/image";
const DEFAULT_SETTINGS: GenerationSettings = { provider:"gemini",geminiModel:"gemini-2.5-flash",mistralModel:"pixtral-large-latest",openaiModel:"gpt-4o",openrouterModel:"google/gemini-2.5-flash",mode:"metadata",platform:"general",titleLength:140,keywordsCount:43,extraInstructions:"",parallel:false };
const EMPTY_KEYS: Record<Provider,string[]> = {gemini:[],groq:[],mistral:[],openai:[],openrouter:[]};
const KEY_STORAGE="csvmeta-provider-keys-v1", HISTORY_STORAGE="csvmeta-history-v1";
type HistoryItem={id:string;fileName:string;title?:string;prompt?:string;createdAt:string};
function csvDownload(images:ImageItem[]) {
 const rows=images.filter(x=>x.status==="done"&&x.prompt===undefined); if(!rows.length)return;
 const q=(v:string)=>'"'+v.replace(/"/g,'""')+'"';
 const data=[["Filename","Title","Description","Keywords"],...rows.map(x=>[x.file.name,x.title||"",x.description||"",(x.keywords||[]).join(", ")])];
 const blob=new Blob(["\uFEFF"+data.map(r=>r.map(q).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="metadata-export.csv";a.click();URL.revokeObjectURL(url);
}
async function prepareImageForUpload(file: File): Promise<File> {
 const bitmap = await createImageBitmap(file);
 try {
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare image for upload.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
   canvas.toBlob(value => value ? resolve(value) : reject(new Error("Image compression failed.")), "image/jpeg", 0.78);
  });
  return new File([blob], file.name.replace(/\\.(png|jpe?g|webp|avif)$/i, ".jpg"), { type: "image/jpeg", lastModified: Date.now() });
 } finally {
  bitmap.close();
 }
}
export default function HomePage(){
 const [images,setImages]=useState<ImageItem[]>([]),[selectedId,setSelectedId]=useState<string|null>(null);
 const [settings,setSettings]=useState<GenerationSettings>(DEFAULT_SETTINGS),[savedKeys,setSavedKeys]=useState<Record<Provider,string[]>>(EMPTY_KEYS);
 const [activeKeys,setActiveKeys]=useState<Partial<Record<Provider,number>>>({}),[keysOpen,setKeysOpen]=useState(false);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[history,setHistory]=useState<HistoryItem[]>([]);
 const [activeTab,setActiveTab]=useState<"Generate"|"Metadata"|"History"|"Templates"|"Settings">("Generate"),[hydrated,setHydrated]=useState(false);
 useEffect(()=>{try{const k=localStorage.getItem(KEY_STORAGE),h=localStorage.getItem(HISTORY_STORAGE);if(k)setSavedKeys({...EMPTY_KEYS,...JSON.parse(k)});if(h)setHistory(JSON.parse(h));}catch{setNotice("Could not load saved browser data.");}setHydrated(true);},[]);
 useEffect(()=>{if(hydrated)localStorage.setItem(KEY_STORAGE,JSON.stringify(savedKeys));},[hydrated,savedKeys]);
 useEffect(()=>{if(hydrated)localStorage.setItem(HISTORY_STORAGE,JSON.stringify(history.slice(0,100)));},[hydrated,history]);
 const updateSettings=useCallback((p:Partial<GenerationSettings>)=>setSettings(s=>({...s,...p})),[]);
 const updateImage=useCallback((id:string,p:Partial<ImageItem>)=>setImages(xs=>xs.map(x=>x.id===id?{...x,...p}:x)),[]);
 const addFiles=useCallback((files:File[])=>{const valid=files.filter(f=>f.type.startsWith("image/"));const added=valid.slice(0,Math.max(0,100-images.length)).map(file=>({id:crypto.randomUUID(),file,previewUrl:URL.createObjectURL(file),status:"pending" as const}));setImages(xs=>[...xs,...added]);setNotice(added.length?added.length+" image(s) added.":"Choose image files (PNG, JPG, WEBP), up to 100.");},[images.length]);
 const removeImage=useCallback((id:string)=>{setImages(xs=>{const x=xs.find(i=>i.id===id);if(x)URL.revokeObjectURL(x.previewUrl);return xs.filter(i=>i.id!==id);});setSelectedId(x=>x===id?null:x);},[]);
 const getKey=useCallback((p:Provider)=>{const a=savedKeys[p]||[],i=activeKeys[p]??a.length-1;return i>=0?a[i]||"":"";},[savedKeys,activeKeys]);
 const generateOne=useCallback(async(image:ImageItem)=>{const apiKey=getKey(settings.provider);if(!apiKey){updateImage(image.id,{status:"error",error:"Add an API key in API Keys settings."});return false;}updateImage(image.id,{status:"loading",error:undefined});
 try{const body=new FormData();const uploadFile=await prepareImageForUpload(image.file);body.append("file",uploadFile,uploadFile.name);body.append("provider",settings.provider);body.append("geminiModel",settings.geminiModel);body.append("mistralModel",settings.mistralModel);body.append("openaiModel",settings.openaiModel);body.append("openrouterModel",settings.openrouterModel);body.append("apiKey",apiKey);body.append("mode",settings.mode);body.append("platform",settings.platform);body.append("titleLength",String(settings.titleLength));body.append("keywordsCount",String(settings.keywordsCount));body.append("extraInstructions",settings.extraInstructions);
 const res=await fetch("/api/generate",{method:"POST",body});const responseText=await res.text();let result:any;try{result=JSON.parse(responseText);}catch{throw new Error(responseText.slice(0,240)||"Server returned an unreadable response. Try a smaller image.");}if(!res.ok||!result.success)throw new Error(result.error||"Generation failed.");updateImage(image.id,settings.mode==="prompt"?{status:"done",prompt:String(result.prompt||"")}:{status:"done",title:String(result.title||""),description:String(result.description||""),keywords:Array.isArray(result.keywords)?result.keywords.map(String):[]});setHistory(h=>[{id:image.id,fileName:image.file.name,title:result.title,prompt:result.prompt,createdAt:new Date().toISOString()},...h].slice(0,100));return true;}catch(e){updateImage(image.id,{status:"error",error:e instanceof Error?e.message:"Generation failed."});return false;}},[getKey,settings,updateImage]);
 const generateAll=async()=>{const pending=images.filter(x=>x.status==="pending"||x.status==="error");if(!pending.length){setNotice("নতুন ছবি যোগ করুন অথবা failed ছবিগুলো আবার চেষ্টা করুন।");return;}if(!getKey(settings.provider)){setKeysOpen(true);setNotice("Add an API key to continue.");return;}setBusy(true);let completed=images.filter(x=>x.status==="done").length;let failed=0;setNotice(`নিরাপদভাবে একটির পর একটি তৈরি হচ্ছে: ${completed}/${images.length}`);try{for(let index=0;index<pending.length;index++){const item=pending[index];setNotice(`Generating ${index+1}/${pending.length}: ${item.file.name} — আগের সম্পন্ন ফলাফল সংরক্ষিত থাকবে।`);const succeeded=await generateOne(item);if(succeeded)completed++;else failed++;if(index<pending.length-1)await new Promise(resolve=>setTimeout(resolve,3000));}}finally{setBusy(false);setNotice(`কাজ শেষ। সফল: ${completed}, ব্যর্থ: ${failed}। সফল ফলাফল মুছে ফেলা হয়নি; ব্যর্থ ছবিগুলো আবার Generate করতে পারবেন।`);}};
 const selected=useMemo(()=>images.find(x=>x.id===selectedId)||images.find(x=>x.status==="done")||null,[images,selectedId]);
 const addKey=(p:Provider,key:string)=>{setSavedKeys(k=>({...k,[p]:[...(k[p]||[]),key]}));setActiveKeys(a=>({...a,[p]:(savedKeys[p]||[]).length}));};
 const removeKey=(p:Provider,i:number)=>{setSavedKeys(k=>({...k,[p]:k[p].filter((_,n)=>n!==i)}));setActiveKeys(a=>({...a,[p]:undefined}));};
 return <div className="min-h-screen bg-[#fbfaff] text-slate-950"><Sidebar active={activeTab} onNavigate={setActiveTab}/>
 <main className="min-h-screen px-4 py-5 md:ml-[210px] md:px-5"><div className="mx-auto max-w-[1600px]">
 <header className="mb-4 flex items-center justify-between"><h1 className="text-xl font-extrabold"><span className="mr-2 text-violet-700">✦</span>{activeTab==="Generate"?"Generate Metadata":activeTab}</h1><button onClick={()=>setKeysOpen(true)} className="rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-700">API Keys</button></header>
 {activeTab==="History"?<section className="rounded-2xl border border-violet-100 bg-white p-5"><h2 className="mb-4 text-lg font-bold">Generation History</h2>{history.length?history.map(h=><article key={h.id+h.createdAt} className="border-b py-3"><b>{h.fileName}</b><p>{h.title||h.prompt}</p><small>{new Date(h.createdAt).toLocaleString()}</small></article>):<p className="text-sm text-slate-500">No history yet.</p>}</section>:activeTab==="Templates"?<section className="rounded-2xl border border-violet-100 bg-white p-5"><h2 className="font-bold">Prompt Templates</h2>{["Commercial stock photography, clear subject and natural lighting","Minimal composition with clean background","Editorial photography with authentic atmosphere"].map(t=><button key={t} onClick={()=>{updateSettings({mode:"prompt",extraInstructions:t});setActiveTab("Generate");}} className="m-2 rounded-xl border p-3 text-left">{t}</button>)}</section>:activeTab==="Settings"?<section className="rounded-2xl border border-violet-100 bg-white p-5"><h2 className="font-bold">Settings</h2><p className="my-3 text-sm text-slate-500">API keys are stored in this browser.</p><button onClick={()=>setKeysOpen(true)} className="rounded-xl bg-violet-700 px-4 py-2 text-white">Manage API Keys</button></section>:<>
 <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(430px,.92fr)]">
 <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
  <div className="relative flex h-[260px] items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
   {selected?<img src={selected.previewUrl} alt={selected.file.name} className="h-full w-full object-contain"/>:<div className="text-center text-slate-400"><div className="text-4xl">▧</div><p className="mt-2 text-sm">Upload images to preview</p></div>}
   <span className="absolute left-3 top-3 rounded-full bg-violet-700 px-3 py-1 text-xs font-semibold text-white">◉ Preview</span>
   {selected&&<span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white">{selected.file.name}</span>}
  </div>
  <div className="mt-2 flex min-h-[58px] items-center gap-2 overflow-x-auto pb-1">
   {images.map((img)=><button key={img.id} onClick={()=>setSelectedId(img.id)} className={`relative h-14 w-[74px] shrink-0 overflow-hidden rounded-lg border-2 ${selectedId===img.id?"border-violet-600":"border-transparent"}`}><img src={img.previewUrl} alt={img.file.name} className="h-full w-full object-cover"/><span className="absolute bottom-0 right-0 rounded-tl bg-black/65 px-1 text-[9px] text-white">{img.status==="done"?"✓":img.status==="error"?"!":""}</span></button>)}
   <label className="flex h-14 w-[58px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-violet-300 text-2xl text-violet-700 hover:bg-violet-50">+<input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={e=>{if(e.target.files)addFiles(Array.from(e.target.files));e.currentTarget.value="";}}/></label>
  </div>
 </section>
 <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
  <div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-slate-900 dark:text-white">⚙ Generation Settings</h2><button onClick={()=>setSettings(DEFAULT_SETTINGS)} disabled={busy} className="text-xs font-semibold text-violet-700">↻ Reset</button></div>
  <ControlsPanel settings={settings} onChange={updateSettings} onOpenKeys={()=>setKeysOpen(true)} disabled={busy}/>
  <button onClick={generateAll} disabled={!images.length||busy} className="mt-4 w-full rounded-xl bg-violet-700 px-6 py-3 font-bold text-white shadow-md shadow-violet-700/20 disabled:opacity-40">{busy?"Generating…":"✦ Generate Metadata"}</button>
 </section>
</div>
 <div className="mt-5 flex flex-wrap items-center gap-2"><span className="mr-auto text-sm text-slate-500">{images.length} image(s) uploaded</span><button onClick={()=>{images.forEach(x=>URL.revokeObjectURL(x.previewUrl));setImages([]);setSelectedId(null);}} disabled={!images.length||busy} className="rounded-lg border px-3 py-2 text-xs">Clear All</button><button onClick={()=>csvDownload(images)} disabled={!images.some(x=>x.status==="done"&&x.prompt===undefined)} className="rounded-lg bg-violet-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">↓ Export CSV</button></div>
 {notice&&<p role="status" className="my-2 text-sm text-slate-500">{notice}</p>}<PreviewGrid images={images} selectedId={selectedId} onSelect={setSelectedId} onRemove={removeImage} onUpdate={updateImage}/>{images.length>0&&<ResultCard image={selected} onUpdate={updateImage}/>}
 </>}</div></main>
 <ApiKeyModal open={keysOpen} settings={settings} onChange={updateSettings} savedKeys={savedKeys} addKey={addKey} removeKey={removeKey} setActiveKey={(p,i)=>setActiveKeys(a=>({...a,[p]:i}))} close={()=>setKeysOpen(false)}/></div>;
}