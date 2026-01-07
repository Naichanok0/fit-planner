# 📋 SQL Triggers & Procedures Guide

## 📊 ตารางใหม่ที่เพิ่มเข้ามา

### 1. **user_activity_triggers** - บันทึกกิจกรรมผู้ใช้
เก็บประวัติทุกกิจกรรมของผู้ใช้:
- ✅ workout_completed - เมื่อเสร็จการออกกำลังกาย
- 🥗 nutrition_logged - เมื่อบันทึกอาหาร
- ⚖️ weight_updated - เมื่ออัปเดตน้ำหนัก
- 📏 measurement_taken - เมื่อวัดสตูป
- 🏆 milestone_reached - เมื่อถึงเป้าหมาย
- 🔥 streak_started - เริ่ม streak ใหม่
- ⛔ streak_broken - สะดุดเซ
- ⭐ goal_achieved - บรรลุเป้าหมาย
- 💬 form_feedback_given - ได้คำแนะนำ
- 📝 program_created - สร้างโปรแกรมใหม่
- 🎉 program_completed - เสร็จโปรแกรม

```sql
SELECT * FROM user_activity_triggers 
WHERE user_id = 1 
ORDER BY created_at DESC;
```

### 2. **notifications** - ระบบการแจ้งเตือน
ส่งข้อความแจ้งเตือนไปยังผู้ใช้:
- 🎖️ achievement - การบรรลุความสำเร็จ
- ⏰ reminder - เตือนที่ถึงเวลา
- 🚨 alert - การแจ้งเตือนสำคัญ
- 💡 suggestion - ข้อเสนอแนะ
- 🎯 milestone - เสน่ห์หลักเกณฑ์
- 📖 feedback - ข้อมูลการวิเคราะห์

```sql
-- ดึงการแจ้งเตือนที่ยังไม่อ่าน
SELECT * FROM notifications 
WHERE user_id = 1 AND is_read = FALSE
ORDER BY created_at DESC;

-- ทำเครื่องหมายว่าอ่านแล้ว
UPDATE notifications 
SET is_read = TRUE, read_at = NOW()
WHERE id = 123;
```

### 3. **achievements** - ระบบความสำเร็จ
กำหนดความสำเร็จที่ผู้ใช้สามารถปลดล็อก:
- 💪 workout - ความสำเร็จด้านการออกกำลังกาย
- 🥗 nutrition - ความสำเร็จด้านอาหาร
- 🔥 consistency - ความสม่ำเสมอ
- 🎯 milestone - เสน่ห์หลักเกณฑ์
- 🏋️ body_transformation - การเปลี่ยนแปลงร่างกาย
- 🌟 special - ความสำเร็จพิเศษ

### 4. **user_achievements** - ความสำเร็จของผู้ใช้
บันทึกเมื่อผู้ใช้ปลดล็อก achievement:

```sql
-- ดึงความสำเร็จทั้งหมดของผู้ใช้
SELECT a.*, ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.achievement_id
WHERE ua.user_id = 1
ORDER BY ua.unlocked_at DESC;
```

---

## 🤖 SQL Triggers ที่ทำงานอัตโนมัติ

### 1. **tr_workout_completed** - บันทึกเมื่อเสร็จ Workout
**ปริพท์**: AFTER UPDATE ON workout_sessions

```sql
-- ตัวอย่างการอัปเดต
UPDATE workout_sessions 
SET completed = TRUE, completed_at = NOW()
WHERE id = 1;

-- Trigger จะทำอัตโนมัติ:
-- ✓ บันทึกใน user_activity_triggers
-- ✓ อัปเดต progress_daily
```

### 2. **tr_nutrition_logged** - บันทึกเมื่อ Log อาหาร
**ปริพท์**: AFTER INSERT ON nutrition_logs

```sql
-- ตัวอย่างการเพิ่มข้อมูล
INSERT INTO nutrition_logs (
  user_id, log_date, meal_id, calories, protein_g, carbs_g, fat_g
) VALUES (1, CURDATE(), 'breakfast', 450, 25, 55, 15);

-- Trigger จะทำอัตโนมัติ:
-- ✓ บันทึกใน user_activity_triggers
-- ✓ อัปเดต nutrition_completion_rate
```

### 3. **tr_weight_updated** - บันทึกเมื่ออัปเดตน้ำหนัก
**ปริพท์**: AFTER INSERT ON body_measurements

```sql
-- ตัวอย่าง
INSERT INTO body_measurements (
  user_id, height_cm, weight_kg, bmi, detected_type, confidence
) VALUES (1, 170, 75.5, 26.1, 'average', 95.2);

-- Trigger จะทำอัตโนมัติ:
-- ✓ บันทึกใน user_activity_triggers
-- ✓ อัปเดต progress_daily
```

### 4. **tr_check_streak_achievement** - ตรวจสอบ Streak
**ปริพท์**: AFTER UPDATE ON progress_daily

```
ตัวอย่าง:
- เมื่อ streak = 7 วัน → ปลดล็อก 'streak_7days'
- เมื่อ streak = 30 วัน → ปลดล็อก 'streak_30days'
- สร้าง notification อัตโนมัติ
```

---

## 📞 Stored Procedures - ฟังก์ชันที่สามารถเรียกได้

### 1. **sp_create_weekly_program** - สร้างโปรแกรม 7 วัน

```sql
-- การเรียกใช้
CALL sp_create_weekly_program(1, 'weight-loss', 'average');

-- Output
SELECT * FROM workout_sessions 
WHERE program_id = (SELECT MAX(id) FROM workout_programs WHERE user_id = 1);
```

### 2. **sp_update_daily_progress** - อัปเดต Daily Progress

```sql
-- อัปเดตความคืบหน้ารวม
CALL sp_update_daily_progress(1, CURDATE());

-- ตรวจสอบผลลัพธ์
SELECT * FROM progress_daily 
WHERE user_id = 1 AND progress_date = CURDATE();
```

### 3. **sp_check_achievements** - ตรวจสอบและให้รางวัล

```sql
-- ตรวจสอบ achievements ใหม่ทั้งหมด
CALL sp_check_achievements(1);

-- ดูผลลัพธ์
SELECT a.name, ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.achievement_id
WHERE ua.user_id = 1
ORDER BY ua.unlocked_at DESC;
```

### 4. **sp_cleanup_expired_tokens** - ลบ Refresh Tokens หมดอายุ

```sql
-- รัน cleanup
CALL sp_cleanup_expired_tokens();

-- หรือ ใช้ Cron Job:
-- ทุก 1 ชั่วโมง: 0 * * * * mysql -u user -p db < cleanup.sql
```

---

## 📊 Views - แสดงผลข้อมูล

### 1. **v_user_dashboard** - Dashboard ผู้ใช้

```sql
SELECT * FROM v_user_dashboard WHERE id = 1;

-- ผลลัพธ์จะมี:
-- - ข้อมูลพื้นฐาน
-- - Body measurements ล่าสุด
-- - Progress วันนี้
```

### 2. **v_workout_progress** - ความคืบหน้าการออกกำลังกาย

```sql
SELECT * FROM v_workout_progress WHERE user_id = 1;

-- ผลลัพธ์จะมี:
-- - วันที่ออกกำลังกาย
-- - จำนวนเซสชั่น
-- - นาทีรวม
-- - แคลอรี่รวม
-- - วันออกกำลังกายล่าสุด
```

---

## 🎯 Workflow ของ Triggers

```
เมื่อผู้ใช้ทำกิจกรรมต่างๆ:

1. ✅ Complete Workout
   ↓
   tr_workout_completed
   ↓
   - Insert into user_activity_triggers
   - Update progress_daily
   - Check achievements
   ↓
   Create Notification
   
2. 🥗 Log Nutrition
   ↓
   tr_nutrition_logged
   ↓
   - Insert into user_activity_triggers
   - Update progress_daily (nutrition_completion_rate)
   
3. ⚖️ Update Weight
   ↓
   tr_weight_updated
   ↓
   - Insert into user_activity_triggers
   - Update progress_daily
   - Check if weight_loss_5kg achievement
   ↓
   Create Notification + Award Achievement
```

---

## 🔧 การใช้งาน API (Node.js)

### ตัวอย่าง: บันทึก Workout เสร็จ

```javascript
// routes/workout.js
router.post('/complete-session/:id', async (req, res) => {
  try {
    // อัปเดต workout_sessions
    await db.query(
      'UPDATE workout_sessions SET completed = TRUE, completed_at = NOW() WHERE id = ?',
      [req.params.id]
    );
    
    // Trigger tr_workout_completed จะทำอัตโนมัติ
    
    // ตรวจสอบ achievements
    const userId = req.body.user_id;
    await db.query('CALL sp_check_achievements(?)', [userId]);
    
    // ดึง notifications ใหม่
    const notifications = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)',
      [userId]
    );
    
    res.json({ status: 'success', notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### ตัวอย่าง: ดึงกิจกรรมล่าสุด

```javascript
// routes/dashboard.js
router.get('/activities/:userId', async (req, res) => {
  const activities = await db.query(
    `SELECT * FROM user_activity_triggers 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT 10`,
    [req.params.userId]
  );
  
  res.json(activities);
});
```

### ตัวอย่าง: ดึง Notifications

```javascript
// routes/notifications.js
router.get('/:userId', async (req, res) => {
  const notifications = await db.query(
    `SELECT * FROM notifications 
     WHERE user_id = ? AND is_read = FALSE
     ORDER BY created_at DESC`,
    [req.params.userId]
  );
  
  res.json(notifications);
});

router.post('/:id/mark-read', async (req, res) => {
  await db.query(
    'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?',
    [req.params.id]
  );
  
  res.json({ status: 'success' });
});
```

---

## ⚙️ Cron Jobs ที่แนะนำ

```bash
# ทุก 1 ชั่วโมง - ลบ expired tokens
0 * * * * mysql -u username -ppassword database -e "CALL sp_cleanup_expired_tokens;"

# ทุกเที่ยงคืน - อัปเดต daily progress สำหรับผู้ใช้ทั้งหมด
0 0 * * * mysql -u username -ppassword database -e "SELECT id FROM users" | while read uid; do mysql -u username -ppassword database -e "CALL sp_update_daily_progress($uid, CURDATE());"; done

# ทุกวันเวลา 23:59 - ตรวจสอบ streak breaking
59 23 * * * mysql -u username -ppassword database -e "-- Custom streak check"
```

---

## 📈 ตัวอย่าง Analytics Query

```sql
-- 1. ผู้ใช้ที่มี streak สูงสุด
SELECT 
  u.id,
  u.first_name,
  fn_calculate_streak(u.id) as current_streak,
  COUNT(DISTINCT DATE(ws.session_date)) as total_workout_days
FROM users u
LEFT JOIN workout_sessions ws ON u.id = ws.user_id
GROUP BY u.id
ORDER BY current_streak DESC
LIMIT 10;

-- 2. สถิติการบรรลุความสำเร็จ
SELECT 
  a.category,
  COUNT(ua.id) as achievements_unlocked,
  COUNT(DISTINCT ua.user_id) as users_unlocked
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.achievement_id
GROUP BY a.category
ORDER BY achievements_unlocked DESC;

-- 3. ผู้ใช้ที่เสร็จสิ้นการรับประทานอาหารมากที่สุด
SELECT 
  u.id,
  u.first_name,
  COUNT(*) as total_logs,
  DATE(MAX(nl.log_date)) as last_log_date
FROM users u
JOIN nutrition_logs nl ON u.id = nl.user_id
GROUP BY u.id
ORDER BY total_logs DESC
LIMIT 10;

-- 4. ผู้ใช้ที่ได้รับการตอบสนองของฟอร์มมากที่สุด
SELECT 
  u.id,
  u.first_name,
  COUNT(*) as form_feedback_count,
  MAX(uat.created_at) as last_feedback
FROM users u
JOIN user_activity_triggers uat ON u.id = uat.user_id
WHERE uat.trigger_type = 'form_feedback_given'
GROUP BY u.id
ORDER BY form_feedback_count DESC;
```

---

## 🐛 Troubleshooting

### Trigger ไม่ทำงาน
```sql
-- ตรวจสอบว่า triggers ถูกสร้างหรือไม่
SHOW TRIGGERS;

-- ตรวจสอบ error
SHOW ENGINE INNODB STATUS;

-- ลบและสร้างใหม่
DROP TRIGGER IF EXISTS tr_workout_completed;
-- จากนั้นรัน SQL อีกครั้ง
```

### ตรวจสอบ Procedure
```sql
-- ดูรายชื่อ procedures
SHOW PROCEDURE STATUS WHERE db = 'fit_planner';

-- ดู source code
SHOW CREATE PROCEDURE sp_create_weekly_program;
```

### ตรวจสอบข้อมูล
```sql
-- ตรวจสอบว่ามี triggers บันทึกหรือไม่
SELECT COUNT(*) FROM user_activity_triggers WHERE user_id = 1;

-- ตรวจสอบ notifications
SELECT COUNT(*) FROM notifications WHERE user_id = 1 AND is_read = FALSE;

-- ตรวจสอบ achievements
SELECT COUNT(*) FROM user_achievements WHERE user_id = 1;
```

---

## ✅ Checklist สำหรับการตั้งค่า

- [ ] รัน SQL schema ทั้งหมด
- [ ] ตรวจสอบว่า triggers ถูกสร้าง (`SHOW TRIGGERS`)
- [ ] ตรวจสอบว่า procedures ถูกสร้าง (`SHOW PROCEDURE STATUS`)
- [ ] ตั้งค่า cron jobs สำหรับ cleanup
- [ ] เชื่อมต่อกับ API routes
- [ ] ทดสอบกับการอัปเดต workout session
- [ ] ตรวจสอบว่า notifications ถูกสร้างอัตโนมัติ
- [ ] ตรวจสอบว่า achievements ถูกปลดล็อก

