# CUTINEO — NEO Chat

เว็บแชท NEO สำหรับเปิดดูผ่าน GitHub Pages โดยใช้ React + Vite

## ฟีเจอร์

- Chat Panel ใช้งานได้ทันทีในหน้าเว็บ
- Offline Demo ตอบกลับข้อความโดยไม่ต้องใช้ API key
- NEO state animation และ event adapter
- รองรับการต่อ OpenClaw ผ่าน `VITE_OPENCLAW_WS_URL` เมื่อมี endpoint ที่ยืนยันแล้ว
- GitHub Actions build และ deploy ไป GitHub Pages อัตโนมัติเมื่อ push เข้า `main`

## รันในเครื่อง

```powershell
npm.cmd install
npm.cmd run dev
```

เปิด `http://127.0.0.1:1420`

## Build

```powershell
npm.cmd run build
```

หน้าเว็บ GitHub Pages จะอยู่ที่:

`https://newwic.github.io/CUTINEO/`

ไม่ควรใส่ API key ลงใน frontend หรือ commit ขึ้น repository สาธารณะ
