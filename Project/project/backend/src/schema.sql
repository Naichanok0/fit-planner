-- schema.sql  (RUN IN MYSQL)
CREATE DATABASE IF NOT EXISTS Planner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Planner;

-- ใช้ใน MySQL 8+
-- โค้ดนี้เลือก charset/engine และสร้างเฉพาะตารางที่จำเป็นตาม frontend

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1) ผู้ใช้: รองรับ Login/Register/Profile
-- อิงฟิลด์จาก AuthProvider + UserProfile (email, name, age, gender, fitness_level, goal, profile_picture เป็นต้น)
-- แหล่งอ้างอิง: AuthProvider.tsx, UserProfile.tsx
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  email            VARCHAR(255) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  first_name       VARCHAR(100),
  last_name        VARCHAR(100),
  age              INT,
  gender           ENUM('male','female'),
  fitness_level    ENUM('standard') DEFAULT 'standard',
  goal             ENUM('weight-loss','muscle-gain','maintenance'),
  phone            VARCHAR(20),
  profile_picture  TEXT,
  join_date        DATETIME,
  last_login       DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) ผลวิเคราะห์ร่างกาย: หน้า BodyAnalysis
-- เก็บค่าจำเป็น (ส่วนสูง/น้ำหนัก/BMI/%ไขมัน/สัดส่วน/ชนิดรูปร่าง) + analysis_json ไว้รายละเอียดเพิ่ม
-- แหล่งอ้างอิง: BodyAnalysis.tsx
DROP TABLE IF EXISTS body_measurements;
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

-- 3) โปรแกรมที่ผู้ใช้เลือก/กำลังใช้งาน: หน้า PersonalProgram
-- program_id, image_ref มาจาก metadata/ไฟล์ JSON ฝั่ง FE
-- แหล่งอ้างอิง: PersonalProgram.tsx
DROP TABLE IF EXISTS user_programs;
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

-- 4) เซสชันการฝึกจริงต่อวัน: ใช้ทั้งหน้า PersonalProgram + ProgressDashboard
-- exercises_json/form_feedback_json เก็บ snapshot ท่าที่ทำและฟีดแบ็กท่าทางจาก FE
-- แหล่งอ้างอิง: PersonalProgram.tsx, ProgressDashboard.tsx
DROP TABLE IF EXISTS workout_sessions;
CREATE TABLE workout_sessions (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  user_id              INT NOT NULL,
  program_id           VARCHAR(100),         -- อ้างอิง id จาก metadata
  day_code             VARCHAR(50),          -- เช่น mg-day1/wl-day3 ฯลฯ
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

-- 5) บันทึกโภชนาการต่อวัน/มื้อตามแผน: หน้า NutritionPlanner
-- รายการอาหารจริงเก็บใน foods_json (metadata เป็นต้นทาง)
-- แหล่งอ้างอิง: NutritionPlanner.tsx
DROP TABLE IF EXISTS nutrition_logs;
CREATE TABLE nutrition_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  log_date      DATE NOT NULL,
  meal_id       VARCHAR(50) NOT NULL,   -- breakfast/lunch/dinner/snack_x
  planned_time  TIME,
  completed     BOOLEAN DEFAULT FALSE,
  calories      INT,
  foods_json    JSON,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_nl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_meal (user_id, log_date, meal_id),
  INDEX idx_nl_user_date (user_id, log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6) สรุปความก้าวหน้ารายวัน (optional แต่ช่วย Dashboard ตอบสนองไว)
-- ถ้าไม่ต้องการ cache สามารถคำนวณจาก workout_sessions + nutrition_logs ตอน query ได้
-- แหล่งอ้างอิง: ProgressDashboard.tsx
DROP TABLE IF EXISTS progress_daily;
CREATE TABLE progress_daily (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT NOT NULL,
  date               DATE NOT NULL,
  total_reps         INT,
  day_streak         INT,
  calories_burned    INT,
  avg_form_score     DECIMAL(5,2),
  exercises_completed INT,
  summary_json       JSON,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pd_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_date (user_id, date),
  INDEX idx_pd_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
