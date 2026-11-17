# Medical Coding 17 — Evaluation and Management II: hospital, ED, preventive, modifier 25

> **AIM Biological path** · Stage 3 · CPT + HCPCS procedure coding · Lesson 17 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 16](mc16-evaluation-and-management-i-office-visits.md) · [All notes](README.md) · [Lesson 18 →](mc18-surgery-i-the-surgical-package-and-the-skin.md)

---

**Dataset:** other E/M categories in CPT 2026 · **Time:** ~2.5 h

**Goal:** Pick the right E/M category by place and type of service, and know when a second same-day service needs modifier 25.

#### Visual

```text
 WHERE / WHAT                         CODES          NOTE
 Office / outpatient                  99202–99215    new vs established, MDM or time
 Hospital inpatient or observation    99221–99223 initial, 99231–99233 subsequent,
                                      99238–99239 discharge (by time)
 Emergency department                 99281–99285    no new/established; MDM only, not time
 Consultations (office / inpatient)   99242–99245 / 99252–99255   Medicare does not pay these
 Critical care                        99291 first 30–74 min, +99292 each extra 30 min
 Preventive medicine                  99381–99387 new, 99391–99397 established, by AGE
 Prolonged service (with 99205/99215) +99417 each 15 min beyond (Medicare: G2212)
```

#### Notes

- **Category first, level second.** Where the patient is (office, hospital, ED, nursing facility, home) and what kind of service it is decide the category.
- **Hospital inpatient and observation** share one set of codes (since 2023): initial, subsequent, same-day admit-and-discharge, and discharge management. Levels use MDM or time.
- **Emergency department** codes have no new/established split and are chosen by **MDM only**.
- **Consultations** require a request from another provider for an opinion. Medicare and many payers do not pay consult codes; then you report the office or hospital visit code instead. Always check the payer.
- **Critical care** is time-based care of a critically ill patient: 99291 for the first 30–74 minutes, +99292 for each additional 30 minutes.
- **Preventive medicine** (annual wellness-type visits) is chosen by **age** and new/established, not by MDM. Counselling and age-appropriate history and exam are included; vaccines and lab tests are reported separately.
- **Modifier 25:** add it to an E/M code when, on the same day as a procedure or another E/M (such as a preventive visit), the provider performs a **significant, separately identifiable** E/M service. Example: during an annual physical, the provider also evaluates and treats a new problem with its own documentation → preventive code + problem-oriented office code with modifier 25.
- **Telehealth:** synchronous audio-video visits may use the office codes with modifier 95 or the telehealth place of service, depending on the payer. CPT also has dedicated telemedicine codes. Payer rules change often; check them.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. A patient is seen in the emergency department. Which code range?
   - a) 99202–99215
   - b) 99281–99285
   - c) 99221–99223
   - d) 99242–99245
2. ED codes distinguish new and established patients.
   - a) True
   - b) False
3. A 45-year-old established patient has a routine annual preventive visit. The code depends on:
   - a) MDM
   - b) Time
   - c) Age and new/established status
   - d) Number of tests
4. During a preventive visit, the doctor also works up a new knee problem with a separate assessment and plan. What does the problem visit need?
   - a) Modifier 59
   - b) Modifier 25
   - c) Modifier 57
   - d) Nothing
5. Critical care of 100 minutes on one date. How is it reported?
   - a) 99291 x2
   - b) 99291 + 99292 x1
   - c) 99291 + 99292 x2
   - d) 99292 x3
6. A Medicare patient is sent to a specialist for an opinion in the office. Medicare does not pay consult codes, so report:
   - a) 99243 anyway
   - b) The appropriate new or established office visit code
   - c) A preventive code
   - d) Nothing
7. Since 2023, hospital inpatient and observation stays use:
   - a) Separate code sets
   - b) The same initial / subsequent / discharge codes
   - c) Only ED codes
   - d) Consult codes

**Done when:** all green and you can pick the E/M category for any setting in under 10 seconds.

---

[← Lesson 16](mc16-evaluation-and-management-i-office-visits.md) · [All notes](README.md) · [Lesson 18 →](mc18-surgery-i-the-surgical-package-and-the-skin.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
