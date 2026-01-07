-- ========================================
-- สร้าง Database ก่อน
-- ========================================
CREATE DATABASE IF NOT EXISTS Planner CHARACTER SET utf8 COLLATE utf8_general_ci;
USE Planner;

-- ========================================
-- ลบ triggers ก่อน
-- ========================================
DROP TRIGGER IF EXISTS tr_update_progress_timestamp;
DROP TRIGGER IF EXISTS tr_check_streak_achievement;
DROP TRIGGER IF EXISTS tr_weight_updated;
DROP TRIGGER IF EXISTS tr_nutrition_logged;
DROP TRIGGER IF EXISTS tr_workout_completed;

-- ========================================
-- ลบ views ก่อน
-- ========================================
DROP VIEW IF EXISTS v_workout_progress;
DROP VIEW IF EXISTS v_user_dashboard;

-- ========================================
-- ลบ procedures ก่อน
-- ========================================
DROP PROCEDURE IF EXISTS sp_cleanup_expired_tokens;
DROP PROCEDURE IF EXISTS sp_check_achievements;
DROP PROCEDURE IF EXISTS sp_update_daily_progress;
DROP PROCEDURE IF EXISTS sp_create_weekly_program;

-- ========================================
-- ลบ functions ก่อน
-- ========================================
DROP FUNCTION IF EXISTS fn_calculate_streak;
DROP FUNCTION IF EXISTS fn_get_bmi_category;

-- ========================================
-- ลบตาราง (ลำดับเหมาะสม - ลบที่อ้างอิง FK ก่อน)
-- ========================================
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_activity_triggers;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS ai_detections;
DROP TABLE IF EXISTS exercise_library;
DROP TABLE IF EXISTS nutrition_logs;
DROP TABLE IF EXISTS nutrition_plans;
DROP TABLE IF EXISTS progress_daily;
DROP TABLE IF EXISTS workout_sessions;
DROP TABLE IF EXISTS workout_programs;
DROP TABLE IF EXISTS body_measurements;
DROP TABLE IF EXISTS users;

-- ========================================
-- 1. USERS TABLE (ข้อมูลผู้ใช้)
-- ========================================
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  age INT,
  gender ENUM('male', 'female', 'other'),
  fitness_level ENUM('beginner', 'standard', 'intermediate', 'advanced') DEFAULT 'standard',
  goal ENUM('weight-loss', 'muscle-gain', 'maintenance'),
  phone VARCHAR(20),
  profile_picture LONGTEXT, -- base64 หรือ URL
  join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_email (email),
  KEY idx_goal (goal)
);

-- ========================================
-- 2. BODY MEASUREMENTS TABLE (ผลการวิเคราะห์)
-- ========================================
CREATE TABLE body_measurements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(6,2),
  bmi DECIMAL(5,2),
  body_fat_percentage DECIMAL(5,2),
  muscle_mass_kg DECIMAL(6,2),
  detected_type ENUM('slim', 'average', 'muscular', 'heavy'),
  confidence DECIMAL(5,2), -- 0-100
  match_image VARCHAR(255), -- ชื่อรูปที่เจอใกล้เคียง
  analysis_json LONGTEXT, -- JSON เก็บข้อมูลเพิ่มเติม
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user_date (user_id, created_at DESC)
);

-- ========================================
-- 3. WORKOUT PROGRAMS TABLE (โปรแกรมออกกำลังกาย)
-- ========================================
CREATE TABLE workout_programs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  goal ENUM('weight-loss', 'muscle-gain', 'maintenance'),
  body_type ENUM('slim', 'average', 'muscular', 'heavy'),
  program_name VARCHAR(255),
  description LONGTEXT,
  duration_days INT DEFAULT 7,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user_goal (user_id, goal)
);

-- ========================================
-- 4. WORKOUT SESSIONS TABLE (เซสชั่นการออกกำลังกาย)
-- ========================================
CREATE TABLE workout_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  program_id INT,
  day_code VARCHAR(50), -- 'Monday', 'Tuesday', etc.
  session_date DATE NOT NULL,
  duration_min INT,
  estimated_calories INT,
  exercises_json LONGTEXT, -- [{id, name, sets, reps, completed}, ...]
  form_feedback_json LONGTEXT, -- AI feedback on form
  notes LONGTEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES workout_programs(id),
  KEY idx_user_date (user_id, session_date DESC),
  KEY idx_completed (completed)
);

-- ========================================
-- 5. NUTRITION PLANS TABLE (แผนอาหาร)
-- ========================================
CREATE TABLE nutrition_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  program_id INT,
  plan_date DATE,
  total_calories INT,
  protein_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  fat_g DECIMAL(6,2),
  fiber_g DECIMAL(6,2),
  water_ml DECIMAL(8,2),
  notes LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES workout_programs(id),
  KEY idx_user_date (user_id, plan_date)
);

-- ========================================
-- 6. NUTRITION LOGS TABLE (บันทึกการรับประทาน)
-- ========================================
CREATE TABLE nutrition_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  log_date DATE NOT NULL,
  meal_id ENUM('breakfast', 'lunch', 'dinner', 'snack_1', 'snack_2'),
  planned_time TIME,
  calories INT,
  protein_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  fat_g DECIMAL(6,2),
  foods_json LONGTEXT, -- ['ข้าวโอ๊ต', 'นม', 'กล้วย']
  completed BOOLEAN DEFAULT FALSE,
  completed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date_meal (user_id, log_date, meal_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user_date (user_id, log_date DESC)
);

-- ========================================
-- 7. PROGRESS DAILY TABLE (ความคืบหน้ารายวัน)
-- ========================================
CREATE TABLE progress_daily (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  progress_date DATE NOT NULL,
  workouts_completed INT DEFAULT 0,
  total_duration_min INT DEFAULT 0,
  total_calories_burned INT DEFAULT 0,
  nutrition_completion_rate DECIMAL(5,2), -- 0-100
  water_consumed_ml DECIMAL(8,2),
  weight_kg DECIMAL(6,2),
  notes LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date (user_id, progress_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user_date (user_id, progress_date DESC)
);

-- ========================================
-- 8. EXERCISE LIBRARY TABLE (คลังท่าออกกำลังกาย)
-- ========================================
CREATE TABLE exercise_library (
  id INT PRIMARY KEY AUTO_INCREMENT,
  exercise_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category ENUM('Upper Body', 'Lower Body', 'Core', 'Cardio', 'Flexibility'),
  target_muscles VARCHAR(255), -- JSON: ['Chest', 'Triceps', ...]
  difficulty ENUM('easy', 'standard', 'hard') DEFAULT 'standard',
  equipment ENUM('none', 'basic', 'gym'),
  sets INT,
  reps VARCHAR(50), -- '8-15', '10 each side', etc.
  rest_seconds INT,
  estimated_calories INT,
  description LONGTEXT,
  modifications_json LONGTEXT, -- {beginner, advanced}
  body_type_recommendations LONGTEXT, -- {ectomorph, mesomorph, endomorph}
  ai_accuracy_percent DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_category (category),
  KEY idx_difficulty (difficulty)
);

-- ========================================
-- 9. AI DETECTIONS TABLE (ประวัติการวิเคราะห์)
-- ========================================
CREATE TABLE ai_detections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  image_filename VARCHAR(255),
  image_base64 LONGBLOB, -- เก็บรูปไว้วิเคราะห์ใหม่ได้
  detected_type ENUM('slim', 'average', 'muscular', 'heavy'),
  confidence DECIMAL(5,2),
  distance DECIMAL(5,4), -- ระยะห่างจาก embedding
  match_image VARCHAR(255),
  pose_landmarks_json LONGTEXT, -- MediaPipe landmarks
  body_measurements_json LONGTEXT, -- เก็บผลวัด
  recommendations LONGTEXT, -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user_date (user_id, created_at DESC)
);

-- ========================================
-- 10. TOKENS TABLE (JWT refresh tokens)
-- ========================================
CREATE TABLE refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user (user_id),
  KEY idx_expires (expires_at)
);

-- ========================================
-- 11. USER ACTIVITY TRIGGERS TABLE (บันทึกกิจกรรมผู้ใช้)
-- ========================================
CREATE TABLE user_activity_triggers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  trigger_type ENUM(
    'workout_completed',
    'nutrition_logged',
    'weight_updated',
    'measurement_taken',
    'milestone_reached',
    'streak_started',
    'streak_broken',
    'goal_achieved',
    'form_feedback_given',
    'program_created',
    'program_completed'
  ) NOT NULL,
  trigger_value VARCHAR(255), -- เก็บค่าที่เกี่ยวข้อง
  description LONGTEXT,
  related_id INT, -- FK ไปที่ table ที่เกี่ยวข้อง
  related_table VARCHAR(50), -- ชื่อ table ที่เกี่ยวข้อง
  metadata_json LONGTEXT, -- ข้อมูลเพิ่มเติม
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_user_type (user_id, trigger_type),
  KEY idx_trigger_type (trigger_type),
  KEY idx_created_at (created_at DESC)
);

-- ========================================
-- 12. NOTIFICATIONS TABLE (การแจ้งเตือน)
-- ========================================
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  activity_trigger_id INT,
  notification_type ENUM(
    'achievement',
    'reminder',
    'alert',
    'suggestion',
    'milestone',
    'feedback'
  ) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message LONGTEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME,
  action_type VARCHAR(100), -- 'view_progress', 'start_workout', etc.
  action_data VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_trigger_id) REFERENCES user_activity_triggers(id) ON DELETE SET NULL,
  KEY idx_user_read (user_id, is_read),
  KEY idx_user_date (user_id, created_at DESC)
);

-- ========================================
-- 13. ACHIEVEMENTS TABLE (ความสำเร็จและรางวัล)
-- ========================================
CREATE TABLE achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  achievement_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description LONGTEXT,
  icon_url VARCHAR(255),
  category ENUM(
    'workout',
    'nutrition',
    'consistency',
    'milestone',
    'body_transformation',
    'special'
  ),
  trigger_condition VARCHAR(255), -- เช่น 'workouts_completed >= 10'
  reward_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_category (category)
);

-- ========================================
-- 14. USER ACHIEVEMENTS TABLE (ความสำเร็จของผู้ใช้)
-- ========================================
CREATE TABLE user_achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  achievement_id VARCHAR(100) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activity_trigger_id INT,
  UNIQUE KEY unique_user_achievement (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(achievement_id) ON DELETE CASCADE,
  FOREIGN KEY (activity_trigger_id) REFERENCES user_activity_triggers(id) ON DELETE SET NULL,
  KEY idx_user_date (user_id, unlocked_at DESC)
);



-- ========================================
-- VIEW: Dashboard ผู้ใช้
-- ========================================
CREATE VIEW v_user_dashboard AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.goal,
  u.fitness_level,
  COALESCE(bm.height_cm, 0) as height_cm,
  COALESCE(bm.weight_kg, 0) as weight_kg,
  COALESCE(bm.bmi, 0) as bmi,
  COALESCE(bm.body_fat_percentage, 0) as body_fat_percentage,
  COALESCE(bm.detected_type, 'unknown') as detected_type,
  COALESCE(pd.workouts_completed, 0) as today_workouts,
  COALESCE(pd.total_calories_burned, 0) as today_calories,
  u.join_date,
  u.last_login
FROM users u
LEFT JOIN body_measurements bm ON u.id = bm.user_id 
  AND bm.created_at = (SELECT MAX(created_at) FROM body_measurements WHERE user_id = u.id)
LEFT JOIN progress_daily pd ON u.id = pd.user_id AND pd.progress_date = CURDATE();

-- ========================================
-- VIEW: Workout Progress
-- ========================================
CREATE VIEW v_workout_progress AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT DATE(ws.session_date)) as days_active,
  SUM(CASE WHEN ws.completed THEN 1 ELSE 0 END) as total_workouts_completed,
  SUM(CASE WHEN ws.completed THEN ws.duration_min ELSE 0 END) as total_minutes,
  SUM(CASE WHEN ws.completed THEN ws.estimated_calories ELSE 0 END) as total_calories_burned,
  MAX(ws.session_date) as last_workout_date,
  COUNT(DISTINCT WEEK(ws.session_date)) as weeks_active
FROM users u
LEFT JOIN workout_sessions ws ON u.id = ws.user_id
GROUP BY u.id;


-- ========================================
-- FUNCTION: คำนวณ BMI Category
-- ========================================
DELIMITER //
CREATE FUNCTION fn_get_bmi_category(bmi DECIMAL(5,2))
RETURNS VARCHAR(50)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE category VARCHAR(50);
  IF bmi IS NULL OR bmi < 0 THEN
    RETURN 'ไม่ระบุ';
  ELSEIF bmi < 18.5 THEN
    RETURN 'ผ่อม (Underweight)';
  ELSEIF bmi < 25 THEN
    RETURN 'ปกติ (Normal)';
  ELSEIF bmi < 30 THEN
    RETURN 'น้ำหนักเกิน (Overweight)';
  ELSE
    RETURN 'อ้วน (Obese)';
  END IF;
END //
DELIMITER ;

-- ========================================
-- FUNCTION: คำนวณ Current Streak
-- ========================================
DELIMITER //
CREATE FUNCTION fn_calculate_streak(user_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE streak INT DEFAULT 0;
  DECLARE check_date DATE;
  
  SET check_date = CURDATE();
  
  WHILE EXISTS(
    SELECT 1 FROM progress_daily 
    WHERE user_id = user_id 
    AND progress_date = check_date 
    AND workouts_completed > 0
  ) DO
    SET streak = streak + 1;
    SET check_date = DATE_SUB(check_date, INTERVAL 1 DAY);
  END WHILE;
  
  RETURN streak;
END //
DELIMITER ;

-- ========================================
-- TRIGGERS: ติดตามกิจกรรม
-- ========================================

-- Trigger 1: บันทึกเมื่อ workout session เสร็จสิ้น
DELIMITER //
CREATE TRIGGER tr_workout_completed
AFTER UPDATE ON workout_sessions
FOR EACH ROW
BEGIN
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    -- บันทึกกิจกรรม
    INSERT INTO user_activity_triggers (
      user_id, trigger_type, trigger_value, 
      related_id, related_table, description
    ) VALUES (
      NEW.user_id,
      'workout_completed',
      NEW.day_code,
      NEW.id,
      'workout_sessions',
      CONCAT('Completed workout on ', NEW.session_date, ' for ', COALESCE(NEW.duration_min, 0), ' minutes')
    );
    
    -- อัปเดต progress_daily
    INSERT INTO progress_daily (user_id, progress_date, workouts_completed, total_duration_min)
    VALUES (NEW.user_id, NEW.session_date, 1, COALESCE(NEW.duration_min, 0))
    ON DUPLICATE KEY UPDATE
      workouts_completed = workouts_completed + 1,
      total_duration_min = total_duration_min + COALESCE(NEW.duration_min, 0);
  END IF;
END //
DELIMITER ;

-- Trigger 2: บันทึกเมื่อมีการ log nutrition
DELIMITER //
CREATE TRIGGER tr_nutrition_logged
AFTER INSERT ON nutrition_logs
FOR EACH ROW
BEGIN
  INSERT INTO user_activity_triggers (
    user_id, trigger_type, trigger_value,
    related_id, related_table, description
  ) VALUES (
    NEW.user_id,
    'nutrition_logged',
    NEW.meal_id,
    NEW.id,
    'nutrition_logs',
    CONCAT('Logged ', NEW.meal_id, ' with ', COALESCE(NEW.calories, 0), ' calories')
  );
  
  -- อัปเดต progress_daily
  UPDATE progress_daily 
  SET nutrition_completion_rate = ROUND(
    (SELECT COUNT(DISTINCT meal_id) FROM nutrition_logs 
     WHERE user_id = NEW.user_id AND log_date = NEW.log_date) / 5.0 * 100, 2
  )
  WHERE user_id = NEW.user_id AND progress_date = NEW.log_date;
END //
DELIMITER ;

-- Trigger 3: บันทึกเมื่อมีการอัปเดต weight
DELIMITER //
CREATE TRIGGER tr_weight_updated
AFTER INSERT ON body_measurements
FOR EACH ROW
BEGIN
  INSERT INTO user_activity_triggers (
    user_id, trigger_type, trigger_value,
    related_id, related_table, description
  ) VALUES (
    NEW.user_id,
    'weight_updated',
    CONCAT(NEW.weight_kg, 'kg'),
    NEW.id,
    'body_measurements',
    CONCAT('Updated weight to ', NEW.weight_kg, 'kg, BMI: ', NEW.bmi)
  );
  
  -- อัปเดต progress_daily
  UPDATE progress_daily 
  SET weight_kg = NEW.weight_kg
  WHERE user_id = NEW.user_id AND progress_date = CURDATE();
END //
DELIMITER ;

-- Trigger 4: สร้างการแจ้งเตือน streak เมื่อเสร็จ workout
DELIMITER //
CREATE TRIGGER tr_check_streak_achievement
AFTER UPDATE ON progress_daily
FOR EACH ROW
BEGIN
  DECLARE v_streak INT;
  DECLARE v_achieved BOOLEAN;
  
  SET v_streak = fn_calculate_streak(NEW.user_id);
  
  -- ตรวจสอบ milestone: 7 วัน
  IF v_streak = 7 THEN
    SET v_achieved = (SELECT COUNT(*) FROM user_achievements 
                      WHERE user_id = NEW.user_id AND achievement_id = 'streak_7days') > 0;
    IF NOT v_achieved THEN
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (NEW.user_id, 'streak_7days');
      
      INSERT INTO notifications (user_id, notification_type, title, message)
      VALUES (
        NEW.user_id,
        'achievement',
        '🔥 7 วันติดต่อกัน!',
        'ยินดีด้วย! คุณออกกำลังกายได้ติดต่อกัน 7 วัน เก่งมาก!'
      );
    END IF;
  END IF;
  
  -- ตรวจสอบ milestone: 30 วัน
  IF v_streak = 30 THEN
    SET v_achieved = (SELECT COUNT(*) FROM user_achievements 
                      WHERE user_id = NEW.user_id AND achievement_id = 'streak_30days') > 0;
    IF NOT v_achieved THEN
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (NEW.user_id, 'streak_30days');
      
      INSERT INTO notifications (user_id, notification_type, title, message)
      VALUES (
        NEW.user_id,
        'milestone',
        '🏆 30 วันติดต่อกัน!',
        'ยอดเยี่ยม! คุณได้ 30 วันแบบติดต่อกัน - คุณเป็นนักออกกำลังกายแบบสุด!'
      );
    END IF;
  END IF;
END //
DELIMITER ;

-- Trigger 5: ลบ trigger เก่าเมื่อ progress_daily ถูกอัปเดต
DELIMITER //
CREATE TRIGGER tr_update_progress_timestamp
BEFORE UPDATE ON progress_daily
FOR EACH ROW
BEGIN
  SET NEW.created_at = NEW.created_at;
END //
DELIMITER ;

-- ========================================
-- PROCEDURE: สร้างโปรแกรม 7 วัน
-- ========================================
DELIMITER //
CREATE PROCEDURE sp_create_weekly_program(
  IN p_user_id INT,
  IN p_goal VARCHAR(50),
  IN p_body_type VARCHAR(50)
)
BEGIN
  DECLARE v_program_id INT;
  
  INSERT INTO workout_programs (user_id, goal, body_type, program_name)
  VALUES (
    p_user_id,
    p_goal,
    p_body_type,
    CONCAT('โปรแกรม 7 วัน - ', p_goal, ' (', p_body_type, ')')
  );
  
  SET v_program_id = LAST_INSERT_ID();
  
  -- บันทึก 7 วัน
  INSERT INTO workout_sessions (user_id, program_id, day_code, session_date)
  SELECT 
    p_user_id,
    v_program_id,
    CASE DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL i DAY))
      WHEN 2 THEN 'Monday'
      WHEN 3 THEN 'Tuesday'
      WHEN 4 THEN 'Wednesday'
      WHEN 5 THEN 'Thursday'
      WHEN 6 THEN 'Friday'
      WHEN 7 THEN 'Saturday'
      WHEN 1 THEN 'Sunday'
    END,
    DATE_ADD(CURDATE(), INTERVAL i DAY)
  FROM (
    SELECT 0 as i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
    UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
  ) dates;
  
  SELECT 'OK' as status, v_program_id as program_id;
END //
DELIMITER ;

-- ========================================
-- PROCEDURE: อัปเดต Progress Daily
-- ========================================
DELIMITER //
CREATE PROCEDURE sp_update_daily_progress(
  IN p_user_id INT,
  IN p_date DATE
)
BEGIN
  DECLARE v_workouts INT;
  DECLARE v_duration INT;
  DECLARE v_calories INT;
  DECLARE v_nutrition_rate DECIMAL(5,2);
  DECLARE v_water DECIMAL(8,2);
  
  -- นับ completed workouts
  SELECT COUNT(*), COALESCE(SUM(duration_min), 0), COALESCE(SUM(estimated_calories), 0)
  INTO v_workouts, v_duration, v_calories
  FROM workout_sessions
  WHERE user_id = p_user_id AND session_date = p_date AND completed = TRUE;
  
  -- นับ nutrition logs
  SELECT ROUND(COUNT(DISTINCT meal_id) / 5.0 * 100, 2)
  INTO v_nutrition_rate
  FROM nutrition_logs
  WHERE user_id = p_user_id AND log_date = p_date;
  
  -- ดึง water consumption
  SELECT COALESCE(SUM(water_ml), 0)
  INTO v_water
  FROM nutrition_plans
  WHERE user_id = p_user_id AND plan_date = p_date;
  
  -- อัปเดต progress_daily
  INSERT INTO progress_daily (
    user_id, progress_date, workouts_completed, 
    total_duration_min, total_calories_burned, 
    nutrition_completion_rate, water_consumed_ml
  ) VALUES (
    p_user_id, p_date, v_workouts,
    v_duration, v_calories,
    COALESCE(v_nutrition_rate, 0), COALESCE(v_water, 0)
  )
  ON DUPLICATE KEY UPDATE
    workouts_completed = v_workouts,
    total_duration_min = v_duration,
    total_calories_burned = v_calories,
    nutrition_completion_rate = COALESCE(v_nutrition_rate, 0),
    water_consumed_ml = COALESCE(v_water, 0);
  
  SELECT 'OK' as status;
END //
DELIMITER ;

-- ========================================
-- PROCEDURE: ตรวจสอบและให้รางวัล Achievements
-- ========================================
DELIMITER //
CREATE PROCEDURE sp_check_achievements(IN p_user_id INT)
BEGIN
  DECLARE v_total_workouts INT;
  DECLARE v_streak INT;
  DECLARE v_weight_lost DECIMAL(6,2);
  
  -- นับ total workouts
  SELECT COUNT(*) INTO v_total_workouts
  FROM workout_sessions
  WHERE user_id = p_user_id AND completed = TRUE;
  
  -- คำนวณ streak
  SET v_streak = fn_calculate_streak(p_user_id);
  
  -- คำนวณ weight loss
  SELECT (
    SELECT weight_kg FROM body_measurements WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1
  ) - (
    SELECT weight_kg FROM body_measurements WHERE user_id = p_user_id ORDER BY created_at ASC LIMIT 1
  ) INTO v_weight_lost;
  
  -- Achievement: First Workout
  IF v_total_workouts = 1 THEN
    INSERT IGNORE INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'first_workout');
    INSERT INTO notifications (user_id, notification_type, title, message)
    VALUES (p_user_id, 'achievement', '🎬 ออกแบบแรก!', 'ดีใจด้วย! คุณเริ่มต้นการเดินทางสู่สุขภาพที่ดีแล้ว');
  END IF;
  
  -- Achievement: 10 Workouts
  IF v_total_workouts = 10 THEN
    INSERT IGNORE INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'workout_10');
    INSERT INTO notifications (user_id, notification_type, title, message)
    VALUES (p_user_id, 'achievement', '💪 10 ครั้ง!', 'ยอดเยี่ยม! คุณเสร็จสิ้น 10 เซสชั่นแล้ว');
  END IF;
  
  -- Achievement: 50 Workouts
  IF v_total_workouts = 50 THEN
    INSERT IGNORE INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'workout_50');
    INSERT INTO notifications (user_id, notification_type, title, message)
    VALUES (p_user_id, 'achievement', '🔥 50 ครั้ง!', 'อาจารย์ออกกำลังกาย! คุณเสร็จสิ้น 50 เซสชั่นแล้ว');
  END IF;
  
  -- Achievement: Weight Loss Goal
  IF v_weight_lost >= 5 THEN
    INSERT IGNORE INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 'weight_loss_5kg');
    INSERT INTO notifications (user_id, notification_type, title, message)
    VALUES (p_user_id, 'milestone', '⚖️ ลดน้ำหนัก 5 กิโลแล้ว!', 'ยินดีด้วยกับความสำเร็จนี้!');
  END IF;
  
  SELECT 'Achievement check completed' as status;
END //
DELIMITER ;

-- ========================================
-- PROCEDURE: ลบ Expired Refresh Tokens
-- ========================================
DELIMITER //
CREATE PROCEDURE sp_cleanup_expired_tokens()
BEGIN
  DELETE FROM refresh_tokens WHERE expires_at < NOW();
  SELECT ROW_COUNT() as deleted_count;
END //
DELIMITER ;

-- ========================================
-- SAMPLE DATA: Achievements
-- ========================================
INSERT IGNORE INTO achievements (achievement_id, name, description, category, reward_points) VALUES
('first_workout', '🎬 ออกแบบแรก', 'สำเร็จการออกกำลังกายครั้งแรก', 'workout', 10),
('workout_10', '💪 10 เซสชั่น', 'สำเร็จ 10 เซสชั่นออกกำลังกาย', 'workout', 25),
('workout_50', '🔥 50 เซสชั่น', 'สำเร็จ 50 เซสชั่นออกกำลังกาย', 'workout', 100),
('workout_100', '🏆 100 เซสชั่น', 'สำเร็จ 100 เซสชั่นออกกำลังกาย', 'workout', 250),
('streak_7days', '🔥 7 วันติดต่อ', 'ออกกำลังกายติดต่อกัน 7 วัน', 'consistency', 50),
('streak_30days', '🏆 30 วันติดต่อ', 'ออกกำลังกายติดต่อกัน 30 วัน', 'consistency', 200),
('streak_100days', '👑 100 วันติดต่อ', 'ออกกำลังกายติดต่อกัน 100 วัน', 'consistency', 500),
('weight_loss_5kg', '⚖️ ลด 5 กิโลแล้ว', 'บรรลุเป้าหมายการลดน้ำหนัก 5 กิโล', 'body_transformation', 75),
('weight_loss_10kg', '⚖️ ลด 10 กิโล', 'บรรลุเป้าหมายการลดน้ำหนัก 10 กิโล', 'body_transformation', 150),
('nutrition_tracking_week', '🥗 อาหารติดตาม 7 วัน', 'บันทึกอาหารติดต่อกัน 7 วัน', 'nutrition', 40),
('bmi_normal', '📊 BMI ปกติ', 'บรรลุ BMI ในช่วงปกติ', 'body_transformation', 100),
('perfect_week', '⭐ สัปดาห์ที่สมบูรณ์', 'ทำให้แต่ละวันของสัปดาห์สมบูรณ์', 'special', 150);

-- ========================================
-- INDEXES: Performance Tuning
-- ========================================
CREATE INDEX idx_ws_user_completed ON workout_sessions(user_id, completed, session_date DESC);
CREATE INDEX idx_nl_user_date ON nutrition_logs(user_id, log_date DESC);
CREATE INDEX idx_pd_user_date ON progress_daily(user_id, progress_date DESC);
CREATE INDEX idx_ad_user_date ON ai_detections(user_id, created_at DESC);
CREATE INDEX idx_wp_user_goal ON workout_programs(user_id, goal);
CREATE INDEX idx_uat_user_type ON user_activity_triggers(user_id, trigger_type);
CREATE INDEX idx_notif_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_ua_user_date ON user_achievements(user_id, unlocked_at DESC);

