-- =========================
-- schema.sql  (MySQL 8+)
-- =========================
-- ฐานข้อมูลหลัก
CREATE DATABASE IF NOT EXISTS Planner
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE Planner;

-- ตั้งค่าพื้นฐาน
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------
-- DROP ตาราง (ตามลำดับ FK)
-- -------------------------
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS progress_daily;
DROP TABLE IF EXISTS nutrition_logs;
DROP TABLE IF EXISTS workout_sessions;
DROP TABLE IF EXISTS user_programs;
DROP TABLE IF EXISTS body_measurements;
DROP TABLE IF EXISTS users;

-- -------------------------
-- 1) users (บัญชีผู้ใช้)
-- -------------------------
CREATE TABLE users (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  email            VARCHAR(255) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  first_name       VARCHAR(100),
  last_name        VARCHAR(100),
  age              INT,
  gender           ENUM('male','female'),
  fitness_level    ENUM('standard','beginner','intermediate','advanced') DEFAULT 'standard',
  goal             ENUM('weight-loss','muscle-gain','maintenance'),
  phone            VARCHAR(20),
  profile_picture  TEXT,
  join_date        DATETIME,
  last_login       DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------
-- 2) body_measurements (ผลวิเคราะห์ร่างกาย)
-- --------------------------------------
CREATE TABLE body_measurements (
  id                           INT AUTO_INCREMENT PRIMARY KEY,
  user_id                      INT NOT NULL,
  height_cm                    DECIMAL(5,2),
  weight_kg                    DECIMAL(5,2),
  bmi                          DECIMAL(5,2),
  body_fat_percentage          DECIMAL(5,2),
  muscle_mass_kg               DECIMAL(6,2),
  waist_circumference_cm       DECIMAL(5,2),
  chest_circumference_cm       DECIMAL(5,2),
  hip_circumference_cm         DECIMAL(5,2),
  body_type                    ENUM('ectomorph','mesomorph','endomorph'),
  analysis_json                JSON,
  created_at                   DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_bm_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------
-- 3) user_programs (โปรแกรมที่เลือก)
-- --------------------------------
CREATE TABLE user_programs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  program_id    VARCHAR(100) NOT NULL,
  goal          ENUM('weight-loss','muscle-gain','maintenance') NOT NULL,
  image_ref     VARCHAR(255),
  start_date    DATE,
  current_week  INT DEFAULT 1,
  active        BOOLEAN DEFAULT TRUE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_up_user_active (user_id, active),
  INDEX idx_up_user_goal (user_id, goal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------
-- 4) workout_sessions (เซสชันการฝึกต่อวัน/ต่อโปรแกรม)
-- ------------------------------------------------
CREATE TABLE workout_sessions (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  user_id              INT NOT NULL,
  program_id           VARCHAR(100),
  day_code             VARCHAR(50),          -- เช่น mg-day1/wl-day3
  session_date         DATE NOT NULL,
  duration_min         INT,
  estimated_calories   INT,
  completed            BOOLEAN DEFAULT FALSE,
  notes                TEXT,
  exercises_json       JSON,
  form_feedback_json   JSON,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ws_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_daycode_date (user_id, day_code, session_date),
  INDEX idx_ws_user_date (user_id, session_date),
  INDEX idx_ws_user_completed (user_id, completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------
-- 5) nutrition_logs (บันทึกโภชนาการรายมื้อ/รายวัน)
-- ---------------------------------------------
CREATE TABLE nutrition_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  log_date      DATE NOT NULL,
  meal_id       VARCHAR(50) NOT NULL,  -- breakfast/lunch/dinner/snack_x
  planned_time  TIME,
  completed     BOOLEAN DEFAULT FALSE,
  calories      INT,
  foods_json    JSON,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_nl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_meal (user_id, log_date, meal_id),
  INDEX idx_nl_user_date (user_id, log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------
-- 6) progress_daily (สรุปความก้าวหน้ารายวัน)
-- --------------------------------------------
CREATE TABLE progress_daily (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT NOT NULL,
  date                DATE NOT NULL,
  total_reps          INT,
  day_streak          INT,
  calories_burned     INT,
  avg_form_score      DECIMAL(5,2),
  exercises_completed INT,
  summary_json        JSON,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pd_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_date (user_id, date),
  INDEX idx_pd_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------
-- 7) refresh_tokens (เก็บรีเฟรชโทเค็นสำหรับ JWT)
-- --------------------------------------------
CREATE TABLE refresh_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,                     -- *** ตรงกับ users.id (INT) ***
  token VARCHAR(255) NOT NULL,
  revoked TINYINT(1) NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_token (token),
  KEY idx_user_expires (user_id, expires_at),
  CONSTRAINT fk_refresh_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- VIEWS (2 Views)
-- ============================================

-- VIEW 1: User Dashboard Summary
DROP VIEW IF EXISTS v_user_dashboard;
CREATE VIEW v_user_dashboard AS
SELECT 
    u.id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    u.goal,
    u.fitness_level,
    bm.bmi,
    bm.body_type,
    bm.weight_kg,
    bm.height_cm,
    up.program_id,
    up.current_week,
    DATEDIFF(CURDATE(), up.start_date) AS program_days,
    (SELECT COUNT(*) FROM workout_sessions ws WHERE ws.user_id = u.id AND ws.completed = TRUE) AS total_workouts,
    (SELECT COUNT(*) FROM workout_sessions ws WHERE ws.user_id = u.id AND ws.completed = TRUE AND ws.session_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) AS weekly_workouts,
    (SELECT AVG(pd.avg_form_score) FROM progress_daily pd WHERE pd.user_id = u.id AND pd.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) AS avg_form_score_30d,
    (SELECT SUM(pd.calories_burned) FROM progress_daily pd WHERE pd.user_id = u.id AND pd.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) AS weekly_calories_burned
FROM users u
LEFT JOIN body_measurements bm ON u.id = bm.user_id AND bm.id = (
    SELECT MAX(id) FROM body_measurements WHERE user_id = u.id
)
LEFT JOIN user_programs up ON u.id = up.user_id AND up.active = TRUE
WHERE u.email != 'tmp@test.local';

-- VIEW 2: Workout Progress Summary
DROP VIEW IF EXISTS v_workout_progress;
CREATE VIEW v_workout_progress AS
SELECT 
    u.id AS user_id,
    u.email,
    u.goal,
    COUNT(DISTINCT ws.id) AS total_sessions,
    COUNT(DISTINCT CASE WHEN ws.completed = TRUE THEN ws.id END) AS completed_sessions,
    ROUND((COUNT(DISTINCT CASE WHEN ws.completed = TRUE THEN ws.id END) / COUNT(DISTINCT ws.id)) * 100, 2) AS completion_rate,
    SUM(CASE WHEN ws.completed = TRUE THEN ws.duration_min ELSE 0 END) AS total_workout_minutes,
    SUM(CASE WHEN ws.completed = TRUE THEN ws.estimated_calories ELSE 0 END) AS total_calories_burned,
    AVG(CASE WHEN ws.completed = TRUE THEN ws.duration_min ELSE NULL END) AS avg_session_duration,
    MAX(ws.session_date) AS last_workout_date,
    DATEDIFF(CURDATE(), MAX(ws.session_date)) AS days_since_last_workout
FROM users u
LEFT JOIN workout_sessions ws ON u.id = ws.user_id
WHERE u.email != 'tmp@test.local'
GROUP BY u.id, u.email, u.goal;

-- ============================================
-- FUNCTIONS (2 Functions)
-- ============================================

-- FUNCTION 1: Calculate BMI Category
DROP FUNCTION IF EXISTS fn_get_bmi_category;
DELIMITER $$
CREATE FUNCTION fn_get_bmi_category(bmi_value DECIMAL(5,2))
RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE category VARCHAR(20);
    
    IF bmi_value IS NULL THEN
        SET category = 'Unknown';
    ELSEIF bmi_value < 18.5 THEN
        SET category = 'Underweight';
    ELSEIF bmi_value BETWEEN 18.5 AND 24.9 THEN
        SET category = 'Normal';
    ELSEIF bmi_value BETWEEN 25.0 AND 29.9 THEN
        SET category = 'Overweight';
    ELSE
        SET category = 'Obese';
    END IF;
    
    RETURN category;
END$$
DELIMITER ;

-- FUNCTION 2: Calculate User Streak Days
DROP FUNCTION IF EXISTS fn_calculate_streak;
DELIMITER $$
CREATE FUNCTION fn_calculate_streak(user_id_param INT)
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE streak_count INT DEFAULT 0;
    DECLARE current_date_check DATE DEFAULT CURDATE();
    DECLARE has_workout INT DEFAULT 0;
    
    streak_loop: LOOP
        SELECT COUNT(*) INTO has_workout
        FROM workout_sessions 
        WHERE user_id = user_id_param 
          AND session_date = current_date_check 
          AND completed = TRUE;
        
        IF has_workout = 0 THEN
            LEAVE streak_loop;
        END IF;
        
        SET streak_count = streak_count + 1;
        SET current_date_check = DATE_SUB(current_date_check, INTERVAL 1 DAY);
    END LOOP;
    
    RETURN streak_count;
END$$
DELIMITER ;

-- ============================================
-- STORED PROCEDURES (2 Procedures)
-- ============================================

-- PROCEDURE 1: Generate User Progress Report
DROP PROCEDURE IF EXISTS sp_generate_progress_report;
DELIMITER $$
CREATE PROCEDURE sp_generate_progress_report(
    IN user_id_param INT,
    IN days_back INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- สร้างรายงานความก้าวหน้า
    SELECT 
        'Progress Report' AS report_type,
        user_id_param AS user_id,
        days_back AS report_period_days,
        COUNT(DISTINCT pd.date) AS active_days,
        COALESCE(SUM(pd.total_reps), 0) AS total_reps,
        COALESCE(SUM(pd.calories_burned), 0) AS total_calories,
        COALESCE(AVG(pd.avg_form_score), 0) AS avg_form_score,
        COALESCE(MAX(pd.day_streak), 0) AS max_streak,
        fn_calculate_streak(user_id_param) AS current_streak,
        fn_get_bmi_category((
            SELECT bmi FROM body_measurements 
            WHERE user_id = user_id_param 
            ORDER BY created_at DESC 
            LIMIT 1
        )) AS current_bmi_category
    FROM progress_daily pd
    WHERE pd.user_id = user_id_param
      AND pd.date >= DATE_SUB(CURDATE(), INTERVAL days_back DAY);

    -- แสดงรายละเอียดการออกกำลังกาย
    SELECT 
        ws.session_date,
        ws.day_code,
        ws.duration_min,
        ws.estimated_calories,
        ws.completed,
        CASE 
            WHEN ws.completed THEN 'Completed'
            ELSE 'Pending'
        END AS status
    FROM workout_sessions ws
    WHERE ws.user_id = user_id_param
      AND ws.session_date >= DATE_SUB(CURDATE(), INTERVAL days_back DAY)
    ORDER BY ws.session_date DESC;

END$$
DELIMITER ;

-- PROCEDURE 2: Update Daily Progress
DROP PROCEDURE IF EXISTS sp_update_daily_progress;
DELIMITER $$
CREATE PROCEDURE sp_update_daily_progress(
    IN user_id_param INT,
    IN target_date DATE
)
BEGIN
    DECLARE total_reps_calc INT DEFAULT 0;
    DECLARE calories_burned_calc INT DEFAULT 0;
    DECLARE exercises_completed_calc INT DEFAULT 0;
    DECLARE avg_form_score_calc DECIMAL(5,2) DEFAULT 0;
    DECLARE current_streak_calc INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- คำนวณข้อมูลสำหรับวันที่กำหนด
    SELECT 
        COALESCE(SUM(JSON_EXTRACT(exercises_json, '$[*].reps')), 0),
        COALESCE(SUM(estimated_calories), 0),
        COUNT(CASE WHEN completed = TRUE THEN 1 END)
    INTO total_reps_calc, calories_burned_calc, exercises_completed_calc
    FROM workout_sessions
    WHERE user_id = user_id_param AND session_date = target_date;

    -- คำนวณคะแนนฟอร์มเฉลี่ย (สมมติว่ามีข้อมูลใน form_feedback_json)
    SELECT COALESCE(AVG(JSON_EXTRACT(form_feedback_json, '$.overall_score')), 0)
    INTO avg_form_score_calc
    FROM workout_sessions
    WHERE user_id = user_id_param 
      AND session_date = target_date 
      AND completed = TRUE
      AND form_feedback_json IS NOT NULL;

    -- คำนวณ streak
    SET current_streak_calc = fn_calculate_streak(user_id_param);

    -- Insert หรือ Update progress_daily
    INSERT INTO progress_daily (
        user_id, date, total_reps, day_streak, 
        calories_burned, avg_form_score, exercises_completed
    ) VALUES (
        user_id_param, target_date, total_reps_calc, current_streak_calc,
        calories_burned_calc, avg_form_score_calc, exercises_completed_calc
    )
    ON DUPLICATE KEY UPDATE
        total_reps = total_reps_calc,
        day_streak = current_streak_calc,
        calories_burned = calories_burned_calc,
        avg_form_score = avg_form_score_calc,
        exercises_completed = exercises_completed_calc;

    COMMIT;

    -- แสดงผลลัพธ์
    SELECT 
        user_id_param AS user_id,
        target_date AS date,
        total_reps_calc AS total_reps,
        current_streak_calc AS current_streak,
        calories_burned_calc AS calories_burned,
        avg_form_score_calc AS avg_form_score,
        exercises_completed_calc AS exercises_completed,
        'Progress updated successfully' AS message;

END$$
DELIMITER ;

-- ============================================
-- TRIGGERS (3 Triggers รวมเดิม)
-- ============================================

-- TRIGGER 1: Set refresh token expiration
DROP TRIGGER IF EXISTS set_refresh_expires;
DELIMITER $$
CREATE TRIGGER set_refresh_expires
BEFORE INSERT ON refresh_tokens
FOR EACH ROW
BEGIN
  IF NEW.expires_at IS NULL THEN
    SET NEW.expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY);
  END IF;
END$$
DELIMITER ;

-- TRIGGER 2: Auto update progress when workout completed
DROP TRIGGER IF EXISTS tr_workout_completed;
DELIMITER $$
CREATE TRIGGER tr_workout_completed
AFTER UPDATE ON workout_sessions
FOR EACH ROW
BEGIN
    -- เมื่อ workout session เสร็จสิ้น ให้อัปเดต progress_daily อัตโนมัติ
    IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
        CALL sp_update_daily_progress(NEW.user_id, NEW.session_date);
    END IF;
END$$
DELIMITER ;

-- TRIGGER 3: Auto calculate BMI when body measurements inserted/updated
DROP TRIGGER IF EXISTS tr_calculate_bmi;
DELIMITER $$
CREATE TRIGGER tr_calculate_bmi
BEFORE INSERT ON body_measurements
FOR EACH ROW
BEGIN
    -- คำนวณ BMI อัตโนมัติ ถ้ามี height และ weight
    IF NEW.height_cm IS NOT NULL AND NEW.weight_kg IS NOT NULL AND NEW.height_cm > 0 THEN
        SET NEW.bmi = ROUND(NEW.weight_kg / POWER(NEW.height_cm / 100, 2), 2);
    END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_calculate_bmi_update;
DELIMITER $$
CREATE TRIGGER tr_calculate_bmi_update
BEFORE UPDATE ON body_measurements
FOR EACH ROW
BEGIN
    -- คำนวณ BMI อัตโนมัติ เมื่ออัปเดต
    IF NEW.height_cm IS NOT NULL AND NEW.weight_kg IS NOT NULL AND NEW.height_cm > 0 THEN
        SET NEW.bmi = ROUND(NEW.weight_kg / POWER(NEW.height_cm / 100, 2), 2);
    END IF;
END$$
DELIMITER ;

-- ============================================
-- TEST DATA และ EXAMPLES
-- ============================================

USE Planner;

-- ลบข้อมูลทดสอบเดิม
DELETE FROM users WHERE email = 'tmp@test.local';

-- เพิ่มข้อมูลทดสอบ
INSERT INTO users (email, password_hash, first_name, last_name, age, gender, fitness_level, goal, join_date) 
VALUES 
('john.doe@example.com', 'hashed_password_123', 'John', 'Doe', 25, 'male', 'beginner', 'muscle-gain', NOW()),
('jane.smith@example.com', 'hashed_password_456', 'Jane', 'Smith', 30, 'female', 'intermediate', 'weight-loss', NOW());

-- เพิ่มข้อมูล body measurements
INSERT INTO body_measurements (user_id, height_cm, weight_kg, body_fat_percentage, body_type)
VALUES 
(1, 175.0, 70.0, 15.0, 'mesomorph'),
(2, 165.0, 60.0, 22.0, 'ectomorph');

-- เพิ่มข้อมูล workout sessions
INSERT INTO workout_sessions (user_id, program_id, day_code, session_date, duration_min, estimated_calories, completed, exercises_json)
VALUES 
(1, 'mg-program-1', 'mg-day1', CURDATE(), 45, 300, TRUE, '{"exercises": [{"name": "Push-ups", "reps": 15}, {"name": "Squats", "reps": 20}]}'),
(1, 'mg-program-1', 'mg-day2', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 50, 350, TRUE, '{"exercises": [{"name": "Pull-ups", "reps": 8}, {"name": "Planks", "reps": 12}]}'),
(2, 'wl-program-1', 'wl-day1', CURDATE(), 40, 280, TRUE, '{"exercises": [{"name": "Burpees", "reps": 10}, {"name": "Mountain Climbers", "reps": 25}]}');

-- ============================================
-- EXAMPLES การใช้งาน
-- ============================================

-- ตัวอย่าง 1: ดูข้อมูล Dashboard
SELECT * FROM v_user_dashboard WHERE id = 1;

-- ตัวอย่าง 2: ดูความก้าวหน้า Workout
SELECT * FROM v_workout_progress WHERE user_id = 1;

-- ตัวอย่าง 3: เรียกใช้ Function
SELECT 
    email,
    fn_get_bmi_category(bmi) AS bmi_category,
    fn_calculate_streak(id) AS current_streak
FROM v_user_dashboard;

-- ตัวอย่าง 4: สร้างรายงานความก้าวหน้า 7 วันย้อนหลัง
CALL sp_generate_progress_report(1, 7);

-- ตัวอย่าง 5: อัปเดต Progress ของวันนี้
CALL sp_update_daily_progress(1, CURDATE());

-- ตัวอย่าง 6: ดูผลลัพธ์จาก Trigger (BMI จะถูกคำนวณอัตโนมัติ)
SELECT id, user_id, height_cm, weight_kg, bmi, fn_get_bmi_category(bmi) AS bmi_category
FROM body_measurements;