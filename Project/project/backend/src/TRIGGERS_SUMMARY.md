# 🎉 SQL Triggers - Complete Summary

## ✅ ที่ทำแล้ว

### 1. **SQL Schema** (`sechmer.sql`)
✓ เพิ่มตาราง 3 ตาราง:
- `user_activity_triggers` - บันทึกกิจกรรมผู้ใช้
- `notifications` - ระบบการแจ้งเตือน
- `achievements` + `user_achievements` - ระบบความสำเร็จ

✓ สร้าง 4 SQL Triggers:
- `tr_workout_completed` - เมื่อเสร็จ workout
- `tr_nutrition_logged` - เมื่อ log อาหาร
- `tr_weight_updated` - เมื่ออัปเดตน้ำหนัก
- `tr_check_streak_achievement` - ตรวจสอบ streak

✓ สร้าง 4 Stored Procedures:
- `sp_create_weekly_program()` - สร้างโปรแกรม 7 วัน
- `sp_update_daily_progress()` - อัปเดต daily progress
- `sp_check_achievements()` - ตรวจสอบและให้รางวัล
- `sp_cleanup_expired_tokens()` - ลบ tokens หมดอายุ

✓ เพิ่ม 13 Achievements ตัวอย่าง:
- first_workout, workout_10, workout_50, workout_100
- streak_7days, streak_30days, streak_100days
- weight_loss_5kg, weight_loss_10kg
- nutrition_tracking_week, bmi_normal, perfect_week

✓ สร้าง 2 Views:
- `v_user_dashboard` - Dashboard ผู้ใช้
- `v_workout_progress` - ความคืบหน้า workout

### 2. **Backend Routes** (`routes/triggers.js`)
✓ 7 API endpoints:
- GET /activities/:userId - ดึงกิจกรรม
- GET /activity-stats/:userId - สถิติกิจกรรม
- GET /notifications/:userId - ดึง notifications
- POST /notifications/:id/mark-read - ทำเครื่องหมายอ่านแล้ว
- GET /achievements/:userId - ดึง achievements
- POST /manual-check-achievements/:userId - ตรวจสอบด้วยตนเอง
- GET /leaderboard - ดึง leaderboard

### 3. **Workout Routes with Triggers** (`routes/workout-with-triggers.js`)
✓ 7 API endpoints:
- POST /sessions/:id/complete - บันทึกเสร็จ workout
- GET /sessions/user/:userId - ดึง sessions
- POST /create-weekly-program - สร้างโปรแกรม
- GET /progress/:userId - ดึงความคืบหน้า
- GET /today/:userId - ดึง workout วันนี้
- PUT/DELETE /sessions/:id - อัปเดต/ลบ
- GET /weekly-stats/:userId - สถิติ weekly

### 4. **Documentation**
✓ `TRIGGERS_README.md` - คู่มืออธิบาย triggers ทั้งหมด
✓ `INTEGRATION_GUIDE.md` - วิธีเชื่อมต่อกับโปรเจ็ค

---

## 🚀 วิธีการใช้งาน

### ขั้นตอนที่ 1: รัน SQL
```sql
-- รัน sechmer.sql ทั้งหมด
source sechmer.sql;

-- ตรวจสอบ triggers
SHOW TRIGGERS;

-- ตรวจสอบ procedures
SHOW PROCEDURE STATUS;
```

### ขั้นตอนที่ 2: เพิ่มไฟล์ routes
```bash
# คัดลอก 2 ไฟล์เข้าไป
- routes/triggers.js
- routes/workout-with-triggers.js
```

### ขั้นตอนที่ 3: อัปเดต server.js
```javascript
// เพิ่มเหล่านี้
const triggerRoutes = require('./routes/triggers');
const workoutWithTriggersRoutes = require('./routes/workout-with-triggers');

// Mount
app.use('/api/triggers', triggerRoutes);
app.use('/api/workouts', workoutWithTriggersRoutes);
```

### ขั้นตอนที่ 4: ใช้งาน API
```javascript
// Complete workout
POST /api/workouts/sessions/1/complete
Body: {
  "duration_min": 45,
  "estimated_calories": 350
}

// Get notifications
GET /api/triggers/notifications/1?unread=true

// Get achievements
GET /api/triggers/achievements/1

// Get user stats
GET /api/triggers/user-stats/1
```

---

## 📊 ตัวอย่าง Data Flow

```
1. User เสร็จ Workout
   ↓
   PUT /api/workouts/sessions/1/complete
   ↓
   UPDATE workout_sessions SET completed = TRUE
   ↓
   [TRIGGER] tr_workout_completed
   ├─ INSERT user_activity_triggers
   ├─ UPDATE progress_daily
   └─ Notify via trigger
   ↓
   CALL sp_check_achievements(user_id)
   ├─ Check: workouts_completed >= 10
   ├─ Check: current_streak >= 7
   ├─ Check: weight_loss >= 5kg
   └─ CREATE notification + award
   ↓
   Response: {
     status: 'success',
     new_notifications: [...],
     new_achievements: [...]
   }
```

---

## 🎯 Triggers ที่ทำงานอัตโนมัติ

### 1. Complete Workout
```sql
UPDATE workout_sessions SET completed = TRUE WHERE id = 1;
-- Trigger: tr_workout_completed ทำงาน
-- ✓ บันทึกใน user_activity_triggers
-- ✓ อัปเดต progress_daily
-- ✓ ตรวจสอบ achievements
```

### 2. Log Nutrition
```sql
INSERT INTO nutrition_logs (...) VALUES (...);
-- Trigger: tr_nutrition_logged ทำงาน
-- ✓ บันทึกใน user_activity_triggers
-- ✓ อัปเดต nutrition_completion_rate
```

### 3. Update Weight
```sql
INSERT INTO body_measurements (...) VALUES (...);
-- Trigger: tr_weight_updated ทำงาน
-- ✓ บันทึกใน user_activity_triggers
-- ✓ ตรวจสอบ weight_loss achievements
```

---

## 📱 Frontend Integration

### React Hook
```typescript
import { useTriggers } from '../hooks/useTriggers';

const MyComponent = () => {
  const { notifications, achievements, stats } = useTriggers(userId);
  
  return (
    <div>
      <NotificationsPanel notifications={notifications} />
      <AchievementsPanel achievements={achievements} />
      <StatsDisplay stats={stats} />
    </div>
  );
};
```

### API Calls
```javascript
// Complete workout
await fetch('/api/workouts/sessions/1/complete', {
  method: 'POST',
  body: JSON.stringify({
    duration_min: 45,
    estimated_calories: 350
  })
});

// Get unread notifications
const response = await fetch(
  '/api/triggers/notifications/1?unread=true'
);
const { data } = await response.json();

// Mark notification as read
await fetch('/api/triggers/notifications/456/mark-read', {
  method: 'POST'
});
```

---

## ⚙️ Functions ที่เรียกได้

### `fn_calculate_streak(user_id)`
```sql
SELECT fn_calculate_streak(1) as current_streak;
-- Returns: 7 (วันติดต่อ)
```

### `fn_get_bmi_category(bmi)`
```sql
SELECT fn_get_bmi_category(26.1) as category;
-- Returns: 'น้ำหนักเกิน (Overweight)'
```

---

## 📈 Analytics Queries

### Leaderboard - Streak
```sql
SELECT 
  u.id, u.first_name,
  fn_calculate_streak(u.id) as streak
FROM users u
ORDER BY streak DESC
LIMIT 20;
```

### Top Achievers
```sql
SELECT 
  u.id, u.first_name,
  COUNT(ua.id) as achievements_count,
  SUM(a.reward_points) as total_points
FROM users u
LEFT JOIN user_achievements ua ON u.id = ua.user_id
LEFT JOIN achievements a ON ua.achievement_id = a.achievement_id
GROUP BY u.id
ORDER BY achievements_count DESC
LIMIT 20;
```

### Recent Activities
```sql
SELECT 
  u.first_name,
  uat.trigger_type,
  uat.description,
  uat.created_at
FROM user_activity_triggers uat
JOIN users u ON uat.user_id = u.id
ORDER BY uat.created_at DESC
LIMIT 50;
```

---

## 🔧 Cron Jobs (Optional)

### ลบ Expired Tokens ทุกชั่วโมง
```bash
0 * * * * mysql -u user -p db -e "CALL sp_cleanup_expired_tokens;"
```

### อัปเดต Daily Progress ทุกเที่ยงคืน
```bash
0 0 * * * mysql -u user -p db -e "CALL sp_update_daily_progress(1, CURDATE());"
```

---

## ✨ Features

✅ **Automatic Activity Tracking**
- ติดตามทุกกิจกรรมผู้ใช้

✅ **Real-time Notifications**
- ส่งแจ้งเตือนทันที

✅ **Achievement System**
- ปลดล็อก achievements อัตโนมัติ

✅ **Streak Tracking**
- ติดตาม consecutive workout days

✅ **Progress Analytics**
- สถิติรวม workout, nutrition, weight

✅ **Leaderboard**
- เปรียบเทียบกับผู้ใช้อื่นๆ

---

## 🚨 Notes

1. **Triggers ทำงานอัตโนมัติ** - ไม่ต้องเรียกด้วยตนเอง
2. **Views สำหรับการดึงข้อมูล** - ใช้สำหรับ analytics
3. **Procedures ชื่อขึ้นต้นด้วย sp_** - เรียกด้วย CALL
4. **Functions ชื่อขึ้นต้นด้วย fn_** - ใช้ใน SELECT
5. **Notifications ถูกสร้างโดย triggers** - ดึงผ่าน API

---

## 🎓 สรุป

ตอนนี้มีระบบ triggers ที่สมบูรณ์:
- ✅ บันทึกกิจกรรมอัตโนมัติ
- ✅ สร้าง notifications ทันที
- ✅ ปลดล็อก achievements
- ✅ ติดตาม streak
- ✅ อัปเดต progress daily
- ✅ API endpoints พร้อมใช้
- ✅ Frontend examples

สามารถเริ่มใช้งานได้เลย! 🚀
