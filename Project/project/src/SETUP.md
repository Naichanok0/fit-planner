# �️‍♀️ Fit Planner - Setup Guide

## 📋 **Prerequisites**

ก่อนเริ่มต้น ให้แน่ใจว่าคุณมี:

1. **Node.js** version 18+ 
   - Download: https://nodejs.org/
   - Check version: `node --version`

2. **Visual Studio Code**
   - Download: https://code.visualstudio.com/

3. **Git** (optional)
   - Download: https://git-scm.com/

## 🚀 **Installation Steps**

### **Step 1: Open Project in VS Code**
```bash
# Open the project folder in VS Code
code .
```

### **Step 2: Install Dependencies**
เปิด Terminal ใน VS Code (`Ctrl+`` หรือ `View > Terminal`) แล้วรัน:

```bash
npm install
```

### **Step 3: Install Recommended Extensions**
VS Code จะแสดง notification ให้ติดตั้ง extensions ที่แนะนำ:

- **Tailwind CSS IntelliSense** - สำหรับ autocomplete Tailwind classes
- **Prettier** - สำหรับ format code อัตโนมัติ
- **ESLint** - สำหรับตรวจสอบ code quality
- **TypeScript and JavaScript Language Features** - สำหรับ TypeScript support

หรือติดตั้งด้วยตนเองผ่าน Extensions panel (`Ctrl+Shift+X`)

### **Step 4: Start Development Server**
```bash
npm run dev
```

แอปจะเปิดที่ `http://localhost:3000` โดยอัตโนมัติ

## 🔧 **Available Scripts**

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check TypeScript types
npm run type-check

# Lint code
npm run lint
```

## 🐛 **Troubleshooting Common Issues**

### **1. Code แสดงสีแดง (TypeScript Errors)**

**วิธีแก้:**
- กด `Ctrl+Shift+P` → พิมพ์ "TypeScript: Restart TS Server"
- หรือปิด VS Code แล้วเปิดใหม่

### **2. Tailwind classes ไม่มี autocomplete**

**วิธีแก้:**
- ตรวจสอบว่าติดตั้ง "Tailwind CSS IntelliSense" extension แล้ว
- Reload Window: `Ctrl+Shift+P` → "Developer: Reload Window"

### **3. Import paths แสดงแดง**

**วิธีแก้:**
- ตรวจสอบว่า `tsconfig.json` มี path mapping ถูกต้อง
- Restart TypeScript server (ตามข้อ 1)

### **4. Components ไม่พบ (Cannot find module)**

**วิธีแก้:**
- ตรวจสอบว่ามีไฟล์ component จริงใน folder `components/`
- ตรวจสอบ import path ว่าถูกต้อง
- ตรวจสอบ file extension (.tsx)

### **5. Prettier ไม่ format อัตโนมัติ**

**วิธีแก้:**
- กด `Ctrl+Shift+P` → "Format Document"
- หรือเปิด Settings → search "format on save" → เปิดใช้งาน

## 📁 **Project Structure**

```
ai-health-app/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── ui/              # ShadCN UI components
│   └── *.tsx            # Feature components
├── styles/              # CSS styles
│   └── globals.css      # Tailwind + custom styles
├── public/              # Static assets
├── .vscode/            # VS Code settings
├── App.tsx             # Main app component
├── main.tsx            # App entry point
├── index.html          # HTML template
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── tailwind.config.ts  # Tailwind config
└── vite.config.ts      # Vite config
```

## 💡 **Development Tips**

### **1. TypeScript Support**
- ใช้ interfaces สำหรับ type definitions
- ใช้ `Ctrl+Space` สำหรับ autocomplete
- Hover mouse บน variables เพื่อดู type information

### **2. Tailwind CSS**
- ใช้ `Ctrl+Space` ใน className เพื่อดู available classes
- ใช้ VS Code's IntelliSense สำหรับ Tailwind utilities

### **3. Component Development**
- สร้าง components ใหม่ใน folder `components/`
- ใช้ ShadCN components จาก `components/ui/`
- Import icons จาก `lucide-react`

### **4. Debugging**
- ใช้ Browser DevTools (`F12`)
- ใช้ `console.log()` สำหรับ debug
- ใช้ React DevTools extension

## 🎨 **Styling Guidelines**

### **Colors**
แอปใช้ Dark theme โดยค่าเริ่มต้น:
- `bg-background` - พื้นหลังหลัก
- `text-foreground` - ข้อความหลัก
- `bg-card` - พื้นหลัง card
- `text-muted-foreground` - ข้อความรอง

### **Components**
- ใช้ ShadCN components เมื่อเป็นไปได้
- ใช้ `lucide-react` สำหรับ icons
- ใช้ `recharts` สำหรับ charts และ graphs

## ✅ **Success Checklist**

เมื่อ setup เสร็จ คุณควรเห็น:

- [ ] No red underlines ใน TypeScript files
- [ ] Tailwind autocomplete ทำงาน
- [ ] App เปิดที่ `http://localhost:3000`
- [ ] Hot reload ทำงานเมื่อแก้ไขไฟล์
- [ ] Dark theme แสดงผลถูกต้อง
- [ ] ทุก components โหลดได้ปกติ

## 📞 **Need Help?**

หากยังมีปัญหา:

1. ตรวจสอบ Terminal ว่ามี error messages
2. ตรวจสอบ Browser Console (`F12`)
3. ลองรัน `npm install` ใหม่
4. ลองลบ `node_modules` และรัน `npm install` ใหม่
5. Restart VS Code

---

**Happy Coding! 🚀**