import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {ensureDatabase} from "@/lib/setup";
export const dynamic="force-dynamic";

function normalize(v=""){return String(v).trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/&/g," and ").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ")}

export async function GET(){
 try{
  await ensureDatabase();const sql=db();
  const rows=await sql`SELECT code,name,rate_basis_points,description FROM county_tax_rules WHERE active=TRUE ORDER BY sort_order,name`;
  return NextResponse.json({rules:rows});
 }catch(e){console.error("GET /api/business-filings",e);return NextResponse.json({error:"Tax rules unavailable"},{status:500})}
}

export async function POST(req){
 try{
  await ensureDatabase();const b=await req.json();const sql=db();
  const businessName=String(b.businessName||"").trim(),activityCode=String(b.categoryCode||"").trim(),
    direction=b.direction==="expense"?"expense":"income",amount=Number(b.amount),
    reporter=String(b.reporterName||"").trim(),description=String(b.description||"").trim();

  if(!businessName||!activityCode||!reporter||!Number.isFinite(amount)||amount<=0)
    return NextResponse.json({error:"Business, reporter, category and positive amount required."},{status:400});
  if(!b.certified)return NextResponse.json({error:"Certification is required before filing."},{status:400});

  const rr=await sql`SELECT code,name,rate_basis_points FROM county_tax_rules WHERE code=${activityCode} AND active=TRUE LIMIT 1`;
  if(!rr.length)return NextResponse.json({error:"Unknown tax category."},{status:400});

  const rule=rr[0],signed=direction==="expense"?-amount:amount,
    taxRate=Number(rule.rate_basis_points)/10000,
    tax=Math.round(signed*taxRate*100)/100,n=normalize(businessName);
  const alias=(await sql`SELECT economic_profile_id FROM county_business_aliases WHERE normalized_name=${n} LIMIT 1`)[0];

  const rows=await sql`
    INSERT INTO county_business_tax_ledger
      (source,record_kind,business_name,normalized_business_name,filer_name,player_name,
       activity_code,direction,gross_amount,tax_rate,tax_amount,payment_amount,
       occurred_at,description,economic_profile_id,metadata)
    VALUES
      ('county_public_filing','activity',${businessName},${n},${reporter},${reporter},
       ${activityCode},${direction},${signed},${taxRate},${tax},0,
       ${b.occurredAt||new Date().toISOString()},${description},${alias?.economic_profile_id||null},
       ${JSON.stringify({certified:true,contact:b.contact||"",ruleName:rule.name})}::jsonb)
    RETURNING public_id,tax_amount,economic_profile_id
  `;
  return NextResponse.json({ok:true,reference:rows[0].public_id,taxImpact:Number(rows[0].tax_amount),linkedProfile:rows[0].economic_profile_id||null});
 }catch(e){console.error("POST /api/business-filings",e);return NextResponse.json({error:"Filing could not be stored."},{status:500})}
}
