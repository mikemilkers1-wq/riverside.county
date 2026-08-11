"use client";
import {useEffect,useMemo,useState} from "react";

const FALLBACK_RULES=[
 {code:"GENERAL_RECEIPTS",name:"Allgemeine Geschäftseinnahmen",rate_basis_points:500,description:"Allgemeine gewerbliche Einnahmen und sonstige gewöhnliche Betriebserlöse."},
 {code:"RETAIL_SALES",name:"Einzelhandelsverkäufe",rate_basis_points:725,description:"Verkäufe von Waren an Endkunden im Einzelhandel."},
 {code:"PROFESSIONAL_SERVICES",name:"Professionelle Dienstleistungen",rate_basis_points:450,description:"Einnahmen aus professionellen, beratenden, technischen oder vergleichbaren Dienstleistungen."},
 {code:"CONTRACTING",name:"Bau- und Vertragsleistungen",rate_basis_points:350,description:"Bau-, Reparatur-, Installations- und Auftragnehmertätigkeiten."},
 {code:"HOSPITALITY",name:"Beherbergung und Gastgewerbe",rate_basis_points:825,description:"Hotels, Beherbergung, Kurzzeitunterkünfte und damit verbundene Einnahmen."},
 {code:"FOOD_BEVERAGE",name:"Gastronomie und Getränke",rate_basis_points:650,description:"Einnahmen aus Restaurants, Catering, zubereiteten Speisen und Getränken."},
 {code:"ENTERTAINMENT",name:"Unterhaltung und Veranstaltungen",rate_basis_points:775,description:"Einnahmen aus Eintritt, Veranstaltungen, Aufführungen, Freizeit und Unterhaltung."},
 {code:"VEHICLE_RENTAL",name:"Fahrzeug- und Gerätevermietung",rate_basis_points:900,description:"Vermietung von Fahrzeugen, Maschinen, Geräten und vergleichbaren Gegenständen."},
 {code:"PROPERTY_TRANSFER",name:"Eigentumsübertragung",rate_basis_points:125,description:"Meldepflichtige Übertragungen von Immobilien oder entsprechenden Eigentumsrechten."},
 {code:"UTILITIES",name:"Versorgung und Infrastruktur",rate_basis_points:300,description:"Einnahmen im Zusammenhang mit Versorgung, Infrastruktur, Netzen oder öffentlichen Dienstleistungen."},
 {code:"DIGITAL_COMMERCE",name:"Digitaler Handel",rate_basis_points:525,description:"Onlinehandel, digitale Produkte, Plattformtätigkeiten und elektronische Dienstleistungen."},
 {code:"LUXURY_GOODS",name:"Luxus- und hochwertige Güter",rate_basis_points:1100,description:"Luxus-, Premium-, Sammler- und andere besonders hochwertige Güter."},
 {code:"LICENSED_ACTIVITY",name:"Lizenz- / genehmigungspflichtige Tätigkeit",rate_basis_points:600,description:"Geschäftstätigkeit auf Grundlage einer County-Lizenz, Genehmigung oder regulierten Zulassung."}
];

const helpData={
 official:["Offizielle Website","Websites des Riverside County Government verwenden die offizielle County-Kennzeichnung und werden über die Verwaltungsinfrastruktur des County bereitgestellt."],
 search:["Suche","Durchsuchen Sie die auf dieser Website verfügbaren County-Behörden und öffentlichen Dienste. Die Suche ist keine formelle Akten- oder Auskunftsanfrage."],
 home:["Startseite","Hier finden Sie einen öffentlichen Überblick über Riverside County, aktuelle Hinweise sowie direkte Zugänge zu wichtigen Verwaltungsinformationen."],
 announcements:["Bekanntmachungen","Hier veröffentlicht Riverside County öffentliche Mitteilungen und behördliche Hinweise. Bei zeitkritischen Angaben beachten Sie das Veröffentlichungsdatum der jeweiligen Bekanntmachung."],
 governance:["County-Verwaltung","Dieser Bereich zeigt die aktuelle politische und administrative Führung des County, einschließlich Gouverneur, Kabinett und Senate. Die Angaben werden über das gemeinsame County-Governance-System bereitgestellt."],
 agencies:["County-Behörden","Hier finden Sie Behörden und öffentliche Einrichtungen von Riverside County mit Zuständigkeit, Leitung und Kontaktinformationen. Öffnen Sie einen Eintrag, um weitere Angaben zur jeweiligen Behörde zu sehen."],
 taxes:["Steuern & Einreichungshilfe","Diese Seite erläutert die verfügbaren Kategorien für steuerlich relevante Geschäftsvorgänge. Wenn Sie unsicher sind, wählen Sie nicht auf Verdacht eine Kategorie, sondern vergleichen Sie die Beschreibung mit dem tatsächlichen Vorgang."],
 business:["Geschäftsvorgänge melden","Mit diesem Formular werden steuerlich relevante Geschäftsvorgänge an das Riverside County Department of Finance übermittelt. Prüfen Sie alle Angaben sorgfältig; registrierte Wirtschaftsprofile müssen vor der Einreichung mit Taxpayer ID und Einreichungscode bestätigt werden."],
 filingMode:["Art der Einreichung","Wählen Sie „Registriertes Wirtschaftsprofil“, wenn bereits eine Riverside Taxpayer ID ausgegeben wurde. „Nicht registriert / Altverfahren“ ist ausschließlich für Steuerpflichtige ohne ausgegebene Taxpayer ID vorgesehen und wird nicht automatisch mit einem bestehenden Wirtschaftsprofil verknüpft."],
 filingTin:["Riverside Taxpayer ID","Tragen Sie die Ihrem Wirtschaftsprofil zugewiesene Kennung im Format RC-TIN-JJJJ-XXXXXX ein. Wenn Ihnen keine Taxpayer ID ausgegeben wurde, raten oder verwenden Sie keine fremde Kennung, sondern wählen Sie das nicht registrierte Altverfahren."],
 filingAccess:["Einreichungscode","Der Einreichungscode ist der vertrauliche Berechtigungsnachweis für Online-Einreichungen zu einem registrierten Wirtschaftsprofil. Wenn Ihnen der Code fehlt oder verloren gegangen ist, verwenden Sie keinen fremden Code; wenden Sie sich an das Riverside County Department of Finance, damit Ihre Berechtigung geprüft werden kann."],
 filingVerify:["Steuerpflichtigen prüfen","Diese Prüfung bestätigt, dass Taxpayer ID und Einreichungscode demselben Wirtschaftsprofil zugeordnet sind. Erst nach erfolgreicher Prüfung kann eine registrierte Einreichung abgesendet werden."],
 filingManualName:["Rechtlicher Name","Geben Sie beim Altverfahren den vollständigen rechtlichen Namen des Steuerpflichtigen oder Unternehmens an. Dieses Feld ist nicht dafür gedacht, ein vorhandenes Wirtschaftsprofil ohne dessen Taxpayer ID und Einreichungscode zu umgehen."],
 filingReporter:["Einreichende / verantwortliche Person","Tragen Sie die Person ein, die diese Meldung tatsächlich einreicht und für die Angaben verantwortlich ist. Verwenden Sie hier nicht einfach erneut den Unternehmensnamen; wenn Sie im Auftrag einer Organisation handeln, geben Sie Ihren eigenen Namen beziehungsweise Ihre dienstlich verwendete Bezeichnung an."],
 filingContact:["Kontakt / Referenz","Hier kann eine Rückfrageadresse, interne Referenz, Telefonnummer oder andere geeignete Kontaktangabe eingetragen werden. Wenn keine gesonderte Kontakt- oder Referenzangabe existiert, kann dieses Feld leer bleiben."],
 filingDate:["Vorgangsdatum","Geben Sie das Datum ein, an dem der gemeldete Geschäftsvorgang tatsächlich stattgefunden hat, nicht automatisch das heutige Einreichungsdatum. Für Vorgänge an unterschiedlichen Tagen legen Sie getrennte Positionen an."],
 filingClass:["Art der Geschäftstätigkeit","Wählen Sie die Kategorie, die den tatsächlichen Vorgang am besten beschreibt; sie bestimmt den angewandten County-Steuersatz. Wenn keine Kategorie eindeutig passt, prüfen Sie zuerst „Steuern & Einreichungshilfe“ und wählen Sie nicht nur die günstigste Kategorie."],
 filingDirection:["Buchungsart","„Einnahme“ ist für steuerlich relevante Zuflüsse wie Verkäufe oder Dienstleistungen vorgesehen. „Ausgabe / möglicher Abzug“ erfasst einen potenziell zulässigen betrieblichen Abfluss; eine Ausgabe ist keine Steuerzahlung und erzeugt niemals eine negative Steuerzahlung."],
 filingAmount:["Betrag","Geben Sie den absoluten positiven Betrag des Vorgangs ausschließlich in vollen Dollar ein, zum Beispiel 200. Nachkommastellen wie 200,50 oder 200.50 sind nicht zulässig. Bei einer Ausgabe tragen Sie nicht -200 ein; wählen Sie stattdessen die Buchungsart „Ausgabe / möglicher Abzug“ und geben Sie 200 ein."],
 filingDescription:["Beschreibung","Beschreiben Sie kurz und konkret, wofür die Einnahme oder Ausgabe angefallen ist, damit der Vorgang später nachvollzogen werden kann. Tragen Sie hier keine Passwörter, Einreichungscodes oder andere vertrauliche Zugangsdaten ein."],
 filingAddLine:["Weitere Position","Fügen Sie eine weitere Position hinzu, wenn Datum, Kategorie, Buchungsart, Betrag oder Beschreibung von der vorherigen Position abweichen. Eine einzelne Einreichung kann mehrere Positionen und Steuerkategorien enthalten."],
 filingCertification:["Bestätigung","Mit der Bestätigung erklären Sie, dass Sie die Angaben geprüft haben und nach bestem Wissen für den bezeichneten Steuerpflichtigen einreichen. Setzen Sie die Bestätigung erst nach Kontrolle von Taxpayer ID, Beträgen, Daten, Kategorien und Beschreibungen."],
 filingSubmit:["Einreichung absenden","Hiermit werden alle Positionen gemeinsam an das County-Finanzsystem übertragen. Kontrollieren Sie die Angaben vorher mindestens zweimal; nach erfolgreicher Übermittlung erhalten Sie eine Einreichungsreferenz als Nachweis."]
};

function Help({topic,enabled,onOpen}){if(!enabled)return null;return <button type="button" className="info-dot field-info-dot" title="Information" aria-label="Information" onClick={e=>{e.preventDefault();e.stopPropagation();onOpen(topic)}}>i</button>}
function agencyLogo(a){
 if(a?.logoPath)return a.logoPath;
 const known={rdof:"/county-governance/rdof-logo.png"};
 return known[a?.logoKey]||"/assets/county-seal.png";
}
function rateLabel(rule){return `${(Number(rule?.rate_basis_points||0)/100).toFixed(2)}%`}
function wholeDollar(value){return Math.round(Number(value||0))}
function dollarLabel(value){return `$${wholeDollar(value).toLocaleString("de-DE")}`}
function directionHelp(direction){
 return direction==="expense"
  ?"Wählen Sie „Ausgabe / möglicher Abzug“ nur für einen meldepflichtigen betrieblichen Abfluss, der nach der einschlägigen County-Regelung möglicherweise abzugsfähig ist. Die Position wird als Abzugskandidat erfasst und ist keine Zahlung an das County."
  :"Wählen Sie „Einnahme“, wenn der Betrag aus Verkäufen, Dienstleistungen, Vermietungen oder anderen meldepflichtigen betrieblichen Zuflüssen stammt. Die gewählte Kategorie bestimmt die berechnete steuerliche Wirkung.";
}

export default function Portal(){
 const [tab,setTab]=useState("home"),[gov,setGov]=useState({agencies:[],government:{}}),[ann,setAnn]=useState([]),
 [rules,setRules]=useState(FALLBACK_RULES),[help,setHelp]=useState(false),[drawer,setDrawer]=useState(null),
 [q,setQ]=useState(""),[receipt,setReceipt]=useState(null),[selectedAgency,setSelectedAgency]=useState(null),
 [loadNotice,setLoadNotice]=useState(""),[taxpayerMode,setTaxpayerMode]=useState("tin"),
 [taxpayerId,setTaxpayerId]=useState(""),[filingAccessCode,setFilingAccessCode]=useState(""),[taxpayer,setTaxpayer]=useState(null),[taxpayerStatus,setTaxpayerStatus]=useState("idle"),
 [filingLines,setFilingLines]=useState([{id:1,occurredAt:"",categoryCode:"",direction:"income",amount:"",description:""}]),
 [portalNotice,setPortalNotice]=useState(null),[filingBusy,setFilingBusy]=useState(false),
 [lookupResult,setLookupResult]=useState(null),[lookupBusy,setLookupBusy]=useState(false),[requestBusy,setRequestBusy]=useState(false);

 useEffect(()=>{
   let active=true;
   Promise.allSettled([
     fetch("/api/governance",{cache:"no-store"}).then(async r=>{const p=await r.json();if(!r.ok)throw new Error(p.error||"County-Verwaltung nicht verfügbar");return p}),
     fetch("/api/announcements",{cache:"no-store"}).then(async r=>{const p=await r.json();if(!r.ok)throw new Error(p.error||"Bekanntmachungen nicht verfügbar");return p}),
     fetch("/api/business-filings",{cache:"no-store"}).then(async r=>{const p=await r.json();if(!r.ok)throw new Error(p.error||"Steuerregeln nicht verfügbar");return p})
   ]).then(results=>{
     if(!active)return;
     const [g,a,t]=results;
     if(g.status==="fulfilled")setGov(g.value.state||{agencies:[],government:{}});
     else setLoadNotice("County-Verwaltung konnte vorübergehend nicht geladen werden.");
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
 const openHelp=k=>setDrawer(helpData[k]||["Information","Dieser Bereich stellt öffentliche Informationen und Dienstleistungen von Riverside County bereit."]);

 async function validateTaxpayer(){
   const tin=taxpayerId.trim().toUpperCase(),access=filingAccessCode.trim().toUpperCase();
   if(!tin||!access){setTaxpayer(null);setTaxpayerStatus("invalid");return}
   setTaxpayerStatus("loading");setTaxpayer(null);
   try{
    const r=await fetch("/api/business-filings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"verify",taxpayerId:tin,filingCode:access})});
    const p=await r.json().catch(()=>({}));
    if(!r.ok||!p.valid){setTaxpayerStatus("invalid");return}
    setTaxpayer(p.taxpayer);setTaxpayerStatus("valid");
   }catch{setTaxpayerStatus("error")}
 }
 function switchTaxpayerMode(mode){
   setTaxpayerMode(mode);setTaxpayer(null);setTaxpayerStatus("idle");setFilingAccessCode("");setReceipt(null);
 }
 async function submitFiling(e){
   e.preventDefault();if(filingBusy)return;
   const form=e.currentTarget,f=new FormData(form),payload=Object.fromEntries(f.entries());
   payload.certified=f.get("certified")==="on";payload.noTaxpayerId=taxpayerMode==="manual";
   payload.taxpayerId=taxpayerMode==="tin"?taxpayerId.trim().toUpperCase():"";payload.filingCode=taxpayerMode==="tin"?filingAccessCode.trim().toUpperCase():"";
   payload.lines=filingLines.map(({occurredAt,categoryCode,direction,amount,description})=>({occurredAt,categoryCode,direction,amount:Number(amount),description}));
   if(taxpayerMode==="tin"&&taxpayerStatus!=="valid"){setPortalNotice({type:"error",title:"Einreichung noch nicht möglich",message:"Prüfen Sie zuerst Taxpayer ID und Einreichungscode. Es wurde nichts an RinCEN übertragen."});return}
   if(payload.lines.some(line=>!line.occurredAt||!line.categoryCode||!Number.isFinite(line.amount)||line.amount<=0||!Number.isInteger(line.amount))){setPortalNotice({type:"error",title:"Unvollständige Geschäftsposition",message:"Vervollständigen Sie für jede Position Datum, Kategorie und einen positiven Betrag in vollen Dollar. Nachkommastellen sind nicht zulässig."});return}
   setFilingBusy(true);
   try{
    const r=await fetch("/api/business-filings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const result=await r.json().catch(()=>({}));
    if(!r.ok){setPortalNotice({type:"error",title:"Einreichung nicht gespeichert",message:result.error||"RinCEN konnte die Steuererklärung nicht speichern. Es wurde keine Festsetzung erstellt."});return}
    setReceipt(result);form.reset();setFilingLines([{id:Date.now(),occurredAt:"",categoryCode:"",direction:"income",amount:"",description:""}]);if(taxpayerMode==="manual")setTaxpayer(null);
    setPortalNotice({type:"success",title:"Einreichung erfolgreich gespeichert",message:`RinCEN hat die Steuererklärung unter ${result.reference||"einer neuen Referenz"} erfasst. Nettofestsetzung: $${Number(result.netAssessment||0).toFixed(0)}.`});
   }catch{setPortalNotice({type:"error",title:"RinCEN nicht erreichbar",message:"Die Verbindung zum Riverside County Department of Finance ist fehlgeschlagen. Es wurde keine Festsetzung erstellt; versuchen Sie es später erneut."})}
   finally{setFilingBusy(false)}
 }
 async function lookupTaxpayer(e){
   e.preventDefault();const f=new FormData(e.currentTarget),taxpayerId=String(f.get("taxpayerId")||"").trim().toUpperCase();
   setLookupBusy(true);setLookupResult(null);
   try{
     const r=await fetch("/api/taxpayer-lookup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({taxpayerId})});
     const p=await r.json().catch(()=>({}));
     if(!r.ok){setLookupResult({error:p.error||"Kein öffentlicher Eintrag gefunden."});return}
     setLookupResult(p.taxpayer);
   }catch{setLookupResult({error:"Die öffentliche Taxpayer-Auskunft ist derzeit nicht erreichbar."})}
   finally{setLookupBusy(false)}
 }
 async function submitPublicRequest(e){
   e.preventDefault();if(requestBusy)return;const f=new FormData(e.currentTarget),payload=Object.fromEntries(f.entries());
   setRequestBusy(true);
   try{
     const r=await fetch("/api/public-requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
     const p=await r.json().catch(()=>({}));
     if(!r.ok){setPortalNotice({type:"error",title:"Antrag nicht übermittelt",message:p.error||"Der Antrag konnte nicht gespeichert werden."});return}
     e.currentTarget.reset();
     setPortalNotice({type:"success",title:"Antrag eingegangen",message:`Ihr Antrag wurde unter ${p.public_id||"einer neuen Referenz"} an RinCEN übermittelt.`});
   }catch{setPortalNotice({type:"error",title:"RinCEN nicht erreichbar",message:"Der Antrag konnte nicht an das Department of Finance übertragen werden."})}
   finally{setRequestBusy(false)}
 }
 function openAgency(a){setSelectedAgency(a)}
 function restartVideo(e){const v=e.currentTarget;try{v.currentTime=2;v.play().catch(()=>{})}catch{}}

 return <div className="site">
  {portalNotice&&<div className="portal-notice-backdrop"><section className={`portal-notice ${portalNotice.type||"info"}`} role="dialog" aria-modal="true"><header><strong>{portalNotice.title}</strong></header><p>{portalNotice.message}</p><div className="portal-notice-actions"><button type="button" onClick={()=>setPortalNotice(null)}>Schließen</button></div></section></div>}
  <div className="official-trust-banner">
    <img className="trust-flag" src="/assets/us-flag.svg" alt="Flagge der Vereinigten Staaten"/>
    <span>An official website of the Riverside County Government.</span>
    <button type="button" className="trust-how" onClick={()=>openHelp("official")}>Here’s how you know</button>
  </div>

  <header className="public-nav"><div className="brand"><img src="/assets/county-government-seal.png" alt="Siegel von Riverside County"/><div><strong>RIVERSIDE COUNTY</strong><span>STATE OF CALIFORNIA</span></div></div><nav>{[
    ["home","Startseite"],["announcements","Bekanntmachungen"],["governance","County-Verwaltung"],["agencies","County-Behörden"],["laws","Gesetzbuch"],["lookup","Taxpayer-Auskunft"],["forms","Formulare"],["taxes","Steuern & Einreichungshilfe"],["business","Steuererklärung"]
  ].map(([k,l])=><button key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}>{l}</button>)}</nav><button className="nav-help-toggle" onClick={()=>setHelp(v=>!v)}>{help?"Hilfe ausblenden":"Hilfe anzeigen"}</button></header>
  {loadNotice&&<div className="county-load-notice">{loadNotice}</div>}

  {tab==="home"&&<main><section className="hero"><video autoPlay muted playsInline loop onLoadedMetadata={e=>{if(e.currentTarget.duration>3)e.currentTarget.currentTime=2}} onTimeUpdate={e=>{const v=e.currentTarget;if(v.duration&&v.currentTime>=v.duration-.2){v.currentTime=Math.min(2,v.duration-.1);v.play().catch(()=>{})}}} onEnded={restartVideo}><source src="/assets/county-home.mp4" type="video/mp4"/></video><div className="shade"></div><div className="hero-content"><img src="/assets/county-government-seal.png" alt=""/><h1>Riverside County Government</h1><p>Öffentliche Dienstleistungen, County-Behörden und offizielle Informationen.</p><div className="search"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="County-Behörden und Dienstleistungen durchsuchen"/><Help topic="search" enabled={help} onOpen={openHelp}/></div><div className="hero-links"><button onClick={()=>setTab("agencies")}>Behörde finden</button><button onClick={()=>setTab("taxes")}>Steuer- und Einreichungshilfe</button><button onClick={()=>setTab("business")}>Geschäftsvorgang melden</button></div></div></section><section className="home-grid"><article><h2>State- & County-Bekanntmachungen <Help topic="announcements" enabled={help} onOpen={openHelp}/></h2>{ann.slice(0,3).map(a=><div className="notice" key={a.id}><small>{a.category}</small><strong>{a.title}</strong><p>{a.summary}</p></div>)}</article><article className="gov-card"><img src="/assets/county-seal.png" alt=""/><h2>County-Verwaltung</h2><p>Informieren Sie sich über die Leitung, Behörden und Verwaltungsstruktur von Riverside County.</p><button onClick={()=>setTab("governance")}>County-Verwaltung anzeigen →</button></article></section></main>}

  {tab==="announcements"&&<main className="content"><div className="page-title"><h1>Bekanntmachungen <Help topic="announcements" enabled={help} onOpen={openHelp}/></h1><p>Offizielle öffentliche Mitteilungen und Informationen des County.</p></div><div className="notice-list">{ann.map(a=><article key={a.id}><small>{a.category} · {new Date(a.published_at).toLocaleDateString()}</small><h2>{a.title}</h2><p>{a.summary}</p>{a.body&&<p>{a.body}</p>}</article>)}</div></main>}

  {tab==="agencies"&&<main className="content"><div className="page-title"><h1>County-Behörden <Help topic="agencies" enabled={help} onOpen={openHelp}/></h1><p>Behörden und öffentliche Einrichtungen aus dem gemeinsamen Riverside County Governance Network.</p></div><input className="agency-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Behörden durchsuchen"/><div className="agency-grid">{filtered.map(a=><article key={a.id} className="agency-card" onClick={()=>openAgency(a)} tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")openAgency(a)}}><div className="agency-logo"><img src={agencyLogo(a)} onError={e=>e.currentTarget.src="/assets/county-seal.png"} alt=""/></div><small>{a.category}</small><h2>{a.name}</h2><p>{a.description}</p><dl><dt>Leitung</dt><dd>{a.administrator||"—"}</dd><dt>Durchwahl</dt><dd>{a.extension||"—"}</dd><dt>Rechtsgrundlage</dt><dd>{a.legalAuthority||"—"}</dd></dl><button type="button" className="agency-open" onClick={e=>{e.stopPropagation();openAgency(a)}}>Behörde anzeigen →</button></article>)}</div></main>}

  {tab==="governance"&&<main className="content"><div className="page-title"><h1>County-Verwaltung <Help topic="governance" enabled={help} onOpen={openHelp}/></h1><p>Exekutive Führung und Riverside Senate.</p></div><section className="governor"><img src={gov.government?.governor?.portraitPath||"/assets/governor-seal.png"} onError={e=>e.currentTarget.src="/assets/governor-seal.png"} alt=""/><div><small>GOUVERNEUR</small><h2>{gov.government?.governor?.name||"William Bracken"}</h2><strong>{gov.government?.governor?.party||"New Founding Fathers of America"}</strong><p>{gov.government?.governor?.biography}</p></div></section><h2>State-Kabinett</h2><div className="cabinet-grid">{(gov.government?.cabinet||[]).map((x,i)=><article key={i}><strong>{x.office}</strong><span>{x.name}</span></article>)}</div><h2>Riverside Senate</h2><div className="senate-grid">{(gov.government?.senate||[]).map((x,i)=><article key={i}><strong>{x.name}</strong><span>{x.party}</span><small>{x.district} · {x.committee}</small></article>)}</div></main>}


  {tab==="laws"&&<main className="content legal-code-page">
    <div className="page-title"><h1>Gesetzbuch & Strafrecht</h1><p>Öffentliche Übersicht geltender Vorschriften sowie Hinweise zu steuerbezogenen Straftatbeständen.</p></div>
    <section className="law-reference-card">
      <h2>Bestehende Riverside-Gesetzessammlung</h2>
      <p>Die bestehende Gesetzessammlung wird weiterhin unter der bisherigen County-Rechtsseite geführt. Die nachfolgenden steuerbezogenen Bestimmungen ergänzen diese Übersicht.</p>
      <a href="https://riverside-county.vercel.app/gesetze" target="_blank" rel="noreferrer">Vollständige bestehende Gesetzessammlung öffnen →</a>
    </section>
    <section className="tax-criminal-code">
      <h2>Steuerbezogene Straftaten</h2>
      <article><h3>§ RC-TAX-201 — Vorsätzliche Steuerhinterziehung</h3><p>Wer vorsätzlich steuerpflichtige Einnahmen verschweigt, unrichtige Angaben macht, fingierte Abzüge geltend macht oder auf andere Weise versucht, eine rechtmäßig festgesetzte County-Steuer oder deren Zahlung zu umgehen, begeht eine Steuerstraftat. Vorsätzliche und erhebliche Fälle können als Felony verfolgt und an zuständige Strafverfolgungsbehörden abgegeben werden.</p><small>Bundesrechtlicher Bezugspunkt: 26 U.S.C. § 7201 bei Bundessteuern.</small></article>
      <article><h3>§ RC-TAX-202 — Falsche Steuerunterlagen</h3><p>Das bewusste Einreichen materiell falscher oder manipulierter Steuerunterlagen, Erklärungen oder Nachweise kann unabhängig von einer tatsächlich eingetretenen Steuerverkürzung verfolgt werden.</p></article>
      <article><h3>§ RC-TAX-203 — Betrug über Kommunikationssysteme</h3><p>Die bloße Nutzung des Internets, von E-Mail oder Online-Banking macht einen Steuerfall nicht automatisch zu Wire Fraud. Werden solche Kommunikationsmittel jedoch zur Durchführung eines vorsätzlichen Betrugsschemas eingesetzt, können zusätzlich einschlägige Bundesstraftatbestände in Betracht kommen.</p><small>Bundesrechtlicher Bezugspunkt: 18 U.S.C. §§ 1341, 1343.</small></article>
      <article><h3>§ RC-TAX-204 — Verschwörung / gemeinschaftliche Steuerverkürzung</h3><p>Wer mit anderen Personen gezielt zusammenwirkt, um Steuerpflichten zu verbergen, falsche Unterlagen zu erstellen oder Behörden zu täuschen, kann zusätzlich wegen Verschwörung oder Beihilfe verfolgt werden.</p><small>Bundesrechtlicher Bezugspunkt: 18 U.S.C. § 371.</small></article>
      <article><h3>§ RC-TAX-205 — Structuring und Geldwäsche</h3><p>Das absichtliche Aufteilen von Bargeld- oder Banktransaktionen zur Umgehung gesetzlicher Meldepflichten kann unabhängig vom zugrunde liegenden Steuerfall eine eigenständige Straftat darstellen. Geldwäschetatbestände setzen zusätzliche gesetzliche Voraussetzungen voraus.</p><small>Bundesrechtliche Bezugspunkte: 31 U.S.C. § 5324 sowie, soweit einschlägig, 18 U.S.C. §§ 1956–1957.</small></article>
      <article><h3>§ RC-TAX-206 — Nichtzahlung nach Fälligkeit</h3><p>Eine bloße offene Steuerforderung ist nicht automatisch Betrug. RinCEN dokumentiert jedoch Fälligkeit und den Zeitpunkt, zu dem nach County-Regelung eine strafrechtliche Prüfung wegen fortgesetzter vorsätzlicher Nichtzahlung eröffnet werden kann. Irrtümer, technische Zahlungsfehler und rechtzeitig gestellte Rechtsbehelfe sind vor strafrechtlichen Maßnahmen zu prüfen.</p></article>
    </section>
    <section className="law-disclaimer"><strong>Hinweis</strong><p>Bundesrechtliche Verweise dienen der Einordnung. Ob Bundeszuständigkeit besteht, hängt von den tatsächlichen Umständen und den gesetzlichen Tatbestandsmerkmalen ab; sie entsteht nicht allein dadurch, dass eine Steuererklärung online übermittelt wurde.</p></section>
  </main>}

  {tab==="lookup"&&<main className="content taxpayer-lookup-page">
    <div className="page-title"><h1>Öffentliche Taxpayer-Auskunft</h1><p>Grundlegende Registerauskunft anhand einer Riverside Taxpayer ID. Vertrauliche Zugangsdaten, Steuerstände, Zahlungen und interne Vermerke werden nicht angezeigt.</p></div>
    <form className="public-lookup-form" onSubmit={lookupTaxpayer}>
      <label>Riverside Taxpayer ID<input name="taxpayerId" placeholder="RC-TIN-2026-000001" required/></label>
      <button disabled={lookupBusy}>{lookupBusy?"Suche läuft …":"Suchen"}</button>
    </form>
    {lookupResult&&<section className={`lookup-result ${lookupResult.error?"invalid":""}`}>
      {lookupResult.error?<><strong>Keine Auskunft</strong><p>{lookupResult.error}</p></>:<>
        <small>ÖFFENTLICHER REGISTERDATENSATZ</small><h2>{lookupResult.name}</h2>
        <dl><dt>Taxpayer ID</dt><dd>{lookupResult.taxpayerId}</dd><dt>Typ</dt><dd>{lookupResult.classification||"—"}</dd><dt>Status</dt><dd>{lookupResult.status||"—"}</dd></dl>
        <p>Einreichungscode, interne Notizen, Steuerforderungen und Zahlungsdaten sind nicht Bestandteil dieser öffentlichen Auskunft.</p>
      </>}
    </section>}
  </main>}

  {tab==="forms"&&<main className="content public-forms-page">
    <div className="page-title"><h1>Formulare & Eingaben an Riverside County</h1><p>Anträge, Petitionen, steuerbezogene Korrekturen und Eingaben werden registriert und an die zuständige Stelle weitergeleitet.</p></div>
    <form className="county-public-request-form" onSubmit={submitPublicRequest}>
      <div className="row two">
        <label>Antragsart<select name="requestType" required>
          <option value="">Bitte auswählen</option>
          <option value="TAX_REFUND_REVIEW">Prüfung einer möglichen Steuerüberzahlung / Rückerstattung</option>
          <option value="TAXPAYER_ID_RESET">Neuausgabe einer Taxpayer ID</option>
          <option value="FILING_ACCESS_RESET">Neuausgabe des Einreichungscodes</option>
          <option value="PETITION">Petition an Riverside County</option>
          <option value="GOVERNOR_PLEADING">Eingabe / Petition an den Gouverneur</option>
          <option value="GENERAL_ADMINISTRATIVE_REQUEST">Allgemeiner Verwaltungsantrag</option>
        </select></label>
        <label>Taxpayer ID, falls vorhanden<input name="taxpayerId" placeholder="RC-TIN-..."/></label>
      </div>
      <div className="row two"><label>Name der antragstellenden Person<input name="applicantName" required/></label><label>Kontakt / Rückkanal<input name="contact"/></label></div>
      <label>Betreff<input name="subject" required/></label>
      <label>Begründung / Sachverhalt<textarea name="statement" rows="8" required placeholder="Beschreiben Sie den Sachverhalt, relevante Daten, Referenzen und die gewünschte Maßnahme."/></label>
      <label>Rechtsbezug / Referenz<input name="legalReference" placeholder="z. B. RC-TAX-201, Zahlungsreferenz, Aktenzeichen"/></label>
      <div className="form-legal-note"><strong>Wichtiger Hinweis</strong><p>Ein Antrag auf neue Taxpayer ID oder neuen Einreichungscode löst keine automatische Änderung aus. RinCEN prüft die Identität und Berechtigung zunächst manuell. Bei Verdacht auf Identitätsdiebstahl sollten bekannte Referenzen, betroffene Vorgänge und ein sicherer Rückkanal angegeben werden.</p></div>
      <button className="submit-return" disabled={requestBusy}>{requestBusy?"WIRD ÜBERMITTELT …":"ANTRAG EINREICHEN"}</button>
    </form>
  </main>}

  {tab==="taxes"&&<main className="content tax-guide"><div className="page-title"><h1>Steuern & Einreichungshilfe <Help topic="taxes" enabled={help} onOpen={openHelp}/></h1><p>Hinweise zur Auswahl der passenden Kategorie und Buchungsart für Geschäftsvorgänge in Riverside County.</p></div>
    <section className="tax-guide-intro">
      <div><small>RIVERSIDE COUNTY DEPARTMENT OF FINANCE</small><h2>Vor der Einreichung</h2><p>Geschäftstätigkeitsmeldungen verwenden Ihre Riverside Taxpayer ID zur Zuordnung des registrierten Wirtschaftsprofils. Wählen Sie die Kategorie, die den tatsächlichen Vorgang am besten beschreibt, und geben Sie anschließend an, ob es sich um eine Einnahme oder einen meldepflichtigen betrieblichen Abfluss handelt.</p></div>
      <button onClick={()=>setTab("business")}>Zur Steuererklärung →</button>
    </section>
    <section className="direction-guide">
      <article><span className="direction-symbol income">+</span><div><h3>Einnahme / steuerpflichtiger Zufluss</h3><p>Verwenden Sie dies für Geld oder Werte aus Verkäufen, Dienstleistungen, Vermietungen, Verträgen, Eintrittsgeldern oder anderen meldepflichtigen betrieblichen Einnahmen. Die gewählte Kategorie bestimmt die auf diese Einnahme berechnete steuerliche Wirkung.</p></div></article>
      <article><span className="direction-symbol expense">−</span><div><h3>Ausgabe / möglicherweise zulässiger Abzug</h3><p>Verwenden Sie dies für einen gewöhnlichen betrieblichen Abfluss, der nach der einschlägigen County-Regelung die steuerliche Bemessungsgrundlage mindern kann. Er wird als möglicher Abzug und nicht als negative Steuerzahlung erfasst; die Festsetzung kann dadurch höchstens bis auf null sinken.</p></div></article>
    </section>
    <div className="tax-classification-grid">{rules.map(rule=><article key={rule.code}><header><span>{rule.code.replaceAll("_"," ")}</span><strong>{rateLabel(rule)}</strong></header><h3>{rule.name}</h3><p>{rule.description||"Kategorie für Geschäftstätigkeiten des County."}</p><div className="tax-classification-example"><b>Wählen Sie diese Kategorie, wenn:</b> {rule.code==="RETAIL_SALES"?"der Vorgang ein Verkauf von Waren an einen Kunden ist.":rule.code==="PROFESSIONAL_SERVICES"?"das Unternehmen für beratende, professionelle, technische oder fachliche Leistungen bezahlt wird.":rule.code==="CONTRACTING"?"der gemeldete Vorgang aus Bau-, Reparatur-, Installations- oder Auftragnehmertätigkeit stammt.":rule.code==="HOSPITALITY"?"der Vorgang Beherbergung, Unterkunft oder gastgewerbliche Leistungen betrifft.":rule.code==="FOOD_BEVERAGE"?"der Betrag aus zubereiteten Speisen, Restaurant-, Catering- oder Getränketätigkeit stammt.":rule.code==="ENTERTAINMENT"?"der Vorgang Veranstaltungen, Eintritt, Freizeit oder Unterhaltung betrifft.":rule.code==="VEHICLE_RENTAL"?"das Unternehmen Einnahmen oder Werte aus der Vermietung von Fahrzeugen oder Geräten meldet.":rule.code==="PROPERTY_TRANSFER"?"die Meldung eine entsprechende Eigentums- oder Immobilienübertragung betrifft.":rule.code==="UTILITIES"?"der Vorgang Versorgungs- oder Infrastrukturleistungen betrifft.":rule.code==="DIGITAL_COMMERCE"?"der Vorgang über Onlinehandel, digitale Produkte, eine Plattform oder elektronische Dienstleistungen erfolgte.":rule.code==="LUXURY_GOODS"?"der Vorgang ausgewiesene Luxus- oder hochwertige Güter betrifft.":rule.code==="LICENSED_ACTIVITY"?"der Vorgang aus einer Tätigkeit unter einer County-Genehmigung oder Lizenz stammt.":"keine speziellere Kategorie die gewöhnliche Geschäftseinnahme zutreffend beschreibt."}</div></article>)}</div>
    <section className="tax-guide-note"><strong>Wichtig:</strong><p>Der hier angezeigte Satz ist der aktuell im Finanzsystem von Riverside County für diese Kategorie konfigurierte Satz. Diese Hilfe unterstützt bei der Auswahl einer Portal-Kategorie und ersetzt keine formelle Mitteilung, Festsetzung, Befreiungsentscheidung oder konkrete Anweisung des Department of Finance.</p></section>
  </main>}

  {tab==="business"&&<main className="content"><div className="page-title"><h1>Geschäftsvorgänge melden <Help topic="business" enabled={help} onOpen={openHelp}/></h1><p>Riverside County Geschäftsvorgangsmeldung — öffentliche Einreichung mit Zuordnung zum Steuerpflichtigen.</p></div>
    <form className="tax-form" onSubmit={submitFiling}>
      <div className="form-head"><div className="form-number">RC<br/><b>BT-1040</b></div><div><small>RIVERSIDE COUNTY DEPARTMENT OF FINANCE</small><h2>Geschäftstätigkeits- und Steuererklärung</h2><p>Für meldepflichtige betriebliche Einnahmen und mögliche Abzüge</p></div><div className="year">{new Date().getFullYear()}</div></div>

      <section className="taxpayer-identification">
        <div className="taxpayer-identification-head"><div><small>ABSCHNITT A</small><h3>Taxpayer Identification</h3><p>Use the Riverside Taxpayer ID issued to the Wirtschaftsprofil whenever one is available.</p></div><div className="taxpayer-mode-switch"><button type="button" className={taxpayerMode==="tin"?"active":""} onClick={()=>switchTaxpayerMode("tin")}>Ich habe eine Taxpayer ID</button><button type="button" className={taxpayerMode==="manual"?"active":""} onClick={()=>switchTaxpayerMode("manual")}>Keine Taxpayer ID ausgegeben</button></div></div>

        {taxpayerMode==="tin"?<div className="taxpayer-lookup">
          <div className="registered-auth-grid">
            <label><span className="field-label-title">Riverside Taxpayer ID <Help topic="filingTin" enabled={help} onOpen={openHelp}/></span><input value={taxpayerId} onChange={e=>{setTaxpayerId(e.target.value.toUpperCase());setTaxpayer(null);setTaxpayerStatus("idle")}} placeholder="RC-TIN-2026-000001" pattern="RC-TIN-[0-9]{4}-[0-9]{6}" required/></label>
            <label><span className="field-label-title">Einreichungscode <Help topic="filingAccess" enabled={help} onOpen={openHelp}/></span><input type="password" autoComplete="off" value={filingAccessCode} onChange={e=>{setFilingAccessCode(e.target.value.toUpperCase());setTaxpayer(null);setTaxpayerStatus("idle")}} placeholder="RC-FAC-XXXX-XXXX-XXXX" required/></label>
          </div>
          <div className="taxpayer-verify-row"><span>Beide Angaben müssen demselben Wirtschaftsprofil zugeordnet sein.</span><button type="button" onClick={validateTaxpayer} disabled={taxpayerStatus==="loading"}>{taxpayerStatus==="loading"?"Prüfung läuft…":"Steuerpflichtigen & Berechtigung prüfen"}</button></div>
          {taxpayerStatus==="valid"&&taxpayer&&<div className="taxpayer-result valid"><span>✓ STEUERPFLICHTIGER UND EINREICHUNGSBERECHTIGUNG BESTÄTIGT</span><strong>{taxpayer.legalName}</strong><dl><dt>Taxpayer ID</dt><dd>{taxpayer.taxpayerId}</dd><dt>Wirtschaftsprofil</dt><dd>{taxpayer.economicProfileId}</dd><dt>Klassifizierung</dt><dd>{taxpayer.classification||"—"}</dd><dt>Profilstatus</dt><dd>{taxpayer.status||"—"}</dd></dl><p>Der oben angezeigte rechtliche Name wird von RinCEN bereitgestellt. Der Einreichungscode wird nicht im Einreichungsledger gespeichert und darf weder in Beschreibungen kopiert noch an unbeteiligte Personen weitergegeben werden.</p></div>}
          {taxpayerStatus==="invalid"&&<div className="taxpayer-result invalid"><strong>Die Einreichungsberechtigung konnte nicht bestätigt werden.</strong><p>Prüfen Sie sowohl Taxpayer ID als auch Einreichungscode. Aus Sicherheitsgründen zeigt das Portal nicht an, welche der beiden Angaben falsch war; wenn keine Taxpayer ID existiert, verwenden Sie stattdessen das nicht registrierte Altverfahren.</p></div>}
          {taxpayerStatus==="error"&&<div className="taxpayer-result invalid"><strong>Prüfung des Steuerpflichtigen derzeit nicht verfügbar.</strong><p>Der Finanzprofildienst des County konnte nicht erreicht werden. Versuchen Sie die Prüfung vor der Einreichung erneut.</p></div>}
        </div>:<div className="manual-taxpayer-path"><div className="manual-warning"><strong>NICHT REGISTRIERT / ALTVERFAHREN</strong><p>Verwenden Sie diesen Weg nur, wenn dem Unternehmen oder Steuerpflichtigen keine Riverside Taxpayer ID ausgegeben wurde. Dieses Verfahren verknüpft den Vorgang niemals direkt mit dem registrierten Wirtschaftsprofil einer anderen Person und kann eine manuelle Prüfung durch das Department of Finance erfordern.</p></div><label><span className="field-label-title">Rechtlicher Unternehmens- / Steuerpflichtigenname <Help topic="filingManualName" enabled={help} onOpen={openHelp}/></span><input name="businessName" required placeholder="Rechtlichen Namen für diese Einreichung eingeben"/></label></div>}
      </section>

      <div className="row two"><label><span className="field-label-title">Einreichende / verantwortliche Person <Help topic="filingReporter" enabled={help} onOpen={openHelp}/></span><input name="reporterName" required/></label><label><span className="field-label-title">Kontakt / Referenz <Help topic="filingContact" enabled={help} onOpen={openHelp}/></span><input name="contact"/></label></div>
      <section className="filing-lines-section">
        <header><div><small>ABSCHNITT B</small><h3>Positionen der Geschäftstätigkeit</h3><p>Eine einzelne Erklärung kann mehrere Geschäftsvorgänge oder Steuerkategorien enthalten. Legen Sie eine eigene Position an, sobald Datum, Kategorie, Buchungsart, Betrag oder Beschreibung abweichen.</p></div><div className="header-action-with-help"><button type="button" onClick={addLine}>＋ Weitere Position</button><Help topic="filingAddLine" enabled={help} onOpen={openHelp}/></div></header>
        <div className="filing-lines">
          {filingLines.map((line,index)=>{const rule=lineRule(line);const amount=Number(line.amount||0);const estimated=rule?wholeDollar(amount*(Number(rule.rate_basis_points||0)/10000)):0;return <article className="filing-line" key={line.id}>
            <div className="filing-line-number">POSITION {index+1}</div>
            <div className="filing-line-grid">
              <label><span className="field-label-title">Vorgangsdatum <Help topic="filingDate" enabled={help} onOpen={openHelp}/></span><input type="date" value={line.occurredAt} min="1900-01-01" max={today} onChange={e=>updateLine(line.id,"occurredAt",e.target.value)} required/></label>
              <label><span className="field-label-title">Art der Geschäftstätigkeit <Help topic="filingClass" enabled={help} onOpen={openHelp}/></span><select value={line.categoryCode} onChange={e=>updateLine(line.id,"categoryCode",e.target.value)} required><option value="" disabled>Kategorie auswählen</option>{rules.map(r=><option key={r.code} value={r.code}>{r.name} — {rateLabel(r)}</option>)}</select><small className="field-note"><button type="button" className="inline-guide-link" onClick={()=>setTab("taxes")}>Hilfe bei der Auswahl?</button></small></label>
              <label><span className="field-label-title">Buchungsart <Help topic="filingDirection" enabled={help} onOpen={openHelp}/></span><select value={line.direction} onChange={e=>updateLine(line.id,"direction",e.target.value)}><option value="income">Einnahme / steuerpflichtiger Zufluss (+)</option><option value="expense">Ausgabe / möglicherweise zulässiger Abzug</option></select></label>
              <label><span className="field-label-title">Betrag ($) <Help topic="filingAmount" enabled={help} onOpen={openHelp}/></span><input type="number" step="1" min="1" inputMode="numeric" value={line.amount} onChange={e=>updateLine(line.id,"amount",e.target.value)} required/></label>
              <label className="wide"><span className="field-label-title">Beschreibung <Help topic="filingDescription" enabled={help} onOpen={openHelp}/></span><input value={line.description} onChange={e=>updateLine(line.id,"description",e.target.value)} placeholder="Verkauf, Dienstleistung, Vertrag, Ausgabe oder anderen Geschäftsvorgang beschreiben"/></label>
            </div>
            <div className="filing-line-guidance">
              <div><strong>{rule?rule.name:"Kategorie auswählen"}</strong><span>{rule?.description||"Die gewählte Kategorie bestimmt die Behandlung dieser Position."}</span></div>
              <div>{line.direction==="expense"?<><strong>Möglicher Abzug</strong><span>{amount>0?`$${wholeDollar(amount).toLocaleString("de-DE")} als möglicher Abzug gemeldet. Geschätzte Minderung der Festsetzung dieser Position: bis zu $${wholeDollar(estimated).toLocaleString("de-DE")}; niemals eine negative Steuergutschrift.`:"Geben Sie einen Betrag ein, um die mögliche Abzugswirkung zu sehen."}</span></>:<><strong>Geschätzte Festsetzung</strong><span>{amount>0&&rule?`Geschätzte Festsetzung dieser Position: $${wholeDollar(estimated).toLocaleString("de-DE")} vor Abzügen und Zahlungen.`:"Geben Sie Betrag und Kategorie ein, um die Festsetzung zu schätzen."}</span></>}</div>
              <button type="button" className="remove-line" disabled={filingLines.length<=1} onClick={()=>removeLine(line.id)}>Position entfernen</button>
            </div>
          </article>})}
        </div>
      </section>
      <div className="filing-accuracy-warning"><strong>ANGABEN VOR DER EINREICHUNG SORGFÄLTIG PRÜFEN</strong><p>Prüfen Sie Taxpayer ID, rechtlichen Namen, Vorgangsdatum, Betrag, Kategorie, Buchungsart und Beschreibung mindestens zweimal — bei wichtigen Einreichungen möglichst dreimal. Schreibfehler, vertauschte Ziffern, ein falsches Jahr oder eine unzutreffende Kategorie können zur falschen Zuordnung führen oder eine spätere Berichtigung durch das Department of Finance erforderlich machen. Sämtliche Beträge müssen in vollen Dollar ohne Nachkommastellen angegeben werden.</p></div>
      <div className="cert"><label><input type="checkbox" name="certified" required/> <span>Ich bestätige, dass ich die vorstehenden Angaben geprüft habe, sie nach bestem Wissen richtig sind und ich im Namen des bezeichneten Steuerpflichtigen beziehungsweise des genannten nicht registrierten Unternehmens einreiche. <Help topic="filingCertification" enabled={help} onOpen={openHelp}/></span></label></div>
      <div className="submit-with-help"><button className="submit-return">STEUERERKLÄRUNG EINREICHEN</button><Help topic="filingSubmit" enabled={help} onOpen={openHelp}/></div>
      {receipt&&<div className="receipt"><strong>Einreichung eingegangen: {receipt.reference}</strong><span>Registrierter Steuerpflichtiger: {receipt.taxpayerId||"Nicht angegeben"}</span><span>Erfasster Name: {receipt.businessName}</span><span>Geschätzte Bruttofestsetzung: ${wholeDollar(receipt.grossAssessment)}</span><span>Geschätzte Abzugswirkung: −${wholeDollar(receipt.deductionEffect)}</span><span>Geschätzte Nettofestsetzung: ${wholeDollar(receipt.netAssessment)}</span><span>Eingereichte Positionen: {receipt.lineCount||1}</span><span>{receipt.linkedProfile?`Automatisch mit Wirtschaftsprofil ${receipt.linkedProfile} verknüpft.`:"Nicht registrierte Einreichung — gegebenenfalls ist eine manuelle RinCEN-Prüfung erforderlich."}</span></div>}
    </form>
  </main>}

  <footer><img src="/assets/county-seal.png" alt=""/><div><strong>Riverside County Government</strong><span>State of California · Öffentliches Informationsportal</span></div><span>Offizielles County-Netzwerk</span></footer>

  {selectedAgency&&<div className="agency-modal" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedAgency(null)}}><article>
    <header><div><small>RIVERSIDE COUNTY BEHÖRDENVERZEICHNIS</small><h2>{selectedAgency.name}</h2><span>{selectedAgency.abbreviation} · {selectedAgency.status||"—"}</span></div><button onClick={()=>setSelectedAgency(null)}>×</button></header>
    <div className="agency-modal-body"><aside><img src={agencyLogo(selectedAgency)} onError={e=>e.currentTarget.src="/assets/county-seal.png"} alt=""/></aside><section><p className="agency-modal-description">{selectedAgency.description}</p><dl><dt>Behördenleitung</dt><dd>{selectedAgency.administrator||"Nicht eingetragen"}</dd><dt>County-Durchwahl</dt><dd>{selectedAgency.extension||"—"}</dd><dt>Kategorie</dt><dd>{selectedAgency.category||"—"}</dd><dt>Rechtsgrundlage</dt><dd>{selectedAgency.legalAuthority||"—"}</dd><dt>Status</dt><dd>{selectedAgency.status||"—"}</dd></dl>{selectedAgency.websiteUrl&&<a className="agency-website" href={selectedAgency.websiteUrl} target="_blank" rel="noreferrer">Behördenwebsite / Terminal öffnen →</a>}</section></div>
    <footer><span>Datenquelle: County Governance Network</span><button onClick={()=>setSelectedAgency(null)}>Schließen</button></footer>
  </article></div>}

  {drawer&&<aside className="help-drawer"><button onClick={()=>setDrawer(null)}>×</button><small>ÖFFENTLICHE HILFE</small><h2>{drawer[0]}</h2><p>{drawer[1]}</p><p>Diese Hilfe erläutert die Bedienung der Website und begründet für sich allein keine Rechte, Fristen oder behördlichen Befugnisse.</p></aside>}
 </div>;
}
