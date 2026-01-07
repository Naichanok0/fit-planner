// ========================================
// INTEGRATION GUIDE - วิธีเพิ่ม Triggers ในโปรเจ็ค
// ========================================

/*
 * ขั้นตอนที่ 1: รัน SQL Schema
 * 
 * 1. เปิด MySQL client หรือ MySQL Workbench
 * 2. รัน sechmer.sql ทั้งหมด
 * 3. ตรวจสอบ triggers:
 *    SHOW TRIGGERS;
 * 4. ตรวจสอบ procedures:
 *    SHOW PROCEDURE STATUS WHERE db = 'your_database';
 */

// ========================================
// ขั้นตอนที่ 2: เพิ่มในไฟล์ server.js
// ========================================

// ก่อนที่จะเพิ่ม:
// const authRoutes = require('./routes/auth');
// const workoutRoutes = require('./routes/workout');

// เพิ่มเข้าไป:
// const triggerRoutes = require('./routes/triggers');
// const workoutWithTriggersRoutes = require('./routes/workout-with-triggers');

// ในส่วน Mount routes:
// app.use('/api/triggers', triggerRoutes);
// app.use('/api/workouts', workoutWithTriggersRoutes); // แทนที่ workoutRoutes เดิม

// ========================================
// ขั้นตอนที่ 3: API Endpoints ที่พร้อมใช้งาน
// ========================================

/*
 * TRIGGERS ROUTES (/api/triggers/...)
 * 
 * GET /api/triggers/activities/:userId
 *   - ดึงกิจกรรมล่าสุดของผู้ใช้
 *   - Query params: limit, offset
 * 
 * GET /api/triggers/activity-stats/:userId
 *   - ดึงสถิติกิจกรรม
 *   - Query params: days (default 30)
 * 
 * GET /api/triggers/notifications/:userId
 *   - ดึงการแจ้งเตือน
 *   - Query params: unread (true/false)
 * 
 * POST /api/triggers/notifications/:notificationId/mark-read
 *   - ทำเครื่องหมายว่าอ่านแล้ว
 * 
 * POST /api/triggers/notifications/:userId/mark-all-read
 *   - ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
 * 
 * GET /api/triggers/achievements/:userId
 *   - ดึง achievements ทั้งหมด
 * 
 * POST /api/triggers/manual-check-achievements/:userId
 *   - ตรวจสอบและให้รางวัล achievements ใหม่
 * 
 * POST /api/triggers/update-daily-progress/:userId
 *   - อัปเดต daily progress ด้วยตนเอง
 *   - Body: { date: "2024-01-07" }
 * 
 * GET /api/triggers/user-stats/:userId
 *   - ดึงสถิติรวมของผู้ใช้
 * 
 * GET /api/triggers/leaderboard
 *   - ดึง leaderboard
 *   - Query params: type (streak, workouts, achievements)
 */

/*
 * WORKOUT WITH TRIGGERS ROUTES (/api/workouts/...)
 * 
 * POST /api/workouts/sessions/:sessionId/complete
 *   - บันทึกว่าสำเร็จการออกกำลังกาย
 *   - Body: { duration_min, estimated_calories, notes }
 *   - Triggers: tr_workout_completed, tr_check_streak_achievement
 * 
 * GET /api/workouts/sessions/user/:userId
 *   - ดึง workout sessions ของผู้ใช้
 *   - Query params: completed, date_from, date_to
 * 
 * POST /api/workouts/create-weekly-program
 *   - สร้าง weekly program
 *   - Body: { user_id, goal, body_type }
 *   - Calls: sp_create_weekly_program()
 * 
 * GET /api/workouts/progress/:userId
 *   - ดึงความคืบหน้า workout
 * 
 * GET /api/workouts/today/:userId
 *   - ดึง workout ของวันนี้
 * 
 * PUT /api/workouts/sessions/:sessionId
 *   - อัปเดต workout session
 * 
 * DELETE /api/workouts/sessions/:sessionId
 *   - ลบ workout session
 * 
 * GET /api/workouts/weekly-stats/:userId
 *   - ดึงสถิติ weekly
 */

// ========================================
// ตัวอย่าง Request/Response
// ========================================

/*
 * 1. Complete Workout
 * 
 * POST /api/workouts/sessions/1/complete
 * Content-Type: application/json
 * Authorization: Bearer token
 * 
 * {
 *   "duration_min": 45,
 *   "estimated_calories": 350,
 *   "notes": "เซตที่ 3 ยากนิดหน่อย"
 * }
 * 
 * Response:
 * {
 *   "status": "success",
 *   "message": "Workout completed successfully",
 *   "data": {
 *     "session_id": 1,
 *     "progress": {
 *       "id": 123,
 *       "user_id": 1,
 *       "progress_date": "2024-01-07",
 *       "workouts_completed": 1,
 *       "total_duration_min": 45,
 *       "total_calories_burned": 350
 *     },
 *     "new_notifications": [
 *       {
 *         "id": 456,
 *         "notification_type": "achievement",
 *         "title": "🎬 ออกแบบแรก!",
 *         "message": "ดีใจด้วย! คุณเริ่มต้นการเดินทางแล้ว"
 *       }
 *     ],
 *     "new_achievements": [ ... ]
 *   }
 * }
 */

/*
 * 2. Get Notifications
 * 
 * GET /api/triggers/notifications/1?unread=true
 * Authorization: Bearer token
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": [
 *     {
 *       "id": 456,
 *       "user_id": 1,
 *       "notification_type": "achievement",
 *       "title": "🎬 ออกแบบแรก!",
 *       "message": "ดีใจด้วย!",
 *       "is_read": false,
 *       "created_at": "2024-01-07T10:30:00Z"
 *     }
 *   ],
 *   "unread_count": 1
 * }
 */

/*
 * 3. Get Achievements
 * 
 * GET /api/triggers/achievements/1
 * Authorization: Bearer token
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": [
 *     {
 *       "achievement_id": "first_workout",
 *       "name": "🎬 ออกแบบแรก",
 *       "description": "สำเร็จการออกกำลังกายครั้งแรก",
 *       "category": "workout",
 *       "reward_points": 10,
 *       "unlocked": true,
 *       "unlocked_at": "2024-01-07T10:30:00Z"
 *     },
 *     {
 *       "achievement_id": "workout_10",
 *       "name": "💪 10 เซสชั่น",
 *       "description": "สำเร็จ 10 เซสชั่นออกกำลังกาย",
 *       "category": "workout",
 *       "reward_points": 25,
 *       "unlocked": false,
 *       "unlocked_at": null
 *     }
 *   ],
 *   "summary": {
 *     "total": 12,
 *     "unlocked": 1,
 *     "total_points": 10
 *   }
 * }
 */

/*
 * 4. Get User Stats
 * 
 * GET /api/triggers/user-stats/1
 * Authorization: Bearer token
 * 
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "dashboard": {
 *       "id": 1,
 *       "email": "user@example.com",
 *       "first_name": "John",
 *       "last_name": "Doe",
 *       "goal": "weight-loss",
 *       "fitness_level": "beginner",
 *       "height_cm": 170,
 *       "weight_kg": 75.5,
 *       "bmi": 26.1,
 *       "body_fat_percentage": 25.5,
 *       "detected_type": "average",
 *       "today_workouts": 1,
 *       "today_calories": 350
 *     },
 *     "workout_progress": {
 *       "user_id": 1,
 *       "days_active": 3,
 *       "total_workouts_completed": 3,
 *       "total_minutes": 135,
 *       "total_calories_burned": 1050,
 *       "last_workout_date": "2024-01-07"
 *     },
 *     "current_streak": 3,
 *     "bmi_category": "ปกติ (Normal)"
 *   }
 * }
 */

// ========================================
// Frontend Integration Examples
// ========================================

// ดูไฟล์ TRIGGERS_FRONTEND_EXAMPLES.ts สำหรับตัวอย่าง React components
// และการใช้ custom hooks
