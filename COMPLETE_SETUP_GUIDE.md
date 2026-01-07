# 🎯 FitLife Planner - Complete Setup & Integration Guide

## 📋 Overview

FitLife Planner เป็นแอปพลิเคชันสุขภาพแบบครบวงจร ที่เชื่อมระหว่าง:
- **Frontend**: React 19 + TypeScript (Port 3000)
- **Backend API**: Node.js + Express (Port 3002)
- **AI Service**: Python + FastAPI (Port 8000)
- **Database**: MySQL 8.0+ (Database: `Planner`)

---

## ✅ Configuration Status

### ✅ Backend (.env / mysql.env)
```
✅ DB_HOST=127.0.0.1
✅ DB_PORT=3306
✅ DB_USER=root
✅ DB_PASS=0858313045z
✅ DB_NAME=Planner
✅ PORT=3002
✅ JWT_ACCESS_SECRET=xK9mZ$4pQwL@2jN&5rH#8vFdG_1aBcE
✅ JWT_REFRESH_SECRET=yM7dR!3tU^9sA%2xBwJ$5kL@8nO#1pQ
✅ CORS_ORIGIN=http://localhost:3000
✅ AI_SERVICE_URL=http://localhost:8000
```

### ✅ Frontend (.env)
```
✅ VITE_API_URL=http://localhost:3002
✅ VITE_AI_URL=http://localhost:8000
```

### ✅ Backend Code
```
✅ server.js - Express server with MySQL pooling
✅ routes/auth.js - JWT authentication
✅ routes/triggers.js - Activity tracking & achievements
✅ routes/workout.js - Workout management
✅ routes/nutrition.js - Nutrition planning
✅ routes/dashboard.js - User dashboard
✅ routes/analysis.js - Body analysis
✅ middleware/auth.js - JWT verification
```

### ✅ Frontend Code
```
✅ lib/api.ts - API client with auto-refresh tokens
✅ components/* - React components using api.ts
✅ .env - Environment configuration
```

### ✅ Database
```
✅ sechmer.sql - Complete SQL schema (ready to import)
  - 14 Tables
  - 2 Views
  - 5 Triggers (auto-tracking)
  - 4 Stored Procedures
  - 13 Achievements
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Import SQL Schema
```bash
# PowerShell in Project/project/backend/src/:
mysql -u root -p0858313045z Planner < sechmer.sql

# Verify:
mysql -u root -p0858313045z Planner
> SHOW TABLES;
-- Should show: 14 tables
> SHOW TRIGGERS;
-- Should show: 5 triggers
```

### Step 2: Start Backend (Terminal 1)
```bash
cd Project/project/backend
npm start

# Expected output:
# [env] DB_HOST = 127.0.0.1
# [db] ready: 1
# ✅ FitLife Planner API running on http://localhost:3002
```

### Step 3: Start Frontend (Terminal 2)
```bash
cd Project/project
npm run dev

# Expected output:
# ➜ Local: http://localhost:3000
```

### (Optional) Step 4: Start AI Service (Terminal 3)
```bash
cd Project/project/backend/backend_Ai
python main.py

# Expected output:
# Uvicorn running on http://localhost:8000
```

---

## 🧪 Validation & Testing

### Health Check
```bash
# Terminal (PowerShell):
node Project/project/backend/src/health-check.js

# Output:
# ✅ Backend server exists at ...
# ✅ Backend env config exists at ...
# ✅ Backend API is running (http://localhost:3002)
# ✅ Database Connection is running (http://localhost:3002/db/health)
```

### Integration Tests
```bash
# Terminal (PowerShell):
node Project/project/backend/src/integration-test.js

# Runs 10 tests:
# ✅ Backend Health Check
# ✅ Database Health Check
# ✅ User Signup
# ✅ User Login
# ✅ Get Dashboard
# ✅ Save Body Measurements
# ✅ Get Activities
# ✅ Log Activity
# ✅ Get Notifications
# ✅ Get Achievements
```

### Manual API Tests
```bash
# Test 1: Backend Health
curl http://localhost:3002/health
# Response: {"ok":true,"service":"FitLife Planner API"}

# Test 2: Database Connection
curl http://localhost:3002/db/health
# Response: {"db":"ok","ping":1}

# Test 3: Get Activities
curl "http://localhost:3002/api/triggers/activities?user_id=1"
# Response: {"ok":true,"activities":[...]}
```

---

## 📊 Database Schema Reference

### Core Tables

#### `users`
- User profiles and authentication
- Fields: id, email, password_hash, name, created_at, updated_at
- Primary Key: id

#### `body_measurements`
- Body analysis results from AI
- Fields: id, user_id, height, weight, chest, waist, hips, bmi, bmi_category, analysis_date, ai_analysis, image_url
- Foreign Key: user_id → users.id

#### `workout_programs`
- Workout plans
- Fields: id, user_id, name, description, difficulty, duration_weeks, created_at
- Foreign Key: user_id → users.id

#### `workout_sessions`
- Individual workout records
- Fields: id, program_id, user_id, date, exercises, duration_minutes, notes, completed
- Foreign Keys: program_id → workout_programs.id, user_id → users.id

#### `nutrition_plans`
- Meal plans
- Fields: id, user_id, name, description, calories_target, created_at
- Foreign Key: user_id → users.id

#### `nutrition_logs`
- Food logs
- Fields: id, plan_id, user_id, food_item, calories, protein, carbs, fat, logged_at
- Foreign Keys: plan_id → nutrition_plans.id, user_id → users.id

#### `progress_daily`
- Daily summary statistics
- Fields: id, user_id, date, workouts_completed, calories_logged, weight, water_ml, sleep_hours, notes
- Foreign Key: user_id → users.id

#### `exercise_library`
- Exercise reference data
- Fields: id, name, description, difficulty, muscle_groups, equipment
- No Foreign Keys

#### `ai_detections`
- AI analysis history
- Fields: id, user_id, detection_date, analysis_type, results, confidence
- Foreign Key: user_id → users.id

#### `refresh_tokens`
- JWT token management
- Fields: id, user_id, token, expires_at, created_at
- Foreign Key: user_id → users.id

#### `user_activity_triggers`
- Activity tracking events
- Fields: id, user_id, activity_type, description, points, created_at
- Trigger: Auto-logged when workout/nutrition completed

#### `notifications`
- User notifications
- Fields: id, user_id, title, message, type, read, created_at
- Trigger: Auto-created on achievements/milestones

#### `achievements`
- Achievement definitions
- Fields: id, badge_name, description, points, condition
- Data: 13 predefined achievements with rewards

#### `user_achievements`
- User achievement tracking
- Fields: id, user_id, achievement_id, unlocked_at, points_earned
- Triggers: Auto-awarded based on activities

### Views

#### `v_user_dashboard`
- Complete user statistics
- Returns: user_id, total_workouts, total_calories, current_weight, streak, achievements_count, total_points

#### `v_workout_progress`
- Workout analytics
- Returns: user_id, program_id, completed_workouts, average_duration, consistency_rate

### Triggers (Auto-Tracking)

1. **tr_workout_completed**
   - When: workout_sessions.completed = true
   - Action: Insert into user_activity_triggers with "workout_completed"

2. **tr_nutrition_logged**
   - When: nutrition_logs inserted
   - Action: Insert into user_activity_triggers with "nutrition_logged"

3. **tr_weight_updated**
   - When: body_measurements inserted/updated
   - Action: Insert into user_activity_triggers with "weight_updated"

4. **tr_check_streak_achievement**
   - When: user completes 7, 30, 100 consecutive days
   - Action: Auto-unlock achievement badges

5. **tr_update_progress_timestamp**
   - When: progress_daily updated
   - Action: Set updated_at timestamp

---

## 🔌 API Endpoints

### 🔐 Authentication
```
POST   /auth/signup                    - Create new account
POST   /auth/login                     - Login user
POST   /auth/refresh                   - Refresh access token
POST   /auth/logout                    - Logout user
```

### 📊 Dashboard
```
GET    /api/dashboard                  - Get user dashboard
POST   /api/dashboard/body-measurements - Save body measurements
```

### 💪 Workouts
```
GET    /api/workout                    - Get user's workout programs
POST   /api/workout                    - Create new program
PUT    /api/workout/:id                - Update program
DELETE /api/workout/:id                - Delete program
```

### 🍎 Nutrition
```
GET    /api/nutrition                  - Get nutrition plans
POST   /api/nutrition                  - Create plan
POST   /api/nutrition/log              - Log food item
GET    /api/nutrition/logs             - Get food logs
```

### 🎯 Triggers & Activities
```
GET    /api/triggers/activities        - Get user activities
POST   /api/triggers/activities        - Log activity
GET    /api/triggers/notifications     - Get notifications
POST   /api/triggers/notifications/:id/read - Mark as read
GET    /api/triggers/achievements      - Get user achievements
GET    /api/triggers/stats             - Get user statistics
GET    /api/triggers/leaderboard       - Get global leaderboard
```

### 🤖 Analysis
```
GET    /api/analysis                   - Get analysis history
POST   /api/analysis                   - Upload image for analysis
```

### 🏥 Health Checks
```
GET    /health                         - Backend health
GET    /db/health                      - Database connection health
```

---

## 🛠️ Frontend Integration Example

### Using API Client in React Component

```typescript
import { apiClient, Activity } from '@/lib/api';
import { useEffect, useState } from 'react';

export function WorkoutTracker() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Load activities on mount
    apiClient.getActivities(1).then(setActivities);
  }, []);

  const handleWorkoutComplete = async () => {
    // Log activity
    await apiClient.logActivity({
      activity_type: 'workout_completed',
      description: '30 min running',
      points: 50,
    });

    // Reload activities
    const updated = await apiClient.getActivities(1);
    setActivities(updated);
  };

  return (
    <div>
      <h2>Workouts: {activities.length}</h2>
      <button onClick={handleWorkoutComplete}>
        Complete Workout
      </button>
    </div>
  );
}
```

### Using Auth in React

```typescript
import { apiClient } from '@/lib/api';

// Sign up
await apiClient.signup('user@example.com', 'password123', 'John Doe');

// Login
await apiClient.login('user@example.com', 'password123');

// Check if authenticated
if (apiClient.isAuthenticated()) {
  // Load dashboard
  const dashboard = await apiClient.getDashboard();
}

// Logout
await apiClient.logout();
```

---

## 🚨 Common Issues & Solutions

### ❌ "MySQL is not reachable"
```
Solution:
1. Check MySQL service is running: 
   → Windows: Services > MySQL80 > Start
2. Verify password in mysql.env matches MySQL root password
3. Check port 3306 is open:
   netstat -an | findstr 3306
```

### ❌ "No database selected" during import
```
Solution:
mysql -u root -p
> CREATE DATABASE IF NOT EXISTS Planner;
> USE Planner;
> source sechmer.sql;
```

### ❌ Frontend can't reach backend
```
Solution:
1. Check backend is running: curl http://localhost:3002/health
2. Check CORS_ORIGIN in mysql.env = http://localhost:3000
3. Check frontend .env: VITE_API_URL=http://localhost:3002
4. Check browser console for CORS errors
```

### ❌ JWT token always expires
```
Solution:
1. Ensure JWT_ACCESS_SECRET is 32+ characters
2. Ensure JWT_REFRESH_SECRET is 32+ characters
3. Check JWT_ACCESS_TTL (900 = 15 min)
4. Check JWT_REFRESH_TTL (2592000 = 30 days)
```

### ❌ AI Service can't connect
```
Solution:
1. Check Python is installed: python --version
2. Start AI service: cd backend/backend_Ai && python main.py
3. Check port 8000: curl http://localhost:8000/docs
4. Check AI_SERVICE_URL in mysql.env = http://localhost:8000
```

---

## 📁 File Structure

```
Project/project/
├── .env                           # Frontend environment
├── .env.example                   # Example config
├── package.json                   # Frontend dependencies
├── vite.config.ts                # Vite config
├── tsconfig.json                 # TypeScript config
│
├── src/
│   ├── lib/
│   │   ├── api.ts               # ✅ API client (UPDATED)
│   │   ├── programs.ts
│   │   └── ...
│   ├── components/
│   │   ├── BodyAnalysisNew.tsx
│   │   ├── NutritionPlanner.tsx
│   │   ├── PersonalizedPrograms.tsx
│   │   └── ...
│   └── App.tsx
│
├── backend/
│   ├── package.json
│   ├── node_modules/
│   │
│   ├── src/
│   │   ├── server.js            # ✅ Main Express server (UPDATED)
│   │   ├── mysql.env            # ✅ Backend env config (UPDATED)
│   │   ├── sechmer.sql          # ✅ SQL schema (READY)
│   │   │
│   │   ├── SETUP_GUIDE.md       # ✅ Setup instructions (NEW)
│   │   ├── health-check.js      # ✅ Health validator (NEW)
│   │   ├── integration-test.js  # ✅ Integration tests (NEW)
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js          # JWT authentication
│   │   │   ├── triggers.js      # ✅ Activity tracking (READY)
│   │   │   ├── workout.js       # Workout management
│   │   │   ├── nutrition.js     # Nutrition planning
│   │   │   ├── dashboard.js     # User dashboard
│   │   │   ├── analysis.js      # Body analysis
│   │   │   └── workout-with-triggers.js  # Workouts + auto-tracking
│   │   │
│   │   └── middleware/
│   │       └── auth.js          # JWT verification middleware
│   │
│   └── backend_Ai/
│       ├── main.py
│       ├── main_working.py
│       ├── run_camera.py
│       ├── run_image.py
│       ├── requirements.txt
│       └── ...
```

---

## 📞 Support & Next Steps

### Immediate Next Steps:
1. ✅ **Import SQL Schema** - `sechmer.sql` into Planner database
2. ✅ **Start Backend** - `npm start` in backend folder
3. ✅ **Start Frontend** - `npm run dev` in project folder
4. ✅ **Run Health Check** - `node health-check.js`
5. ✅ **Run Integration Tests** - `node integration-test.js`

### Advanced Integration:
- [ ] Connect Body Analysis AI to save results
- [ ] Create real user accounts and test full workflow
- [ ] Set up achievement system triggers
- [ ] Test notification system
- [ ] Implement push notifications
- [ ] Set up email notifications

### Production Readiness:
- [ ] Set stronger JWT secrets (128+ chars)
- [ ] Configure database backups
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Configure CDN for static assets
- [ ] Set up CI/CD pipeline
- [ ] Configure SSL/TLS certificates

---

**Generated**: 2024
**FitLife Planner API - Complete Integration Guide**
