import {NextResponse} from "next/server";
const RINCEN="https://rc-financedepartment.vercel.app";
export async function POST(request){
 try{const body=await request.json();const r=await fetch(`${RINCEN}/api/public-taxpayer-lookup`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"});const p=await r.json().catch(()=>({}));return NextResponse.json(p,{status:r.status});}
 catch(e){return NextResponse.json({error:"Taxpayer-Auskunft derzeit nicht erreichbar."},{status:502})}
}