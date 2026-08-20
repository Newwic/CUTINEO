# CUTINEO — รวมทุกแชทไว้ในที่เดียว

หน้าเว็บต้นแบบสำหรับ CUTINEO ระบบรวมแชทสำหรับทีมขาย สร้างด้วย React + Vite และออกแบบให้เปิดดูได้บน GitHub Pages

## ในหน้านี้มีอะไรบ้าง

- Hero พร้อมตัวอย่างกล่องข้อความกลางจากหลายช่องทาง
- ฟีเจอร์รวมแชท, NEO ช่วยแนะนำคำตอบ และ Workflow อัตโนมัติ
- ตารางแพ็กเกจ Basic, Pro, Advanced และ Enterprise
- สลับราคาการชำระรายเดือน/รายปี
- ตารางเปรียบเทียบฟีเจอร์และ layout แบบ responsive สำหรับมือถือ
- ฟอร์มทดลองใช้งาน/ติดต่อทีมแบบเดโม พร้อม validation และสถานะ toast
- กล่องแชทเดโมที่พิมพ์ส่งข้อความ แนบไฟล์จำลอง และแสดงสถานะ OpenClaw adapter
- หน้า Register แยกที่ `register.html` ตาม flow ของ Zaapi: ข้อมูลธุรกิจ, ผู้สมัคร, อีเมล, โทรศัพท์, รหัสผ่าน, จำนวนทีม และยอมรับเงื่อนไข
- หน้า Book a Demo แยกที่ `demo.html` พร้อมฟอร์มจองเวลา, จำนวนทีม, ฟีเจอร์ที่สนใจ, ขั้นตอนเริ่มต้น และหน้าสำเร็จ

## รันในเครื่อง

```powershell
npm.cmd install
npm.cmd run dev
```

เปิด `http://127.0.0.1:1420`

## ตรวจสอบก่อน deploy

```powershell
npm.cmd test
npm.cmd run build
```

หน้า GitHub Pages:

`https://newwic.github.io/CUTINEO/`

หน้าสมัครใช้งาน:

`https://newwic.github.io/CUTINEO/register.html`

หน้าจองเดโม:

`https://newwic.github.io/CUTINEO/demo.html`

ปุ่มแพ็กเกจ Basic, Pro และ Advanced จะพาไปหน้า Register พร้อมเลือกแพ็กเกจให้อัตโนมัติ ส่วน Enterprise จะเปิดฟอร์มติดต่อทีม

อย่าใส่ API key หรือข้อมูลลับลงใน frontend และอย่า commit ข้อมูลลับขึ้น repository สาธารณะ
