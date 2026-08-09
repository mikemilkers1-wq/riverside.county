"use client";
import {useEffect,useMemo,useState} from "react";

const FALLBACK_RULES=[
 {code:"GENERAL_RECEIPTS",name:"General Business Receipts",rate_basis_points:500,description:"Allgemeine gewerbliche Einnahmen und sonstige betriebliche Erlöse."},
 {code:"RETAIL_SALES",name:"Retail Sales",rate_basis_points:725,description:"Verkauf von Waren im Einzelhandel."},
 {code:"PROFESSIONAL_SERVICES",name:"Professional Services",rate_basis_points:450,description:"Professionelle oder beratende Dienstleistungen."},
 {code:"CONTRACTING",name:"Contracting & Construction",rate_basis_points:350,description:"Bau-, Reparatur- und Werkleistungen."},
 {code:"HOSPITALITY",name:"Hospitality & Lodging",rate_basis_points:825,description:"Beherbergung und gastgewerbliche Umsätze."},
 {code:"FOOD_BEVERAGE",name:"Food & Beverage",rate_basis_points:650,description:"Speisen, Getränke und gastronomische Umsätze."},
 {code:"ENTERTAINMENT",name:"Entertainment & Events",rate_basis_points:775,description:"Veranstaltungen, Eintritt und Unterhaltung."},
 {code:"VEHICLE_RENTAL",name:"Vehicle & Equipment Rental",rate_basis_points:900,description:"Vermietung von Fahrzeugen und Geräten."},
 {code:"PROPERTY_TRANSFER",name:"Property Transfer",rate_basis_points:125,description:"Meldepflichtige Grundstücks- und Immobilienübertragungen."},
 {code:"UTILITIES",name:"Utilities & Infrastructure",rate_basis_points:300,description:"Versorgungs- und infrastrukturelle Leistungen."},
 {code:"DIGITAL_COMMERCE",name:"Digital Commerce",rate_basis_points:525,description:"Digitale Waren, Plattform- und Onlineumsätze."},
 {code:"LUXURY_GOODS",name:"Luxury & High-Value Goods",rate_basis_points:1100,description:"Luxus- und hochwertige Waren."},
 {code:"LICENSED_ACTIVITY",name:"Licensed / Permit Activity",rate_basis_points:600,description:"Erlaubnis- oder lizenzgebundene Geschäftstätigkeit."}
];

const helpData={
 announcements:["State & County Announcements","Official public notices published through the Riverside County Government portal. Notices shown here are informational unless the notice itself states a formal legal effect."],
 governance:["County Government","Review the current Governor, cabinet, Senate and ruling party information maintained by the County network. This page is public information and does not provide administrative editing access."],
 agencies:["County Agencies","Browse agencies and departments participating in the Riverside County government network. These entries are loaded from the same shared County Governance record used by RinCEN and participating departmental terminals."],
 business:["Business Transaction Filing","Businesses can report taxable or deductible business activity using this filing form. The submission enters the shared county financial ledger and may be associated with a RinCEN Wirtschaftsprofil by the Department of Finance."],
 search:["County Search","Filter the public agency and government information currently loaded on this website. This is not a full records request or court-record search."],
 official:["Official Riverside County Website","This banner identifies the page as part of the Riverside County Government web network. Official county pages use shared government data services where indicated, but each department remains responsible for its own records and authority."]
};
function Help({topic,enabled,onOpen}){if(!enabled)return null;return <button className="info-dot" title="Information" onClick={()=>onOpen(topic)}>i</button>}
function agencyLogo(a){
 if(a?.logoPath)return a.logoPath;
 const known={rdof:"/county-governance/rdof-logo.png"};
 return known[a?.logoKey]||"/assets/county-seal.png";
}

export default function Portal(){
 const [tab,setTab]=useState("home"),[gov,setGov]=useState({agencies:[],government:{}}),[ann,setAnn]=useState([]),
 [rules,setRules]=useState(FALLBACK_RULES),[help,setHelp]=useState(false),[drawer,setDrawer]=useState(null),
 [q,setQ]=useState(""),[receipt,setReceipt]=useState(null),[selectedAgency,setSelectedAgency]=useState(null),
 [loadNotice,setLoadNotice]=useState("");

 useEffect(()=>{
   let active=true;
   Promise.allSettled([
     fetch("/api/governance",{cache:"no-store"}).then(async r=>{const p=await r.json();if(!r.ok)throw new Error(p.error||"Governance unavailable");return p}),
     fetch("/api/announcements",{cache:"no-store"}).then(async r=>{const p=await r.json();if(!r.ok)throw new Error(p.error||"Announcements unavailable");return p}),
     fetch("/api/business-filings",{cache:"no-store"}).then(async r=>{const p=await r.json();if(!r.ok)throw new Error(p.error||"Tax rules unavailable");return p})
   ]).then(results=>{
     if(!active)return;
     const [g,a,t]=results;
     if(g.status==="fulfilled")setGov(g.value.state||{agencies:[],government:{}});
     else setLoadNotice("County Governance konnte vorübergehend nicht geladen werden.");
     if(a.status==="fulfilled")setAnn(a.value.announcements||[]);
     if(t.status==="fulfilled"&&Array.isArray(t.value.rules)&&t.value.rules.length)setRules(t.value.rules);
     else setRules(FALLBACK_RULES);
   });
   return()=>{active=false};
 },[]);

 const filtered=useMemo(()=>gov.agencies.filter(a=>!q||`${a.name} ${a.abbreviation} ${a.description} ${a.administrator||""}`.toLowerCase().includes(q.toLowerCase())),[gov,q]);
 const openHelp=k=>setDrawer(helpData[k]||["Information","This area provides public Riverside County information and services."]);
 async function submitFiling(e){
   e.preventDefault();const f=new FormData(e.currentTarget);const payload=Object.fromEntries(f.entries());payload.certified=f.get("certified")==="on";
   const r=await fetch("/api/business-filings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const p=await r.json().catch(()=>({}));if(!r.ok)return alert(p.error||"Submission failed");
   setReceipt(p);e.currentTarget.reset();
 }
 function openAgency(a){setSelectedAgency(a)}
 function restartVideo(e){const v=e.currentTarget;try{v.currentTime=2;v.play().catch(()=>{})}catch{}}

 return <div className="site">
  <div className="official-bar">
    <span className="flag-css" aria-hidden="true"></span>
    <span>An official website of the Riverside County Government.</span>
    <button onClick={()=>openHelp("official")}>Here&apos;s how you know</button>
    <div className="official-right"><button onClick={()=>setHelp(v=>!v)}>{help?"Hide help":"Show help"}</button><span>Public Information</span></div>
  </div>
  <header className="public-nav"><div className="brand"><img src="/assets/county-government-seal.png" alt="Riverside County seal"/><div><strong>RIVERSIDE COUNTY</strong><span>STATE OF CALIFORNIA</span></div></div><nav>{[["home","Home"],["announcements","Announcements"],["governance","Government"],["agencies","Agencies"],["business","Business Filing"]].map(([k,l])=><button key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}>{l}</button>)}</nav></header>
  {loadNotice&&<div className="county-load-notice">{loadNotice}</div>}

  {tab==="home"&&<main><section className="hero"><video autoPlay muted playsInline loop onLoadedMetadata={e=>{if(e.currentTarget.duration>3)e.currentTarget.currentTime=2}} onTimeUpdate={e=>{const v=e.currentTarget;if(v.duration&&v.currentTime>=v.duration-.2){v.currentTime=Math.min(2,v.duration-.1);v.play().catch(()=>{})}}} onEnded={restartVideo}><source src="/assets/county-home.mp4" type="video/mp4"/></video><div className="shade"></div><div className="hero-content"><img src="/assets/county-government-seal.png" alt=""/><h1>Riverside County Government</h1><p>Public services, county agencies and official information.</p><div className="search"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search county agencies and services"/><Help topic="search" enabled={help} onOpen={openHelp}/></div><div className="hero-links"><button onClick={()=>setTab("agencies")}>Find an agency</button><button onClick={()=>setTab("announcements")}>County announcements</button><button onClick={()=>setTab("business")}>File business transaction</button></div></div></section><section className="home-grid"><article><h2>State & County Announcements <Help topic="announcements" enabled={help} onOpen={openHelp}/></h2>{ann.slice(0,3).map(a=><div className="notice" key={a.id}><small>{a.category}</small><strong>{a.title}</strong><p>{a.summary}</p></div>)}</article><article className="gov-card"><img src="/assets/county-seal.png" alt=""/><h2>County Governance</h2><p>Learn about county leadership, agencies and the administrative structure of Riverside County.</p><button onClick={()=>setTab("governance")}>View County Government →</button></article></section></main>}

  {tab==="announcements"&&<main className="content"><div className="page-title"><h1>Announcements <Help topic="announcements" enabled={help} onOpen={openHelp}/></h1><p>Official public notices and county information.</p></div><div className="notice-list">{ann.map(a=><article key={a.id}><small>{a.category} · {new Date(a.published_at).toLocaleDateString()}</small><h2>{a.title}</h2><p>{a.summary}</p>{a.body&&<p>{a.body}</p>}</article>)}</div></main>}

  {tab==="agencies"&&<main className="content"><div className="page-title"><h1>County Agencies <Help topic="agencies" enabled={help} onOpen={openHelp}/></h1><p>Departments and public bodies loaded from the shared Riverside County Governance directory.</p></div><input className="agency-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search agencies"/><div className="agency-grid">{filtered.map(a=><article key={a.id} className="agency-card" onClick={()=>openAgency(a)} tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")openAgency(a)}}><div className="agency-logo"><img src={agencyLogo(a)} onError={e=>e.currentTarget.src="/assets/county-seal.png"} alt=""/></div><small>{a.category}</small><h2>{a.name}</h2><p>{a.description}</p><dl><dt>Administrator</dt><dd>{a.administrator||"—"}</dd><dt>Extension</dt><dd>{a.extension||"—"}</dd><dt>Legal authority</dt><dd>{a.legalAuthority||"—"}</dd></dl><button type="button" className="agency-open" onClick={e=>{e.stopPropagation();openAgency(a)}}>View agency →</button></article>)}</div></main>}

  {tab==="governance"&&<main className="content"><div className="page-title"><h1>County Government <Help topic="governance" enabled={help} onOpen={openHelp}/></h1><p>Executive leadership and Riverside Senate.</p></div><section className="governor"><img src={gov.government?.governor?.portraitPath||"/assets/governor-seal.png"} onError={e=>e.currentTarget.src="/assets/governor-seal.png"} alt=""/><div><small>GOVERNOR</small><h2>{gov.government?.governor?.name||"William Bracken"}</h2><strong>{gov.government?.governor?.party||"New Founding Fathers of America"}</strong><p>{gov.government?.governor?.biography}</p></div></section><h2>State Cabinet</h2><div className="cabinet-grid">{(gov.government?.cabinet||[]).map((x,i)=><article key={i}><strong>{x.office}</strong><span>{x.name}</span></article>)}</div><h2>Riverside Senate</h2><div className="senate-grid">{(gov.government?.senate||[]).map((x,i)=><article key={i}><strong>{x.name}</strong><span>{x.party}</span><small>{x.district} · {x.committee}</small></article>)}</div></main>}

  {tab==="business"&&<main className="content"><div className="page-title"><h1>Business Transaction Filing <Help topic="business" enabled={help} onOpen={openHelp}/></h1><p>Riverside County Business Activity Return — public filing service.</p></div><form className="tax-form" onSubmit={submitFiling}><div className="form-head"><div className="form-number">RC<br/><b>BT-1040</b></div><div><small>RIVERSIDE COUNTY DEPARTMENT OF FINANCE</small><h2>Business Transaction Activity Return</h2><p>For reportable business income and deductions</p></div><div className="year">{new Date().getFullYear()}</div></div><div className="row three"><label>Business name<input name="businessName" required/></label><label>Reporter / responsible person<input name="reporterName" required/></label><label>Contact reference<input name="contact"/></label></div><div className="row three"><label>Transaction date<input name="occurredAt" type="date" required/></label><label>Activity classification<select name="categoryCode" required defaultValue=""><option value="" disabled>Select category</option>{rules.map(r=><option key={r.code} value={r.code}>{r.name} — {(Number(r.rate_basis_points)/100).toFixed(2)}%</option>)}</select><small className="field-note">{rules.length} active categories loaded</small></label><label>Entry type<select name="direction"><option value="income">Income / taxable receipt (+)</option><option value="expense">Expense / allowable deduction (−)</option></select></label></div><div className="amount-row"><span>Reportable amount</span><span>$</span><input name="amount" type="number" step="0.01" min="0.01" required/></div><label className="description">Description of transaction<textarea name="description" rows="5" placeholder="Describe the transaction, service, sale, contract, expense, or other reportable activity."/></label><div className="cert"><label><input type="checkbox" name="certified" required/> I certify that the information provided in this filing is accurate to the best of my knowledge and is submitted on behalf of the named business.</label></div><button className="submit-return">SUBMIT BUSINESS RETURN</button>{receipt&&<div className="receipt"><strong>Filing received: {receipt.reference}</strong><span>Calculated tax impact: ${Number(receipt.taxImpact).toFixed(2)}</span><span>{receipt.linkedProfile?"Automatically linked to a county financial profile.":"Awaiting RinCEN business-profile association."}</span></div>}</form></main>}

  <footer><img src="/assets/county-seal.png" alt=""/><div><strong>Riverside County Government</strong><span>State of California · Public Information Portal</span></div><span>Official county network</span></footer>

  {selectedAgency&&<div className="agency-modal" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedAgency(null)}}><article>
    <header><div><small>RIVERSIDE COUNTY AGENCY DIRECTORY</small><h2>{selectedAgency.name}</h2><span>{selectedAgency.abbreviation} · {selectedAgency.status||"—"}</span></div><button onClick={()=>setSelectedAgency(null)}>×</button></header>
    <div className="agency-modal-body"><aside><img src={agencyLogo(selectedAgency)} onError={e=>e.currentTarget.src="/assets/county-seal.png"} alt=""/></aside><section><p className="agency-modal-description">{selectedAgency.description}</p><dl><dt>Agency administrator</dt><dd>{selectedAgency.administrator||"Not entered"}</dd><dt>County extension</dt><dd>{selectedAgency.extension||"—"}</dd><dt>Category</dt><dd>{selectedAgency.category||"—"}</dd><dt>Legal authority</dt><dd>{selectedAgency.legalAuthority||"—"}</dd><dt>Status</dt><dd>{selectedAgency.status||"—"}</dd></dl>{selectedAgency.websiteUrl&&<a className="agency-website" href={selectedAgency.websiteUrl} target="_blank" rel="noreferrer">Open agency website / terminal →</a>}</section></div>
    <footer><span>Data source: County Governance Network</span><button onClick={()=>setSelectedAgency(null)}>Close</button></footer>
  </article></div>}

  {drawer&&<aside className="help-drawer"><button onClick={()=>setDrawer(null)}>×</button><small>PUBLIC ASSISTANCE</small><h2>{drawer[0]}</h2><p>{drawer[1]}</p><p>This assistance explains the website interface and does not itself create legal rights, deadlines or agency authority.</p></aside>}
 </div>;
}
