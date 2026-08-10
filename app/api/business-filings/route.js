import crypto from "node:crypto";
import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {ensureDatabase} from "@/lib/setup";
export const dynamic="force-dynamic";

function normalize(v=""){return String(v).trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/&/g," and ").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ")}
function normalizeTin(v=""){return String(v).trim().toUpperCase()}
function validDate(value){
 const s=String(value||"");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const d=new Date(`${s}T12:00:00Z`);
 if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==s)return false;
 const year=Number(s.slice(0,4));
 return year>=1900 && d.getTime()<=Date.now()+86400000;
}
async function findTaxpayer(sql,taxpayerId){
 const tin=normalizeTin(taxpayerId);
 if(!/^RC-TIN-\d{4}-\d{6}$/.test(tin))return null;
 const rows=await sql`
  SELECT account
  FROM rcdf_portal_state s
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s.state->'accounts','[]'::jsonb)) account
  WHERE s.id=1 AND UPPER(account->>'taxpayerId')=${tin}
  LIMIT 1`;
 return rows[0]?.account||null;
}
function normalizeFilingCode(v=""){return String(v).trim().toUpperCase()}
function secureEqual(a,b){
 const aa=Buffer.from(String(a||"")),bb=Buffer.from(String(b||""));
 return aa.length===bb.length && crypto.timingSafeEqual(aa,bb);
}
function requestIpHash(req){
 const raw=String(req.headers.get("x-forwarded-for")||req.headers.get("x-real-ip")||"unknown").split(",")[0].trim();
 return crypto.createHash("sha256").update(raw).digest("hex");
}
async function tooManyFailures(sql,tin,ipHash){
 const rows=await sql`SELECT COUNT(*)::int AS count FROM county_public_filing_attempts
   WHERE success=FALSE AND attempted_at>NOW()-INTERVAL '15 minutes'
   AND (taxpayer_id=${tin} OR ip_hash=${ipHash})`;
 return Number(rows[0]?.count||0)>=8;
}
async function recordAttempt(sql,tin,ipHash,success){
 await sql`INSERT INTO county_public_filing_attempts(taxpayer_id,ip_hash,success)
   VALUES(${tin||null},${ipHash},${Boolean(success)})`;
}
async function authorizeRegisteredFiling(sql,req,taxpayerId,filingCode){
 const tin=normalizeTin(taxpayerId),code=normalizeFilingCode(filingCode),ipHash=requestIpHash(req);
 if(await tooManyFailures(sql,tin,ipHash))return {ok:false,status:429,error:"Too many failed verification attempts. Try again later."};
 const account=await findTaxpayer(sql,tin);
 const stored=String(account?.filingAccessCode||"").trim().toUpperCase();
 const ok=Boolean(account&&stored&&code&&secureEqual(stored,code));
 await recordAttempt(sql,tin,ipHash,ok);
 if(!ok)return {ok:false,status:404,error:"Taxpayer authorization could not be verified."};
 return {ok:true,account};
}

export async function GET(){
 try{
  await ensureDatabase();const sql=db();
  const rows=await sql`SELECT code,name,rate_basis_points,description FROM county_tax_rules WHERE active=TRUE ORDER BY sort_order,name`;
  return NextResponse.json({rules:rows});
 }catch(e){console.error("GET /api/business-filings",e);return NextResponse.json({error:"Tax filing service unavailable."},{status:500})}
}

export async function POST(req){
 try{
  await ensureDatabase();const b=await req.json(),sql=db();
  const requestedTin=normalizeTin(b.taxpayerId),filingCode=normalizeFilingCode(b.filingCode);
  if(b.action==="verify"){
    const auth=await authorizeRegisteredFiling(sql,req,requestedTin,filingCode);
    if(!auth.ok)return NextResponse.json({valid:false,error:auth.error},{status:auth.status});
    const account=auth.account;
    return NextResponse.json({valid:true,taxpayer:{taxpayerId:account.taxpayerId,economicProfileId:account.id,legalName:account.holder,classification:account.classification||null,status:account.status||null}});
  }
  const reporter=String(b.reporterName||"").trim(),noTaxpayerId=Boolean(b.noTaxpayerId);
  if(!reporter)return NextResponse.json({error:"Reporter / responsible person is required."},{status:400});
  if(!b.certified)return NextResponse.json({error:"Certification is required before filing."},{status:400});

  let businessName="",economicProfileId=null,taxpayerId=null,unregistered=false;
  if(!noTaxpayerId){
    if(!requestedTin)return NextResponse.json({error:"A Riverside Taxpayer ID is required or the unregistered filing path must be selected."},{status:400});
    const auth=await authorizeRegisteredFiling(sql,req,requestedTin,filingCode);
    if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status});
    const account=auth.account;
    businessName=String(account.holder||"").trim();economicProfileId=String(account.id||"").trim()||null;taxpayerId=String(account.taxpayerId||requestedTin).trim().toUpperCase();
    if(!businessName||!economicProfileId)return NextResponse.json({error:"The taxpayer profile is incomplete and cannot be used for public filing."},{status:409});
  }else{
    businessName=String(b.businessName||"").trim();
    if(!businessName)return NextResponse.json({error:"Enter the legal taxpayer or business name for an unregistered filing."},{status:400});
    unregistered=true;
  }

  const rawLines=Array.isArray(b.lines)&&b.lines.length?b.lines:[{occurredAt:b.occurredAt,categoryCode:b.categoryCode,direction:b.direction,amount:b.amount,description:b.description}];
  if(rawLines.length>25)return NextResponse.json({error:"A single filing may contain at most 25 activity lines."},{status:400});

  const rules=await sql`SELECT code,name,rate_basis_points,description FROM county_tax_rules WHERE active=TRUE`;
  const ruleMap=new Map(rules.map(r=>[r.code,r]));
  const lines=[];
  for(let i=0;i<rawLines.length;i++){
    const source=rawLines[i]||{},categoryCode=String(source.categoryCode||"").trim(),direction=source.direction==="expense"?"expense":"income",
      amount=Number(source.amount),occurredAt=String(source.occurredAt||"").trim(),description=String(source.description||"").trim();
    const rule=ruleMap.get(categoryCode);
    if(!rule)return NextResponse.json({error:`Line ${i+1}: unknown activity classification.`},{status:400});
    if(!validDate(occurredAt))return NextResponse.json({error:`Line ${i+1}: transaction date must be a valid four-digit year between 1900 and today.`},{status:400});
    if(!Number.isFinite(amount)||amount<=0)return NextResponse.json({error:`Line ${i+1}: amount must be greater than zero.`},{status:400});
    const rate=Number(rule.rate_basis_points)/10000;
    lines.push({lineNumber:i+1,categoryCode,direction,amount,occurredAt,description,rule,rate,
      grossAmount:direction==="expense"?-amount:amount,
      taxAmount:direction==="income"?Math.round(amount*rate*100)/100:0,
      deductionAmount:direction==="expense"?amount:0,
      deductionEffect:direction==="expense"?Math.round(amount*rate*100)/100:0});
  }

  const sequence=await sql`SELECT nextval('county_business_filing_seq')::bigint AS value`;
  const filingReference=`RC-BT-${new Date().getFullYear()}-${String(sequence[0].value).padStart(7,"0")}`;
  const normalized=normalize(businessName);
  const ids=[];
  for(const line of lines){
    const rows=await sql`
      INSERT INTO county_business_tax_ledger
        (source,record_kind,business_name,normalized_business_name,filer_name,player_name,
         activity_code,direction,gross_amount,tax_rate,tax_amount,deduction_amount,payment_amount,
         occurred_at,description,economic_profile_id,taxpayer_id,filing_reference,metadata)
      VALUES
        ('county_public_filing','activity',${businessName},${normalized},${reporter},${reporter},
         ${line.categoryCode},${line.direction},${line.grossAmount},${line.rate},${line.taxAmount},${line.deductionAmount},0,
         ${line.occurredAt},${line.description},${economicProfileId},${taxpayerId},${filingReference},
         ${JSON.stringify({certified:true,contact:b.contact||"",ruleName:line.rule.name,lineNumber:line.lineNumber,taxpayerResolution:unregistered?"unregistered_manual":"validated_taxpayer_id_and_filing_code",unregisteredTaxpayer:unregistered})}::jsonb)
      RETURNING public_id`;
    ids.push(rows[0].public_id);
  }

  const grossAssessment=Math.round(lines.reduce((n,l)=>n+l.taxAmount,0)*100)/100;
  const deductionEffect=Math.round(lines.reduce((n,l)=>n+l.deductionEffect,0)*100)/100;
  const netAssessment=Math.max(0,Math.round((grossAssessment-deductionEffect)*100)/100);

  return NextResponse.json({ok:true,reference:filingReference,ledgerReferences:ids,lineCount:lines.length,grossAssessment,deductionEffect,netAssessment,linkedProfile:economicProfileId,taxpayerId,businessName});
 }catch(e){console.error("POST /api/business-filings",e);return NextResponse.json({error:"Filing could not be stored."},{status:500})}
}
