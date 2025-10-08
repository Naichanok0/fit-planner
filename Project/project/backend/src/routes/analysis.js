// backend/src/routes/analysis.js
const express = require('express');
const router = express.Router();

/**
 * payload ที่รับเข้ามา:
 * {
 *   email?: string,
 *   gender: 'male'|'female'|null,
 *   goal: 'weight-loss'|'muscle-gain'|'maintenance',
 *   height_cm?: number|null,
 *   weight_kg?: number|null,
 *   age?: number|null,
 *   analysis: {
 *     detectedType, confidence, bodyFatPercentage, muscleDistribution, recommendations, poseQuality, matchImage
 *   }
 * }
 */
module.exports = (q) => {
  router.post('/save', async (req, res, next) => {
    try {
      const p = req.body || {};

      // หา user_id จากอีเมล (ง่ายสุดระยะนี้; ในระบบจริงควรใช้ JWT)
      let userId = null;
      if (p.email) {
        const rows = await q('SELECT id FROM users WHERE email=?', [p.email]);
        if (rows.length) userId = rows[0].id;
      }

      // ถ้ายังไม่มี user -> อนุญาตบันทึกแบบ anonymous? ที่นี่บังคับต้องมี user
      if (!userId) {
        return res.status(400).json({ error: 'User not found. กรุณา login หรือแนบ email ที่มีอยู่ในระบบ' });
      }

      // insert ลง body_measurements
      await q(
        `INSERT INTO body_measurements
           (user_id, height_cm, weight_kg, bmi, body_fat_percentage, analysis_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          p.height_cm ?? null,
          p.weight_kg ?? null,
          // คิด BMI ง่าย ๆ ถ้ามีส่วนสูง/น้ำหนัก
          (p.height_cm && p.weight_kg) ? (p.weight_kg / Math.pow(p.height_cm/100, 2)) : null,
          p.analysis?.bodyFatPercentage ?? null,
          JSON.stringify(p.analysis || {})
        ]
      );

      // อัพเดทโปรไฟล์พื้นฐาน (optional)
      if (p.gender || p.goal || p.age != null) {
        await q(
          `UPDATE users SET gender = COALESCE(?, gender),
                            goal   = COALESCE(?, goal),
                            age    = COALESCE(?, age)
             WHERE id = ?`,
          [p.gender ?? null, p.goal ?? null, p.age ?? null, userId]
        );
      }

      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  return router;
};
