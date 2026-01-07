# 🚀 FitLife Planner - Local Development Setup Guide

## ✅ สิ่งที่ทำเรียบร้อยแล้ว

1. **mysql.env** - ตั้งค่าแล้วพร้อมใช้งาน
   - Database: Planner
   - Connection: localhost:3306 (MySQL)
   - JWT secrets: สร้างแล้ว 32+ chars
   - CORS: http://localhost:3000
   - AI Service: http://localhost:8000

2. **server.js** - อัปเดตแล้ว
   - Mount `/api/triggers` routes
   - Dotenv loader พร้อมรองรับ UTF-8/UTF-16LE
   - Error handling & CORS middleware

3. **Routes** - สร้างแล้วทั้งหมด
   - `routes/triggers.js` - Activities, Notifications, Achievements
   - `routes/workout-with-triggers.js` - Workouts with auto-triggers
   - `routes/auth.js` - JWT Authentication
   - `routes/dashboard.js` - User Dashboard
   - `routes/nutrition.js` - Nutrition Planning
   - `routes/workout.js` - Workout Management
   - `routes/analysis.js` - Body Analysis

4. **SQL Schema** - `sechmer.sql` (799 lines, พร้อมใช้)
   - 14 Tables
   - 2 Views (Dashboard, Progress)
   - 5 Triggers (Auto-tracking)
   - 4 Stored Procedures
   - 13 Achievements

---

## 📝 ขั้นตอน Setup Local

### Step 1: ติดตั้ง MySQL Server
```bash
# Windows:
# - ดาวน์โหลด MySQL Server 8.0+ จาก mysql.com
# - ติดตั้ง, set password for root user
# - เปิด MySQL Services
```

### Step 2: Import SQL Schema
```bash
# PowerShell (ใน directory ที่มี sechmer.sql):
mysql -u root -p Planner < sechmer.sql

# หรือ:
mysql -u root -p0858313045z Planner < sechmer.sql
```

**ตรวจสอบการ import:**
```sql
mysql -u root -p Planner
> SHOW TABLES;
-- ควรมี 14 tables
> SHOW TRIGGERS;
-- ควรมี 5 triggers
```

### Step 3: ติดตั้ง Node Dependencies
```bash
cd Project/project/backend
npm install
```

### Step 4: เริ่ม Backend Server
```bash
# ใน Project/project/backend:
npm start

# หรือ:
node src/server.js

# ต้องเห็น:
# ✅ FitLife Planner API running on http://localhost:3002
```

### Step 5: เริ่ม Frontend (ในทำนอง Terminal อื่น)
```bash
cd Project/project
npm run dev

# ต้องเห็น:
# ➜ Local: http://localhost:3000
```

### Step 6: เริ่ม AI Service (ในทำนอง Terminal อื่น)
```bash
cd Project/project/backend/backend_Ai
python main.py

# ต้องเห็น:
# Uvicorn running on http://localhost:8000
```

---

## 🔍 ตรวจสอบการเชื่อมต่อ

### Test Backend Health:
```bash
curl http://localhost:3002/health
# ควรได้: {"ok":true,"service":"FitLife Planner API"}

curl http://localhost:3002/db/health
# ควรได้: {"db":"ok","ping":1}
```

### Test Triggers Endpoint:
```bash
curl http://localhost:3002/api/triggers/activities?user_id=1
# ควรได้: {"ok":true,"activities":[...]}
```

### Test Frontend Connectivity:
```bash
# ใน Browser: http://localhost:3000
# ตรวจสอบ Network tab ว่า API calls ไปถึง localhost:3002
```

---

## 🚨 Troubleshooting

### ❌ "MySQL is not reachable"
```
✓ ตรวจ MySQL Services กำลังรัน
✓ ตรวจ DB_PASS ใน mysql.env ถูกต้อง
✓ ตรวจ DB_HOST, DB_PORT ถูกต้อง
```

### ❌ "No database selected"
```
✓ Run: mysql -u root -p -e "CREATE DATABASE Planner;"
✓ Run: mysql -u root -p Planner < sechmer.sql
```

### ❌ Frontend ไม่ connect Backend
```
✓ ตรวจ CORS_ORIGIN ใน mysql.env = http://localhost:3000
✓ ตรวจ port 3002 ว่าเปิดแล้ว
✓ Browser console: ดู error messages
```

### ❌ JWT token expired
```
✓ Refresh token จาก /auth/refresh endpoint
✓ Check JWT_ACCESS_TTL, JWT_REFRESH_TTL ใน mysql.env
```

---

## 📊 Database Schema Overview

### Core Tables:
- **users** - User profiles & auth
- **body_measurements** - Body analysis from AI
- **workout_programs** - Workout plans
- **workout_sessions** - Workout history
- **nutrition_plans** - Meal plans
- **nutrition_logs** - Food logs
- **progress_daily** - Daily summary
- **exercise_library** - Exercise reference

### Tracking Tables:
- **user_activity_triggers** - Activity events
- **notifications** - User notifications
- **achievements** - Achievement definitions
- **user_achievements** - User badges

### Support Tables:
- **ai_detections** - AI analysis history
- **refresh_tokens** - JWT token management

### Views:
- **v_user_dashboard** - Complete user stats
- **v_workout_progress** - Workout analytics

### Triggers (Auto-tracking):
- **tr_workout_completed** - Auto-log when workout done
- **tr_nutrition_logged** - Track meal logging
- **tr_weight_updated** - Record weight changes
- **tr_check_streak_achievement** - Award streak badges
- **tr_update_progress_timestamp** - Update audit trail

---

## 🎯 API Routes (Available Endpoints)

### Health Check:
```
GET /health
GET /db/health
```

### Authentication:
```
POST /auth/signup
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

### Triggers & Activities:
```
GET  /api/triggers/activities
POST /api/triggers/activities
GET  /api/triggers/notifications
GET  /api/triggers/achievements
POST /api/triggers/notifications/:id/read
GET  /api/triggers/stats
GET  /api/triggers/leaderboard
```

### Dashboard:
```
GET /api/dashboard
POST /api/dashboard/body-measurements
```

### Workouts:
```
GET  /api/workout
POST /api/workout
PUT  /api/workout/:id
DELETE /api/workout/:id
```

### Nutrition:
```
GET  /api/nutrition
POST /api/nutrition/log
GET  /api/nutrition/logs
```

### Analysis:
```
GET /api/analysis
POST /api/analysis
```

---

## 💡 Next Steps

1. **Test Database Connectivity**
   - Run: `curl http://localhost:3002/db/health`

2. **Verify All Services Running**
   - Backend: http://localhost:3002
   - Frontend: http://localhost:3000
   - AI: http://localhost:8000

3. **Create Test User**
   - POST /auth/signup with email/password

4. **Test Body Analysis**
   - Upload image to BodyAnalysisNew component
   - Check data saved to body_measurements table

5. **Monitor Triggers**
   - Complete workout
   - Check user_activity_triggers table
   - Verify notifications created

---

## 📞 Support

- **Frontend Issues**: Check `src/App.tsx`, network tab in browser
- **Backend Issues**: Check logs in terminal, `src/server.js`
- **Database Issues**: Check MySQL log, run `SHOW ERRORS;`
- **AI Issues**: Check `backend_Ai/main.py` logs, port 8000

---

Generated: 2024
FitLife Planner API
