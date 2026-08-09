import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {ensureDatabase} from "@/lib/setup";
export const dynamic="force-dynamic";

function normalize(v=""){return String(v).trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/&/g," and ").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ")}
function normalizeTin(v=""){return String(v).trim().toUpperCase()}

async function findTaxpayer(sql,taxpayerId){
 const tin=normalizeTin(taxpayerId);
 if(!/^RC-TIN-\d{4}-\d{6}$/.test(tin))return null;
 try{
   const rows=await sql`
    SELECT account
    FROM rcdf_portal_state s
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s.state->'accounts','[]'::jsonb)) account
    WHERE s.id=1 AND UPPER(account->>'taxpayerId')=${tin}
    LIMIT 1
   `;
   return rows[0]?.account||null;
 }catch(error){
   console.error("Taxpayer lookup failed",error);
   return null;
 }
}

export async function GET(req){
 try{
  await ensureDatabase();const sql=db();
  const {searchParams}=new URL(req.url);
  const taxpayerId=searchParams.get("taxpayerId");
  if(taxpayerId){
    const account=await findTaxpayer(sql,taxpayerId);
    if(!account)return NextResponse.json({valid:false,error:"Taxpayer ID not found."},{status:404});
    return NextResponse.json({valid:true,taxpayer:{
      taxpayerId:account.taxpayerId,
      economicProfileId:account.id,
      legalName:account.holder,
      classification:account.classification||null,
      status:account.status||null
    }});
  }
  const rows=await sql`SELECT code,name,rate_basis_points,description FROM county_tax_rules WHERE active=TRUE ORDER BY sort_order,name`;
  return NextResponse.json({rules:rows});
 }catch(e){console.error("GET /api/business-filings",e);return NextResponse.json({error:"Tax filing service unavailable."},{status:500})}
}

export async function POST(req){
 try{
  await ensureDatabase();const b=await req.json();const sql=db();
  const activityCode=String(b.categoryCode||"").trim(),direction=b.direction==="expense"?"expense":"income",
    amount=Number(b.amount),reporter=String(b.reporterName||"").trim(),description=String(b.description||"").trim(),
    noTaxpayerId=Boolean(b.noTaxpayerId),requestedTin=normalizeTin(b.taxpayerId);

  if(!activityCode||!reporter||!Number.isFinite(amount)||amount<=0)
    return NextResponse.json({error:"Reporter, activity classification and a positive amount are required."},{status:400});
  if(!b.certified)return NextResponse.json({error:"Certification is required before filing."},{status:400});

  let businessName="",economicProfileId=null,taxpayerId=null,unregistered=false;
  if(!noTaxpayerId){
    if(!requestedTin)return NextResponse.json({error:"A Riverside Taxpayer ID is required or the unregistered filing path must be selected."},{status:400});
    const account=await findTaxpayer(sql,requestedTin);
    if(!account)return NextResponse.json({error:"The Riverside Taxpayer ID could not be validated."},{status:400});
    businessName=String(account.holder||"").trim();
    economicProfileId=String(account.id||"").trim()||null;
    taxpayerId=String(account.taxpayerId||requestedTin).trim().toUpperCase();
    if(!businessName||!economicProfileId)return NextResponse.json({error:"The taxpayer profile is incomplete and cannot be used for public filing."},{status:409});
  }else{
    businessName=String(b.businessName||"").trim();
    if(!businessName)return NextResponse.json({error:"Enter the legal taxpayer or business name for an unregistered filing."},{status:400});
    unregistered=true;
  }

  const rr=await sql`SELECT code,name,rate_basis_points,description FROM county_tax_rules WHERE code=${activityCode} AND active=TRUE LIMIT 1`;
  if(!rr.length)return NextResponse.json({error:"Unknown tax category."},{status:400});

  const rule=rr[0],signed=direction==="expense"?-amount:amount,
    taxRate=Number(rule.rate_basis_points)/10000,
    tax=Math.round(signed*taxRate*100)/100,n=normalize(businessName);

  const rows=await sql`
    INSERT INTO county_business_tax_ledger
      (source,record_kind,business_name,normalized_business_name,filer_name,player_name,
       activity_code,direction,gross_amount,tax_rate,tax_amount,payment_amount,
       occurred_at,description,economic_profile_id,taxpayer_id,metadata)
    VALUES
      ('county_public_filing','activity',${businessName},${n},${reporter},${reporter},
       ${activityCode},${direction},${signed},${taxRate},${tax},0,
       ${b.occurredAt||new Date().toISOString()},${description},${economicProfileId},${taxpayerId},
       ${JSON.stringify({
         certified:true,contact:b.contact||"",ruleName:rule.name,
         taxpayerResolution:unregistered?"unregistered_manual":"validated_taxpayer_id",
         unregisteredTaxpayer:unregistered
       })}::jsonb)
    RETURNING public_id,tax_amount,economic_profile_id,taxpayer_id,business_name
  `;
  return NextResponse.json({
    ok:true,reference:rows[0].public_id,taxImpact:Number(rows[0].tax_amount),
    linkedProfile:rows[0].economic_profile_id||null,taxpayerId:rows[0].taxpayer_id||null,
    businessName:rows[0].business_name
  });
 }catch(e){console.error("POST /api/business-filings",e);return NextResponse.json({error:"Filing could not be stored."},{status:500})}
}
