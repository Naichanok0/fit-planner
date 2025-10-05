<<<<<<< HEAD
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
  fitness_level    ENUM('standard') DEFAULT 'standard',
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

USE Planner;

-- เผื่อมี trigger เดิมชื่อซ้ำ (ไม่มี ก็ข้ามได้)
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


USE Planner;
-- ถ้ายังไม่มีผู้ใช้เลย ให้สร้างทดสอบก่อน (เพื่อมี id)
INSERT INTO users (email, password_hash, join_date) VALUES ('tmp@test.local','x', NOW());

-- ดึง id ล่าสุดของผู้ใช้ที่เพิ่งสร้าง
SET @uid = LAST_INSERT_ID();

-- แทรก refresh token โดย "ไม่ใส่ expires_at" เพื่อทดสอบ trigger
INSERT INTO refresh_tokens (user_id, token) VALUES (@uid, UUID());

-- ดูผลว่าถูกเติม expires_at อัตโนมัติไหม
SELECT id, user_id, token, expires_at
FROM refresh_tokens
ORDER BY id DESC
LIMIT 1;


USE Planner;

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

ALTER TABLE users 
  MODIFY fitness_level ENUM('standard','beginner','intermediate','advanced') 
  DEFAULT 'standard';
=======
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
  fitness_level    ENUM('standard') DEFAULT 'standard',
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

USE Planner;

-- เผื่อมี trigger เดิมชื่อซ้ำ (ไม่มี ก็ข้ามได้)
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


USE Planner;
-- ถ้ายังไม่มีผู้ใช้เลย ให้สร้างทดสอบก่อน (เพื่อมี id)
INSERT INTO users (email, password_hash, join_date) VALUES ('tmp@test.local','x', NOW());

-- ดึง id ล่าสุดของผู้ใช้ที่เพิ่งสร้าง
SET @uid = LAST_INSERT_ID();

-- แทรก refresh token โดย "ไม่ใส่ expires_at" เพื่อทดสอบ trigger
INSERT INTO refresh_tokens (user_id, token) VALUES (@uid, UUID());

-- ดูผลว่าถูกเติม expires_at อัตโนมัติไหม
SELECT id, user_id, token, expires_at
FROM refresh_tokens
ORDER BY id DESC
LIMIT 1;


USE Planner;

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

ALTER TABLE users 
  MODIFY fitness_level ENUM('standard','beginner','intermediate','advanced') 
  DEFAULT 'standard';
>>>>>>> 43f67c0a604e62e4b0d8c7e5220253c5f03eaed1
