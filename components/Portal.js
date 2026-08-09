"use client";
import {useEffect,useMemo,useState} from "react";

const FALLBACK_RULES=[
 {code:"GENERAL_RECEIPTS",name:"General Business Receipts",rate_basis_points:500,description:"General commercial receipts and other ordinary operating revenue."},
 {code:"RETAIL_SALES",name:"Retail Sales",rate_basis_points:725,description:"Sales of goods to final customers through retail activity."},
 {code:"PROFESSIONAL_SERVICES",name:"Professional Services",rate_basis_points:450,description:"Professional, consulting, advisory, technical, or similar service revenue."},
 {code:"CONTRACTING",name:"Contracting & Construction",rate_basis_points:350,description:"Construction, repair, installation, and contractor activity."},
 {code:"HOSPITALITY",name:"Hospitality & Lodging",rate_basis_points:825,description:"Hotels, lodging, short-term accommodation, and related hospitality receipts."},
 {code:"FOOD_BEVERAGE",name:"Food & Beverage",rate_basis_points:650,description:"Restaurant, catering, prepared food, and beverage receipts."},
 {code:"ENTERTAINMENT",name:"Entertainment & Events",rate_basis_points:775,description:"Admissions, events, performances, recreation, and entertainment receipts."},
 {code:"VEHICLE_RENTAL",name:"Vehicle & Equipment Rental",rate_basis_points:900,description:"Rental of vehicles, machinery, equipment, and similar property."},
 {code:"PROPERTY_TRANSFER",name:"Property Transfer",rate_basis_points:125,description:"Reportable transfers of real property or qualifying property interests."},
 {code:"UTILITIES",name:"Utilities & Infrastructure",rate_basis_points:300,description:"Utility, infrastructure, network, or public-service related receipts."},
 {code:"DIGITAL_COMMERCE",name:"Digital Commerce",rate_basis_points:525,description:"Online commerce, digital products, platform activity, and electronic services."},
 {code:"LUXURY_GOODS",name:"Luxury & High-Value Goods",rate_basis_points:1100,description:"Luxury, premium, collectible, or other designated high-value goods."},
 {code:"LICENSED_ACTIVITY",name:"Licensed / Permit Activity",rate_basis_points:600,description:"Business activity conducted under a county license, permit, or regulated authorization."}
];

const helpData={
 announcements:["State & County Announcements","Official public notices published through the Riverside County Government portal. Notices shown here are informational unless the notice itself states a formal legal effect."],
 governance:["County Government","Review the current Governor, cabinet, Senate and ruling party information maintained by the County network. This page is public information and does not provide administrative editing access."],
 agencies:["County Agencies","Browse agencies and departments participating in the Riverside County government network. These entries are loaded from the same shared County Governance record used by RinCEN and participating departmental terminals."],
 business:["Business Transaction Filing","Report county business activity using a validated Riverside Taxpayer ID whenever one has been issued. The legal taxpayer name is resolved from RinCEN rather than freely entered, reducing duplicate and mismatched financial records."],
 taxes:["Taxes & Filing Guide","This page explains the county business activity classifications currently configured for public filings. It helps filers choose the closest activity type and understand the difference between reporting income and reporting an allowable business outflow."],
 search:["County Search","Filter the public agency and government information currently loaded on this website. This is not a full records request or court-record search."],
 official:["Official Riverside County Website","This banner identifies the page as part of the Riverside County Government web network. Official county pages use shared government data services where indicated, but each department remains responsible for its own records and authority."]
};

function Help({topic,enabled,onOpen}){if(!enabled)return null;return <button className="info-dot" title="Information" onClick={()=>onOpen(topic)}>i</button>}
function agencyLogo(a){
 if(a?.logoPath)return a.logoPath;
 const known={rdof:"/county-governance/rdof-logo.png"};
 return known[a?.logoKey]||"/assets/county-seal.png";
}
function rateLabel(rule){return `${(Number(rule?.rate_basis_points||0)/100).toFixed(2)}%`}
function directionHelp(direction){
 return direction==="expense"
  ?"Choose Expense only when the amount represents a reportable business outflow or allowable deduction under the applicable county schedule. The filing records the amount as a negative activity entry; it is not automatically a cash payment to the County."
  :"Choose Income when the amount represents business receipts, sales, service revenue, rental receipts, or other reportable incoming activity. The selected classification determines the county tax impact calculated for the filing.";
}

export default function Portal(){
 const [tab,setTab]=useState("home"),[gov,setGov]=useState({agencies:[],government:{}}),[ann,setAnn]=useState([]),
 [rules,setRules]=useState(FALLBACK_RULES),[help,setHelp]=useState(false),[drawer,setDrawer]=useState(null),
 [q,setQ]=useState(""),[receipt,setReceipt]=useState(null),[selectedAgency,setSelectedAgency]=useState(null),
 [loadNotice,setLoadNotice]=useState(""),[taxpayerMode,setTaxpayerMode]=useState("tin"),
 [taxpayerId,setTaxpayerId]=useState(""),[taxpayer,setTaxpayer]=useState(null),[taxpayerStatus,setTaxpayerStatus]=useState("idle"),
 [filingLines,setFilingLines]=useState([{id:1,occurredAt:"",categoryCode:"",direction:"income",amount:"",description:""}]);

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
     else setLoadNotice("County Governance could not be loaded temporarily.");
     if(a.status==="fulfilled")setAnn(a.value.announcements||[]);
     if(t.status==="fulfilled"&&Array.isArray(t.value.rules)&&t.value.rules.length)setRules(t.value.rules);
     else setRules(FALLBACK_RULES);
   });
   return()=>{active=false};
 },[]);

 const filtered=useMemo(()=>gov.agencies.filter(a=>!q||`${a.name} ${a.abbreviation} ${a.description} ${a.administrator||""}`.toLowerCase().includes(q.toLowerCase())),[gov,q]);
 const today=new Date().toISOString().slice(0,10);
 const lineRule=line=>rules.find(r=>r.code===line.categoryCode)||null;
 const updateLine=(id,key,value)=>setFilingLines(rows=>rows.map(row=>row.id===id?{...row,[key]:value}:row));
 const addLine=()=>setFilingLines(rows=>[...rows,{id:Date.now()+Math.random(),occurredAt:"",categoryCode:"",direction:"income",amount:"",description:""}]);
 const removeLine=id=>setFilingLines(rows=>rows.length<=1?rows:rows.filter(row=>row.id!==id));
 const openHelp=k=>setDrawer(helpData[k]||["Information","This area provides public Riverside County information and services."]);

 async function validateTaxpayer(){
   const tin=taxpayerId.trim().toUpperCase();
   if(!tin){setTaxpayer(null);setTaxpayerStatus("invalid");return}
   setTaxpayerStatus("loading");setTaxpayer(null);
   try{
    const r=await fetch(`/api/business-filings?taxpayerId=${encodeURIComponent(tin)}`,{cache:"no-store"});
    const p=await r.json().catch(()=>({}));
    if(!r.ok||!p.valid){setTaxpayerStatus("invalid");return}
    setTaxpayer(p.taxpayer);setTaxpayerStatus("valid");
   }catch{setTaxpayerStatus("error")}
 }
 function switchTaxpayerMode(mode){
   setTaxpayerMode(mode);setTaxpayer(null);setTaxpayerStatus("idle");setReceipt(null);
 }
 async function submitFiling(e){
   e.preventDefault();const f=new FormData(e.currentTarget);const payload=Object.fromEntries(f.entries());
   payload.certified=f.get("certified")==="on";payload.noTaxpayerId=taxpayerMode==="manual";
   payload.taxpayerId=taxpayerMode==="tin"?taxpayerId.trim().toUpperCase():"";
   payload.lines=filingLines.map(({occurredAt,categoryCode,direction,amount,description})=>({occurredAt,categoryCode,direction,amount:Number(amount),description}));
   if(taxpayerMode==="tin"&&taxpayerStatus!=="valid")return alert("Validate the Riverside Taxpayer ID before submitting this filing.");
   if(payload.lines.some(line=>!line.occurredAt||!line.categoryCode||!Number.isFinite(line.amount)||line.amount<=0))return alert("Complete the date, classification and positive amount for every activity line.");
   const r=await fetch("/api/business-filings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const p=await r.json().catch(()=>({}));if(!r.ok)return alert(p.error||"Submission failed");
   setReceipt(p);
   e.currentTarget.reset();
   setFilingLines([{id:Date.now(),occurredAt:"",categoryCode:"",direction:"income",amount:"",description:""}]);
   if(taxpayerMode==="manual"){setTaxpayer(null)}
 }
 function openAgency(a){setSelectedAgency(a)}
 function restartVideo(e){const v=e.currentTarget;try{v.currentTime=2;v.play().catch(()=>{})}catch{}}

 return <div className="site">
  <div className="official-trust-banner">
    <img className="trust-flag" src="/assets/us-flag.svg" alt="Flag of the United States"/>
    <span>An official website of the Riverside County Government.</span>
    <button type="button" className="trust-how" onClick={()=>openHelp("official")}>Here’s how you know</button>
  </div>

  <header className="public-nav"><div className="brand"><img src="/assets/county-government-seal.png" alt="Riverside County seal"/><div><strong>RIVERSIDE COUNTY</strong><span>STATE OF CALIFORNIA</span></div></div><nav>{[
    ["home","Home"],["announcements","Announcements"],["governance","Government"],["agencies","Agencies"],["taxes","Taxes & Filing Guide"],["business","Business Filing"]
  ].map(([k,l])=><button key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}>{l}</button>)}</nav><button className="nav-help-toggle" onClick={()=>setHelp(v=>!v)}>{help?"Hide help":"Show help"}</button></header>
  {loadNotice&&<div className="county-load-notice">{loadNotice}</div>}

  {tab==="home"&&<main><section className="hero"><video autoPlay muted playsInline loop onLoadedMetadata={e=>{if(e.currentTarget.duration>3)e.currentTarget.currentTime=2}} onTimeUpdate={e=>{const v=e.currentTarget;if(v.duration&&v.currentTime>=v.duration-.2){v.currentTime=Math.min(2,v.duration-.1);v.play().catch(()=>{})}}} onEnded={restartVideo}><source src="/assets/county-home.mp4" type="video/mp4"/></video><div className="shade"></div><div className="hero-content"><img src="/assets/county-government-seal.png" alt=""/><h1>Riverside County Government</h1><p>Public services, county agencies and official information.</p><div className="search"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search county agencies and services"/><Help topic="search" enabled={help} onOpen={openHelp}/></div><div className="hero-links"><button onClick={()=>setTab("agencies")}>Find an agency</button><button onClick={()=>setTab("taxes")}>Tax & filing guidance</button><button onClick={()=>setTab("business")}>File business transaction</button></div></div></section><section className="home-grid"><article><h2>State & County Announcements <Help topic="announcements" enabled={help} onOpen={openHelp}/></h2>{ann.slice(0,3).map(a=><div className="notice" key={a.id}><small>{a.category}</small><strong>{a.title}</strong><p>{a.summary}</p></div>)}</article><article className="gov-card"><img src="/assets/county-seal.png" alt=""/><h2>County Governance</h2><p>Learn about county leadership, agencies and the administrative structure of Riverside County.</p><button onClick={()=>setTab("governance")}>View County Government →</button></article></section></main>}

  {tab==="announcements"&&<main className="content"><div className="page-title"><h1>Announcements <Help topic="announcements" enabled={help} onOpen={openHelp}/></h1><p>Official public notices and county information.</p></div><div className="notice-list">{ann.map(a=><article key={a.id}><small>{a.category} · {new Date(a.published_at).toLocaleDateString()}</small><h2>{a.title}</h2><p>{a.summary}</p>{a.body&&<p>{a.body}</p>}</article>)}</div></main>}

  {tab==="agencies"&&<main className="content"><div className="page-title"><h1>County Agencies <Help topic="agencies" enabled={help} onOpen={openHelp}/></h1><p>Departments and public bodies loaded from the shared Riverside County Governance directory.</p></div><input className="agency-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search agencies"/><div className="agency-grid">{filtered.map(a=><article key={a.id} className="agency-card" onClick={()=>openAgency(a)} tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")openAgency(a)}}><div className="agency-logo"><img src={agencyLogo(a)} onError={e=>e.currentTarget.src="/assets/county-seal.png"} alt=""/></div><small>{a.category}</small><h2>{a.name}</h2><p>{a.description}</p><dl><dt>Administrator</dt><dd>{a.administrator||"—"}</dd><dt>Extension</dt><dd>{a.extension||"—"}</dd><dt>Legal authority</dt><dd>{a.legalAuthority||"—"}</dd></dl><button type="button" className="agency-open" onClick={e=>{e.stopPropagation();openAgency(a)}}>View agency →</button></article>)}</div></main>}

  {tab==="governance"&&<main className="content"><div className="page-title"><h1>County Government <Help topic="governance" enabled={help} onOpen={openHelp}/></h1><p>Executive leadership and Riverside Senate.</p></div><section className="governor"><img src={gov.government?.governor?.portraitPath||"/assets/governor-seal.png"} onError={e=>e.currentTarget.src="/assets/governor-seal.png"} alt=""/><div><small>GOVERNOR</small><h2>{gov.government?.governor?.name||"William Bracken"}</h2><strong>{gov.government?.governor?.party||"New Founding Fathers of America"}</strong><p>{gov.government?.governor?.biography}</p></div></section><h2>State Cabinet</h2><div className="cabinet-grid">{(gov.government?.cabinet||[]).map((x,i)=><article key={i}><strong>{x.office}</strong><span>{x.name}</span></article>)}</div><h2>Riverside Senate</h2><div className="senate-grid">{(gov.government?.senate||[]).map((x,i)=><article key={i}><strong>{x.name}</strong><span>{x.party}</span><small>{x.district} · {x.committee}</small></article>)}</div></main>}

  {tab==="taxes"&&<main className="content tax-guide"><div className="page-title"><h1>Taxes & Filing Guide <Help topic="taxes" enabled={help} onOpen={openHelp}/></h1><p>Guidance for choosing a Riverside County business activity classification and filing direction.</p></div>
    <section className="tax-guide-intro">
      <div><small>RIVERSIDE COUNTY DEPARTMENT OF FINANCE</small><h2>Before you file</h2><p>Business activity returns use your Riverside Taxpayer ID to identify the registered Wirtschaftsprofil. Choose the classification that most closely describes the activity being reported, then identify whether the amount is incoming business activity or a reportable business outflow.</p></div>
      <button onClick={()=>setTab("business")}>Go to Business Filing →</button>
    </section>
    <section className="direction-guide">
      <article><span className="direction-symbol income">+</span><div><h3>Income / taxable receipt</h3><p>Use this for money or value received through sales, services, rentals, contracts, admissions, or other reportable business receipts. The selected activity classification determines the tax impact calculated on that incoming amount.</p></div></article>
      <article><span className="direction-symbol expense">−</span><div><h3>Expense / potentially allowable deduction</h3><p>Use this for an ordinary business outflow that may reduce the taxable business base under the applicable county schedule. It is recorded as a deduction candidate, not as a negative tax payment, and it can reduce the calculated assessment only down to zero.</p></div></article>
    </section>
    <div className="tax-classification-grid">{rules.map(rule=><article key={rule.code}><header><span>{rule.code.replaceAll("_"," ")}</span><strong>{rateLabel(rule)}</strong></header><h3>{rule.name}</h3><p>{rule.description||"County business activity classification."}</p><div className="tax-classification-example"><b>Choose this when:</b> {rule.code==="RETAIL_SALES"?"The transaction is a sale of goods to a customer.":rule.code==="PROFESSIONAL_SERVICES"?"The business is being paid for advisory, professional, technical, or specialist work.":rule.code==="CONTRACTING"?"The reported activity comes from construction, repair, installation, or contractor work.":rule.code==="HOSPITALITY"?"The activity concerns lodging, accommodation, or hospitality services.":rule.code==="FOOD_BEVERAGE"?"The amount comes from prepared food, restaurant, catering, or beverage activity.":rule.code==="ENTERTAINMENT"?"The activity involves events, admission, recreation, or entertainment.":rule.code==="VEHICLE_RENTAL"?"The business receives or reports value from renting vehicles or equipment.":rule.code==="PROPERTY_TRANSFER"?"The filing concerns a qualifying transfer of property or a property interest.":rule.code==="UTILITIES"?"The activity relates to utility or infrastructure services.":rule.code==="DIGITAL_COMMERCE"?"The transaction occurred through online commerce, digital products, a platform, or electronic service.":rule.code==="LUXURY_GOODS"?"The activity involves designated luxury or high-value goods.":rule.code==="LICENSED_ACTIVITY"?"The transaction arises from an activity conducted under a county permit or license.":"No more specific classification accurately describes the ordinary business receipt."}</div></article>)}</div>
    <section className="tax-guide-note"><strong>Important:</strong><p>The activity rate shown here is the rate currently configured in the Riverside County financial system for this filing classification. This guide helps select a portal category; it does not replace a formal notice, assessment, exemption decision, or specific instruction issued by the Department of Finance.</p></section>
  </main>}

  {tab==="business"&&<main className="content"><div className="page-title"><h1>Business Transaction Filing <Help topic="business" enabled={help} onOpen={openHelp}/></h1><p>Riverside County Business Activity Return — taxpayer-identified public filing service.</p></div>
    <form className="tax-form" onSubmit={submitFiling}>
      <div className="form-head"><div className="form-number">RC<br/><b>BT-1040</b></div><div><small>RIVERSIDE COUNTY DEPARTMENT OF FINANCE</small><h2>Business Transaction Activity Return</h2><p>For reportable business income and deductions</p></div><div className="year">{new Date().getFullYear()}</div></div>

      <section className="taxpayer-identification">
        <div className="taxpayer-identification-head"><div><small>SECTION A</small><h3>Taxpayer Identification</h3><p>Use the Riverside Taxpayer ID issued to the Wirtschaftsprofil whenever one is available.</p></div><div className="taxpayer-mode-switch"><button type="button" className={taxpayerMode==="tin"?"active":""} onClick={()=>switchTaxpayerMode("tin")}>I have a Taxpayer ID</button><button type="button" className={taxpayerMode==="manual"?"active":""} onClick={()=>switchTaxpayerMode("manual")}>No Taxpayer ID issued</button></div></div>

        {taxpayerMode==="tin"?<div className="taxpayer-lookup">
          <label>Riverside Taxpayer ID<div className="taxpayer-input-row"><input value={taxpayerId} onChange={e=>{setTaxpayerId(e.target.value.toUpperCase());setTaxpayer(null);setTaxpayerStatus("idle")}} placeholder="RC-TIN-2026-000001" pattern="RC-TIN-[0-9]{4}-[0-9]{6}" required/><button type="button" onClick={validateTaxpayer} disabled={taxpayerStatus==="loading"}>{taxpayerStatus==="loading"?"Checking…":"Validate"}</button></div></label>
          {taxpayerStatus==="valid"&&taxpayer&&<div className="taxpayer-result valid"><span>✓ REGISTERED TAXPAYER FOUND</span><strong>{taxpayer.legalName}</strong><dl><dt>Taxpayer ID</dt><dd>{taxpayer.taxpayerId}</dd><dt>Wirtschaftsprofil</dt><dd>{taxpayer.economicProfileId}</dd><dt>Classification</dt><dd>{taxpayer.classification||"—"}</dd><dt>Profile status</dt><dd>{taxpayer.status||"—"}</dd></dl><p>The legal name above is supplied by RinCEN and will be used for this filing. It cannot be replaced with a different free-typed business name.</p></div>}
          {taxpayerStatus==="invalid"&&<div className="taxpayer-result invalid"><strong>Taxpayer ID not found.</strong><p>Check the number and try again. If no Riverside Taxpayer ID has been issued, use the unregistered taxpayer option instead.</p></div>}
          {taxpayerStatus==="error"&&<div className="taxpayer-result invalid"><strong>Taxpayer verification unavailable.</strong><p>The County could not reach the financial profile service. Try again before filing.</p></div>}
        </div>:<div className="manual-taxpayer-path"><div className="manual-warning"><strong>UNREGISTERED / LEGACY FILING PATH</strong><p>Use this only when the business or taxpayer has not been issued a Riverside Taxpayer ID. The filing will enter Government Transactions without an automatic Wirtschaftsprofil link and may require manual review by the Department of Finance.</p></div><label>Legal business / taxpayer name<input name="businessName" required placeholder="Enter the legal name used for this filing"/></label></div>}
      </section>

      <div className="row two"><label>Reporter / responsible person<input name="reporterName" required/></label><label>Contact reference<input name="contact"/></label></div>
      <section className="filing-lines-section">
        <header><div><small>SECTION B</small><h3>Business Activity Lines</h3><p>A single return may contain multiple activities or tax classifications. Add a separate line whenever the date, classification, direction, amount, or description differs.</p></div><button type="button" onClick={addLine}>＋ Add activity line</button></header>
        <div className="filing-lines">
          {filingLines.map((line,index)=>{const rule=lineRule(line);const amount=Number(line.amount||0);const estimated=rule?amount*(Number(rule.rate_basis_points||0)/10000):0;return <article className="filing-line" key={line.id}>
            <div className="filing-line-number">LINE {index+1}</div>
            <div className="filing-line-grid">
              <label>Transaction date<input type="date" value={line.occurredAt} min="1900-01-01" max={today} onChange={e=>updateLine(line.id,"occurredAt",e.target.value)} required/></label>
              <label>Activity classification<select value={line.categoryCode} onChange={e=>updateLine(line.id,"categoryCode",e.target.value)} required><option value="" disabled>Select category</option>{rules.map(r=><option key={r.code} value={r.code}>{r.name} — {rateLabel(r)}</option>)}</select><small className="field-note"><button type="button" className="inline-guide-link" onClick={()=>setTab("taxes")}>Need help choosing?</button></small></label>
              <label>Entry type<select value={line.direction} onChange={e=>updateLine(line.id,"direction",e.target.value)}><option value="income">Income / taxable receipt (+)</option><option value="expense">Expense / potentially allowable deduction</option></select></label>
              <label>Amount ($)<input type="number" step="0.01" min="0.01" value={line.amount} onChange={e=>updateLine(line.id,"amount",e.target.value)} required/></label>
              <label className="wide">Description<input value={line.description} onChange={e=>updateLine(line.id,"description",e.target.value)} placeholder="Describe the sale, service, contract, expense, or other business activity."/></label>
            </div>
            <div className="filing-line-guidance">
              <div><strong>{rule?rule.name:"Choose a classification"}</strong><span>{rule?.description||"The selected classification determines how this line is treated."}</span></div>
              <div>{line.direction==="expense"?<><strong>Potential deduction</strong><span>{amount>0?`$${amount.toFixed(2)} reported as a deduction candidate. Estimated reduction of the line's assessment: up to $${estimated.toFixed(2)}; never a negative tax credit.`:"Enter an amount to see the potential deduction effect."}</span></>:<><strong>Estimated assessment</strong><span>{amount>0&&rule?`Approximately $${estimated.toFixed(2)} on this line before deductions and payments.`:"Enter an amount and classification to estimate the assessment."}</span></>}</div>
              <button type="button" className="remove-line" disabled={filingLines.length<=1} onClick={()=>removeLine(line.id)}>Remove line</button>
            </div>
          </article>})}
        </div>
      </section>
      <div className="filing-accuracy-warning"><strong>DOUBLE-CHECK YOUR FILING BEFORE SUBMISSION</strong><p>Please review every Taxpayer ID, legal name, transaction date, amount, classification, direction and description at least twice — and preferably a third time for important filings. Misspelled names, transposed digits, an incorrect year, or the wrong activity classification can cause the transaction to be associated with the wrong record or require a later correction by the Department of Finance.</p></div>
      <div className="cert"><label><input type="checkbox" name="certified" required/> I certify that I reviewed the information above and that it is accurate to the best of my knowledge and submitted on behalf of the identified taxpayer or named unregistered business.</label></div>
      <button className="submit-return">SUBMIT BUSINESS RETURN</button>
      {receipt&&<div className="receipt"><strong>Filing received: {receipt.reference}</strong><span>Registered taxpayer: {receipt.taxpayerId||"Not provided"}</span><span>Recorded taxpayer name: {receipt.businessName}</span><span>Gross estimated assessment: ${Number(receipt.grossAssessment||0).toFixed(2)}</span><span>Estimated deduction effect: −${Number(receipt.deductionEffect||0).toFixed(2)}</span><span>Net estimated assessment: ${Number(receipt.netAssessment||0).toFixed(2)}</span><span>Activity lines filed: {receipt.lineCount||1}</span><span>{receipt.linkedProfile?`Automatically linked to Wirtschaftsprofil ${receipt.linkedProfile}.`:"Unregistered filing — awaiting any necessary manual RinCEN review."}</span></div>}
    </form>
  </main>}

  <footer><img src="/assets/county-seal.png" alt=""/><div><strong>Riverside County Government</strong><span>State of California · Public Information Portal</span></div><span>Official county network</span></footer>

  {selectedAgency&&<div className="agency-modal" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedAgency(null)}}><article>
    <header><div><small>RIVERSIDE COUNTY AGENCY DIRECTORY</small><h2>{selectedAgency.name}</h2><span>{selectedAgency.abbreviation} · {selectedAgency.status||"—"}</span></div><button onClick={()=>setSelectedAgency(null)}>×</button></header>
    <div className="agency-modal-body"><aside><img src={agencyLogo(selectedAgency)} onError={e=>e.currentTarget.src="/assets/county-seal.png"} alt=""/></aside><section><p className="agency-modal-description">{selectedAgency.description}</p><dl><dt>Agency administrator</dt><dd>{selectedAgency.administrator||"Not entered"}</dd><dt>County extension</dt><dd>{selectedAgency.extension||"—"}</dd><dt>Category</dt><dd>{selectedAgency.category||"—"}</dd><dt>Legal authority</dt><dd>{selectedAgency.legalAuthority||"—"}</dd><dt>Status</dt><dd>{selectedAgency.status||"—"}</dd></dl>{selectedAgency.websiteUrl&&<a className="agency-website" href={selectedAgency.websiteUrl} target="_blank" rel="noreferrer">Open agency website / terminal →</a>}</section></div>
    <footer><span>Data source: County Governance Network</span><button onClick={()=>setSelectedAgency(null)}>Close</button></footer>
  </article></div>}

  {drawer&&<aside className="help-drawer"><button onClick={()=>setDrawer(null)}>×</button><small>PUBLIC ASSISTANCE</small><h2>{drawer[0]}</h2><p>{drawer[1]}</p><p>This assistance explains the website interface and does not itself create legal rights, deadlines or agency authority.</p></aside>}
 </div>;
}
