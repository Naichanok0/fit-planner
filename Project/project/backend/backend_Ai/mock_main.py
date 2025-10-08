from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os, json
from typing import Optional

app = FastAPI(title="Fit-Planner Mock AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

HERE = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(HERE, "dataset")


@app.post("/pose/")
async def pose_check(file: UploadFile = File(...)):
    content = await file.read()
    if not content or len(content) < 50:
        return JSONResponse({"ok": False, "message": "ไฟล์รูปขนาดเล็กเกินไป"}, status_code=400)
    if not file.content_type.startswith('image/'):
        return JSONResponse({"ok": False, "message": "ไฟล์ไม่ใช่รูปภาพ"}, status_code=400)
    # simple pass-through validation
    return {"ok": True, "message": "ภาพผ่านการตรวจสอบ"}


@app.post("/analyze/")
async def analyze(file: UploadFile = File(...), goal: Optional[str] = Form(None)):
    b = await file.read()
    if not b or len(b) < 50:
        raise HTTPException(status_code=400, detail="ไฟล์รูปไม่ถูกต้อง")
    seed = sum(b[:8]) % 100
    if seed < 25:
        detected = 'slim'
        bf = 11.0
    elif seed < 60:
        detected = 'average'
        bf = 16.0
    elif seed < 85:
        detected = 'muscular'
        bf = 12.0
    else:
        detected = 'heavy'
        bf = 24.0

    if goal == 'weight-loss':
        bf += 1.0
    if goal == 'muscle-gain':
        bf -= 1.0

    return {
        'detectedType': detected,
        'confidence': 0.8,
        'bodyFatPercentage': round(bf,1),
        'muscleDistribution': {'upper': 60, 'lower': 55, 'core': 50},
        'recommendations': ['ทำตามแผนอาหาร', 'ออกกำลังกาย 3-5 วัน/สัปดาห์']
    }


@app.post("/chest/")
async def chest(file: UploadFile = File(...), height_cm: Optional[float] = Form(None), weight_kg: Optional[float] = Form(None), gender: Optional[str] = Form(None), chest_level: float = Form(0.33)):
    await file.read()
    try:
        h = float(height_cm) if height_cm else 170.0
    except:
        h = 170.0
    try:
        w = float(weight_kg) if weight_kg else 70.0
    except:
        w = 70.0

    base = h * 0.52
    body_factor = 1.0 + ((w / (h*0.45)) - 1.0) * 0.12
    gender_factor = 1.02 if (gender == 'male') else 0.98
    chest_cm = round(base * body_factor * gender_factor * (1 + (float(chest_level) - 0.33)*0.2), 1)

    return {"chest_cm": chest_cm, "message": "คำนวณโดยประมาณ (mock)"}


@app.get("/api/programs")
async def get_programs(goal: str = Query(...)):
    metadata_path = os.path.join(DATASET_DIR, 'metadata.json')
    if not os.path.exists(metadata_path):
        return JSONResponse({"items": [], "mealPlanSummary": []})
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        data = []

    key_variants = {goal, goal.replace('-', '_'), goal.replace('_', '-')}
    filtered = [m for m in data if (m.get('goal') in key_variants)]
    if not filtered:
        filtered = [m for m in data if m.get('goal') and goal in m.get('goal')]

    meal_templates = {
        'weight-loss': ['เช้า: โยเกิร์ต + ผลไม้', 'กลางวัน: สลัด+โปรตีน', 'เย็น: ผักนึ่ง+โปรตีน', 'ของว่าง: ถั่ว'],
        'muscle-gain': ['เช้า: ข้าวกล้อง+ไข่', 'กลางวัน: ไก่อบ+มันฝรั่ง', 'เย็น: ปลา+ผัก', 'ก่อนนอน: โปรตีนเชค'],
        'maintenance': ['เช้า: โฮลวีต+อะโวคาโด', 'กลางวัน: ข้าว+กับข้าวสมดุล', 'เย็น: โปรตีน+ผัก', 'ของว่าง: ผลไม้']
    }
    meals = meal_templates.get(goal, meal_templates['maintenance'])

    return JSONResponse({"items": filtered, "mealPlanSummary": meals})


@app.post('/generate_program')
async def generate_program(payload: dict):
    """Generate a programs+nutrition payload from provided analysis and user data.
    Expected JSON body: { analysis: {...}, user: { goal: 'weight-loss'|'muscle-gain'|'maintenance', ... } }
    This is a mock: it picks a matching program from metadata.json (by goal) and maps weeklySchedule to
    program + nutrition shapes.
    """
    analysis = payload.get('analysis') or {}
    user = payload.get('user') or {}
    goal = (user.get('goal') or '').replace('_', '-').lower()

    metadata_path = os.path.join(DATASET_DIR, 'metadata.json')
    if not os.path.exists(metadata_path):
        return JSONResponse({"programs": [], "nutrition": [], "metaId": None})

    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        data = []

    # simple matching by goal
    def normalize(s):
        return str(s or '').replace('_', '-').lower()

    found = None
    for item in data:
        if normalize(item.get('goal')) == normalize(goal):
            found = item
            break
    if not found and len(data) > 0:
        found = data[0]

    def map_programs(datasetEntry: dict):
        today = __import__('datetime').date.today()
        wk = datasetEntry.get('weeklySchedule') or datasetEntry.get('program', {}).get('weeklySchedule') or []
        programs = []
        for idx, dayEntry in enumerate(wk[:7]):
            d = __import__('datetime').date.today() + __import__('datetime').timedelta(days=idx)
            workout = dayEntry.get('workout') if isinstance(dayEntry, dict) else {}
            exercises = []
            for exIdx, ex in enumerate(workout.get('exercises', []) if workout else []):
                exercises.append({
                    'id': f'meta-{idx}-{exIdx}',
                    'name': ex.get('name') or ex.get('title') or f'Exercise {exIdx+1}',
                    'type': ex.get('type', 'strength'),
                    'duration': ex.get('duration', 10),
                    'sets': ex.get('sets'),
                    'reps': ex.get('reps'),
                    'restTime': ex.get('rest'),
                    'difficulty': ex.get('difficulty', 'medium'),
                    'targetMuscles': ex.get('targetMuscles') or [],
                    'instructions': ex.get('instructions') or [],
                    'caloriesBurn': ex.get('estimatedCalories') or 0,
                    'completed': False
                })

            totalDuration = sum(e.get('duration', 0) for e in exercises) or workout.get('duration', 20)
            totalCalories = sum(e.get('caloriesBurn', 0) for e in exercises) or workout.get('estimatedCalories', 0)

            programs.append({
                'id': f'day-{idx+1}',
                'date': d.isoformat(),
                'dayOfWeek': d.strftime('%A'),
                'dayNumber': idx + 1,
                'theme': workout.get('name') or (dayEntry.get('day') if isinstance(dayEntry, dict) else f'Day {idx+1}'),
                'totalDuration': totalDuration,
                'totalCalories': totalCalories,
                'exercises': exercises,
                'isCompleted': False,
                'completionRate': 0
            })
        return programs

    def map_nutrition(datasetEntry: dict):
        wk = datasetEntry.get('weeklySchedule') or datasetEntry.get('program', {}).get('weeklySchedule') or []
        nutrition = []
        for dayEntry in wk[:7]:
            workout = dayEntry.get('workout') if isinstance(dayEntry, dict) else {}
            meals = (dayEntry.get('meals') or workout.get('meals') or []) if isinstance(dayEntry, dict) else []
            mapped_meals = []
            for m in meals:
                mapped_meals.append({
                    'id': m.get('id') or (m.get('name') or '').lower().replace(' ', '_') or 'meal',
                    'name': m.get('name') or 'มื้ออาหาร',
                    'time': m.get('time') or '12:00',
                    'nutrition': m.get('nutrition') or {'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0, 'fiber': 0, 'water': 0},
                    'foods': m.get('foods') or [],
                    'note': m.get('note')
                })

            totalCalories = sum((mm['nutrition'].get('calories', 0) for mm in mapped_meals))
            totalProtein = sum((mm['nutrition'].get('protein', 0) for mm in mapped_meals))
            totalCarbs = sum((mm['nutrition'].get('carbs', 0) for mm in mapped_meals))
            totalFat = sum((mm['nutrition'].get('fat', 0) for mm in mapped_meals))
            totalFiber = sum((mm['nutrition'].get('fiber', 0) for mm in mapped_meals))

            nutrition.append({
                'day': (dayEntry.get('day') if isinstance(dayEntry, dict) else 'Day'),
                'meals': mapped_meals,
                'totalCalories': totalCalories,
                'totalProtein': totalProtein,
                'totalCarbs': totalCarbs,
                'totalFat': totalFat,
                'totalFiber': totalFiber,
                'waterGoal': (dayEntry.get('water') if isinstance(dayEntry, dict) else 2.3) or 2.3,
                'completed': False,
                'completionRate': 0
            })
        return nutrition

    if not found:
        return JSONResponse({"programs": [], "nutrition": [], "metaId": None})

    programs = map_programs(found)
    nutrition = map_nutrition(found)
    metaId = found.get('program', {}).get('id') or found.get('id')

    return JSONResponse({"programs": programs, "nutrition": nutrition, "metaId": metaId})


if __name__ == '__main__':
    uvicorn.run('mock_main:app', host='127.0.0.1', port=8000, reload=False)
