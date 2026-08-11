import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const RINCEN_ENDPOINT = "https://rc-financedepartment.vercel.app/api/public-tax-filing";

function forwardedHeaders(req){
 const headers={"Content-Type":"application/json","Accept":"application/json"};
 const xff=req.headers.get("x-forwarded-for"),xri=req.headers.get("x-real-ip");
 if(xff)headers["x-forwarded-for"]=xff;if(xri)headers["x-real-ip"]=xri;return headers;
}
async function relay(response){const body=await response.json().catch(()=>({error:"RinCEN lieferte keine gültige Antwort."}));return NextResponse.json(body,{status:response.status,headers:{"Cache-Control":"no-store"}})}
export async function GET(){try{return relay(await fetch(RINCEN_ENDPOINT,{method:"GET",cache:"no-store",headers:{Accept:"application/json"}}))}catch(error){console.error("County -> RinCEN filing GET",error);return NextResponse.json({error:"Die Verbindung zum Riverside County Department of Finance ist derzeit nicht verfügbar."},{status:502})}}
export async function POST(req){try{const raw=await req.text();return relay(await fetch(RINCEN_ENDPOINT,{method:"POST",cache:"no-store",headers:forwardedHeaders(req),body:raw}))}catch(error){console.error("County -> RinCEN filing POST",error);return NextResponse.json({error:"Die Steuererklärung konnte nicht an RinCEN übermittelt werden. Es wurde keine Festsetzung erstellt."},{status:502})}}
