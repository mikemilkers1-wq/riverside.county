import { db } from "./db";
let ready;
export async function ensureDatabase(){
 if(ready)return ready;
 ready=(async()=>{const sql=db();
  await sql`CREATE TABLE IF NOT EXISTS county_governance_state (id INTEGER PRIMARY KEY CHECK(id=1),state JSONB NOT NULL,version INTEGER NOT NULL DEFAULT 1,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_by_department TEXT,updated_by_employee TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS county_public_announcements (id BIGSERIAL PRIMARY KEY,title TEXT NOT NULL,summary TEXT NOT NULL,body TEXT,category TEXT NOT NULL DEFAULT 'County Notice',published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),expires_at TIMESTAMPTZ,active BOOLEAN NOT NULL DEFAULT TRUE)`;
  const c=await sql`SELECT COUNT(*)::int AS count FROM county_public_announcements`;
  if(Number(c[0]?.count||0)===0){
    await sql`INSERT INTO county_public_announcements(title,summary,body,category) VALUES
      ('County Government Portal Online','The Riverside County Government public information portal is now available.','Residents and businesses may use this site to review county government information, agencies and public notices.','County Notice'),
      ('Business Transaction Filing Available','Businesses may now file reportable transactions through the county portal.','Submitted transactions are transmitted to the county financial ledger and may later be associated with a RinCEN Wirtschaftsprofil.','Business')`;
  }
  await sql`CREATE SEQUENCE IF NOT EXISTS county_tax_ledger_seq START 1`;
  await sql`CREATE TABLE IF NOT EXISTS county_tax_rules (code TEXT PRIMARY KEY,name TEXT NOT NULL,rate_basis_points INTEGER NOT NULL,description TEXT,active BOOLEAN NOT NULL DEFAULT TRUE,sort_order INTEGER NOT NULL DEFAULT 0)`;
  const rules=[
   ['GENERAL_RECEIPTS','General Business Receipts',500,'Allgemeine gewerbliche Einnahmen und sonstige betriebliche Erlöse.',10],
   ['RETAIL_SALES','Retail Sales',725,'Verkauf von Waren im Einzelhandel.',20],
   ['PROFESSIONAL_SERVICES','Professional Services',450,'Professionelle oder beratende Dienstleistungen.',30],
   ['CONTRACTING','Contracting & Construction',350,'Bau-, Reparatur- und Werkleistungen.',40],
   ['HOSPITALITY','Hospitality & Lodging',825,'Beherbergung und gastgewerbliche Umsätze.',50],
   ['FOOD_BEVERAGE','Food & Beverage',650,'Speisen, Getränke und gastronomische Umsätze.',60],
   ['ENTERTAINMENT','Entertainment & Events',775,'Veranstaltungen, Eintritt und Unterhaltung.',70],
   ['VEHICLE_RENTAL','Vehicle & Equipment Rental',900,'Vermietung von Fahrzeugen und Geräten.',80],
   ['PROPERTY_TRANSFER','Property Transfer',125,'Meldepflichtige Grundstücks- und Immobilienübertragungen.',90],
   ['UTILITIES','Utilities & Infrastructure',300,'Versorgungs- und infrastrukturelle Leistungen.',100],
   ['DIGITAL_COMMERCE','Digital Commerce',525,'Digitale Waren, Plattform- und Onlineumsätze.',110],
   ['LUXURY_GOODS','Luxury & High-Value Goods',1100,'Luxus- und hochwertige Waren.',120],
   ['LICENSED_ACTIVITY','Licensed / Permit Activity',600,'Erlaubnis- oder lizenzgebundene Geschäftstätigkeit.',130]
  ];
  for(const r of rules)await sql`INSERT INTO county_tax_rules(code,name,rate_basis_points,description,sort_order) VALUES(${r[0]},${r[1]},${r[2]},${r[3]},${r[4]}) ON CONFLICT(code) DO NOTHING`;
  await sql`CREATE TABLE IF NOT EXISTS county_business_aliases (
    normalized_name TEXT PRIMARY KEY,
    display_name TEXT NOT NULL DEFAULT '',
    economic_profile_id TEXT,
    linked_by_employee TEXT,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE county_business_aliases ADD COLUMN IF NOT EXISTS display_name TEXT`;
  await sql`ALTER TABLE county_business_aliases ADD COLUMN IF NOT EXISTS economic_profile_id TEXT`;
  await sql`ALTER TABLE county_business_aliases ADD COLUMN IF NOT EXISTS linked_by_employee TEXT`;
  await sql`ALTER TABLE county_business_aliases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;

  await sql`CREATE TABLE IF NOT EXISTS county_business_tax_ledger (
    id BIGSERIAL PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE DEFAULT ('CTX-'||EXTRACT(YEAR FROM NOW())::int::text||'-'||LPAD(nextval('county_tax_ledger_seq')::text,7,'0')),
    source TEXT NOT NULL,
    record_kind TEXT NOT NULL,
    business_name TEXT NOT NULL,
    normalized_business_name TEXT NOT NULL,
    filer_name TEXT,
    player_name TEXT,
    activity_code TEXT,
    direction TEXT,
    gross_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    payment_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT,
    economic_profile_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE county_business_tax_ledger ADD COLUMN IF NOT EXISTS filer_name TEXT`;
  await sql`ALTER TABLE county_business_tax_ledger ADD COLUMN IF NOT EXISTS activity_code TEXT`;
  await sql`ALTER TABLE county_business_tax_ledger ADD COLUMN IF NOT EXISTS direction TEXT`;
  await sql`ALTER TABLE county_business_tax_ledger ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(8,4) NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE county_business_tax_ledger ADD COLUMN IF NOT EXISTS description TEXT`;
  await sql`ALTER TABLE county_business_tax_ledger ADD COLUMN IF NOT EXISTS economic_profile_id TEXT`;
  await sql`ALTER TABLE county_business_tax_ledger ADD COLUMN IF NOT EXISTS taxpayer_id TEXT`;
  await sql`CREATE INDEX IF NOT EXISTS county_business_tax_ledger_business_idx ON county_business_tax_ledger(normalized_business_name,occurred_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS county_business_tax_ledger_profile_idx ON county_business_tax_ledger(economic_profile_id,occurred_at DESC)`;

 })();return ready;
}
