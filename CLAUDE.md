# FactFit: ปรับ resume ให้ตรงประกาศงาน โดยไม่แต่งข้อเท็จจริง

> สถานะ (2026-11-13): **อ่าน `HANDOFF.md` ก่อน** · deploy แล้ว 79a26f0 ที่ https://factfit-five.vercel.app: polish UI ตาม CLAUDE_DESIGN_GUIDE.md (ตัด slop, animation เล่นจบแล้วหยุด + scroll entrance ที่ไม่ซ่อนเนื้อหา, touch target 44px, ข้อความทุกตัวเลขตรง eval/README.md) · ประโยค demo ทั้งหมดอยู่ใน `src/lib/demo-drafts.ts` และ verdict มาจาก guard จริง (มี test) · ภาพหน้าจอ README ใหม่ครบ รวม guard sandbox กับ pipeline · ก่อนหน้า: Settings (Account/Security/Your data), Google login บน prod, provider ที่สอง FreeLLMAPI (local เท่านั้น) · import resume (.docx/.pdf) พร้อมหน้าตรวจแก้ commit แล้ว ยังไม่ deploy · guard ยังบล็อกผิดกับ % ที่คำนวณได้และตัวย่อ
>
> Production: Supabase project เดียวกับ HarnKan/SlipJot (ref ddyjypurrrzasbtfwncs) แยก schema `factfit` · ค่า production อยู่ใน `.env.vercel-production` (gitignored) · runtime ใช้ transaction pooler :6543 + DB_POOL_MAX=8 (ห้ามใช้ session pooler เพราะจำกัด 15 client ทั้ง project) · migrate ใช้ MIGRATE_DATABASE_URL (:5432) · deploy ด้วย `npx vercel@latest deploy --prod --yes` (GitHub ต่อกับ Vercel ไม่ได้เพราะ repo private)
> Stack: Next.js 16 + Supabase (Auth + Postgres, dev ใช้ `npx supabase start` ใน Docker) + Drizzle + Gemini (Flash-Lite ก่อน) · Node 26 อยู่ที่ `C:\Program Files\nodejs`

## เจ้าของโปรเจกต์
Nawat Wattanawong นักศึกษาวิทยาการคอมพิวเตอร์ มช. ปี 3 เป้าหมายคือสาย **full-stack**
จะไปสหกิจเต็มเทอมที่กรุงเทพ ช่วง มิ.ย.–ต.ค. 2027 ซึ่งบริษัทเปิดรับสมัครช่วง พ.ย. 2026–ก.พ. 2027

- Resume ล่าสุด: `C:\Users\User\Desktop\resume\Nawat_Wattanawong_Resume_v2.docx` / `.pdf`
- Portfolio: https://vector033.github.io (source อยู่ที่ `C:\Users\User\Desktop\portfolio`)
- GitHub: Vector033
- ผลงานเด่นที่มีอยู่แล้ว: Project Z (Software Architect, FastAPI 3 services, Vue 3, Firestore, Gemini, test หนัก)

## ปัญหาที่แก้
คนสมัครงานส่ง resume ฉบับเดียวไปทุกที่ หรือให้ ChatGPT เขียนให้ ผลคือภาษาซ้ำกับคนอื่น และ AI มักแต่งตัวเลขหรือผลงานขึ้นมาเอง
FactFit ช่วยให้ resume ตรงกับประกาศงานแต่ละตำแหน่ง โดยทุกประโยคต้องย้อนกลับไปหาข้อเท็จจริงที่ผู้ใช้กรอกไว้ได้

หลักการมาจากคลิป Jeff Su "Write a Killer Résumé in the AI Era":
- จับคู่ keyword กับประกาศ แต่ไม่ยัด keyword
- ใช้สูตร XYZ ของ Google (ทำ X วัดผลด้วย Y โดยวิธี Z)
- ห้ามเปลี่ยนหรือเพิ่มตัวเลข

## ผู้ใช้
- คนแรกคือ Nawat เอง ใช้กับใบสมัครสหกิจจริง
- ต่อไปคือเพื่อนนักศึกษาที่สมัครฝึกงานหรืองานแรก

## MVP (ต้องมี)
1. **Fact bank:** ผู้ใช้กรอกประสบการณ์และโปรเจกต์เป็นข้อเท็จจริงสั้น ๆ (ทำอะไร ผลเป็นอย่างไร ตัวเลข) หรือ import จาก resume (.docx/.pdf) แล้วตรวจแก้เอง
2. **วาง job description** แล้วระบบดึง skill, keyword และปัญหาที่นายจ้างต้องการแก้ ออกมาเป็นรายการ
3. **Mapping:** แสดงว่า keyword ไหนมีหลักฐานใน fact bank แล้ว ข้อไหนขาด และให้คะแนนความตรงเป็น %
4. **เสนอ bullet ใหม่** ตามสูตร XYZ แต่ละ bullet แสดง fact ที่ใช้อ้างอิง และ bullet ที่อ้างอิงไม่ได้ต้องถูกบล็อก
5. **Export** resume แบบคอลัมน์เดียว เป็น PDF ที่เลือกข้อความได้ (ATS อ่านได้) ขนาดต่ำกว่า 2.5 MB
6. มี login และบันทึกหลายเวอร์ชันได้ (หนึ่งเวอร์ชันต่อหนึ่งงานที่สมัคร)

## จุดขายสำหรับ portfolio
- **Fabrication guard:** ตรวจว่าทุกตัวเลขและทุกชื่อเทคโนโลยีใน output มีอยู่ใน fact bank ทำด้วยโค้ดตรวจ ไม่ได้เชื่อ LLM อย่างเดียว
- **Eval set:** อย่างน้อย 30 คู่ JD + fact bank ที่วัดได้
  - อัตราการแต่งตัวเลข เป้าหมาย 0%
  - keyword recall
  - ความยาวของ bullet
- ตัวเลขที่ควรได้มาใส่ resume เช่น "จับการแต่งตัวเลขได้ X% บน eval Y เคส" หรือ "ใช้เองกับใบสมัคร N ที่"

## ไม่ทำในรอบนี้
ไม่ทำ cover letter, ไม่ส่งใบสมัครอัตโนมัติ, ไม่ทำ template หลายแบบ (คอลัมน์เดียวแบบเดียวพอ) และไม่ทำภาษาไทย (รอบแรกทำ resume ภาษาอังกฤษก่อน)

## Stack ที่แนะนำ (ปรับได้ แต่ต้องคุยกับผู้ใช้ก่อน)
- Next.js (App Router) + TypeScript + Tailwind
- Postgres (Supabase หรือ Neon) + Drizzle ORM
- Auth.js หรือ Supabase Auth
- LLM: Gemini หรือ Claude ผ่าน API แยก adapter ไว้ให้เปลี่ยนเจ้าได้ และใช้ structured output (JSON schema)
- PDF: ใช้ `@react-pdf/renderer` หรือ HTML → PDF ผ่าน Playwright
- Test: Vitest + Playwright, ใช้ GitHub Actions เป็น CI
- Deploy: Vercel

Stack นี้ตั้งใจให้เป็นฐานที่เอาไปใช้ต่อกับ MorPlan, HarnKan และ SlipJot ได้

## สิ่งที่ต้องรู้ก่อนเริ่ม
- เครื่องมี Docker Desktop และ Python 3.12 อยู่แล้ว ระบบเป็น Windows 10
- API key ใส่ใน `.env.local` และห้าม commit
- ข้อมูลใน resume เป็นข้อมูลส่วนบุคคล (PDPA) ให้เก็บน้อยที่สุด และผู้ใช้ต้องลบข้อมูลของตัวเองได้

## Milestones (ประมาณ 2–3 สัปดาห์)
1. Scaffold, auth, schema ของ fact bank, CRUD และ deploy หน้าว่างขึ้น Vercel
2. ดึงข้อมูลจาก JD, หน้า mapping และคะแนนความตรง
3. สร้าง bullet พร้อม fabrication guard, eval script และ export PDF
4. Polish, README ที่มีภาพหน้าจอกับตัวเลข eval แล้วใช้กับใบสมัครจริง

## Definition of done
- มีลิงก์ใช้งานจริง และ README มีภาพหน้าจอ ลิงก์ ตัวเลข eval และวิธีรัน
- Test ผ่านใน CI
- เพิ่มบรรทัดโปรเจกต์ลงใน resume และใน portfolio ส่วน "Other projects"

## วิธีทำงานกับผู้ใช้
- ตอบผู้ใช้เป็นภาษาไทย
- ถามก่อน push ขึ้น GitHub หรือ deploy ทุกครั้ง
- ห้ามสร้างข้อมูลผลงานปลอมใส่ resume ของผู้ใช้
