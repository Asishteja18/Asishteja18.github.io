# Medical Coding 16 — Evaluation and Management I: office visits

> **AIM Biological path** · Stage 3 · CPT + HCPCS procedure coding · Lesson 16 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 15](mc15-how-the-cpt-book-works.md) · [All notes](README.md) · [Lesson 17 →](mc17-evaluation-and-management-ii-hospital-ed-prevent.md)

---

**Dataset:** 2021+ office/outpatient E/M rules (CPT 2026) · **Time:** ~3 h

**Goal:** Choose new vs established, then the level by medical decision making (MDM) or by total time.

#### Visual

```text
  LEVEL = medical decision making (2 of 3 elements)  OR  total time on the date of the visit

  MDM level         Problems           Data           Risk            New    Established
  straightforward   1 minor            minimal/none   minimal         99202  99212
  low               2 minor, 1 stable  limited        low             99203  99213
                    chronic, 1 acute uncomplicated
  moderate          1+ chronic worse,  moderate       moderate (e.g.  99204  99214
                    2+ stable chronic                 Rx drug mgmt)
  high              1+ chronic severe  extensive      high (e.g.      99205  99215
                    exacerbation, threat to life      hospitalisation)
  time (minutes must be met or exceeded):  new 15/30/45/60   established 10/20/30/40
```

#### Notes

- **New patient:** has **not** received professional services from the physician, or another physician of the **same specialty in the same group**, within the past **3 years**. Otherwise **established**. Same rule regardless of location.
- Office and outpatient visits: new **99202–99205**, established **99211–99215**. (99211 is the brief visit that may not need a physician, for example a nurse blood pressure check.)
- **Choose the level by MDM or by time, whichever the documentation supports better.** History and exam must be "medically appropriate" but no longer decide the level.
- **MDM has three elements; the level is set by two of the three meeting or exceeding it:**
  1. **Number and complexity of problems addressed** (self-limited, stable chronic, acute uncomplicated, chronic with exacerbation, severe threat to life...).
  2. **Amount and complexity of data** reviewed and analysed (tests ordered or reviewed, external notes, independent historian, independent interpretation, discussion with another physician).
  3. **Risk of complications from patient management** (over-the-counter drugs = low; prescription drug management = moderate; decision for hospitalisation or major surgery with risk factors = high).
- **Time:** total time of the physician or other qualified professional on the **date of the encounter**, face-to-face and not (reviewing tests, documenting, counselling). It does not include staff time or separately reported services. The time must be **met or exceeded**: 25 minutes for an established patient = 99213 (20 met, 30 not).
- **Exam tip:** on CPC E/M questions, score each MDM element separately, then take the middle (two of three) result.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. A patient last saw Dr Rao (cardiology) 4 years ago. Today she sees Dr Rao again. New or established?
   - a) New
   - b) Established
   - c) Depends on insurance
   - d) Consultation
2. A patient saw Dr Iyer (family medicine) last year. Today he sees Dr Shah, a family medicine partner in the same group. New or established?
   - a) New
   - b) Established
3. Established patient. MDM elements: problems = moderate, data = limited (low), risk = moderate. Level?
   - a) 99212
   - b) 99213
   - c) 99214
   - d) 99215
4. New patient. MDM elements: problems = low, data = minimal, risk = moderate. Level?
   - a) 99202
   - b) 99203
   - c) 99204
   - d) 99205
5. Established patient, level chosen by time: the physician documents 25 minutes total on the date. Level?
   - a) 99212
   - b) 99213
   - c) 99214
   - d) 99215
6. New patient, 47 minutes total physician time documented, MDM moderate. Best level?
   - a) 99203
   - b) 99204
   - c) 99205
7. Which counts toward the risk element as moderate?
   - a) Rest and fluids advice
   - b) Over-the-counter drug advice
   - c) Prescription drug management
   - d) Reading a lab result
8. Nurse-only blood pressure check for an established patient, no physician involvement. Which code is designed for this?
   - a) 99202
   - b) 99211
   - c) 99212
   - d) 99213

**Done when:** all green and you can level ten mixed E/M scenarios with the MDM helper switched off.

---

[← Lesson 15](mc15-how-the-cpt-book-works.md) · [All notes](README.md) · [Lesson 17 →](mc17-evaluation-and-management-ii-hospital-ed-prevent.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
