# Medical Coding 14 — Pregnancy, newborns and Z codes

> **AIM Biological path** · Stage 2 · ICD-10-CM diagnosis coding · Lesson 14 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 13](mc13-injuries-poisonings-and-external-causes.md) · [All notes](README.md) · [Lesson 15 →](mc15-how-the-cpt-book-works.md)

---

**Dataset:** chapters 15 (O), 16 (P) and 21 (Z) · **Time:** ~2.5 h

**Goal:** Sequence pregnancy codes first, choose the trimester, and use Z codes for visits that aren't illnesses.

#### Visual

```text
  TRIMESTER (counted from the first day of the last menstrual period)
  1st  ─ less than 14 weeks 0 days
  2nd  ─ 14 weeks 0 days to less than 28 weeks 0 days
  3rd  ─ 28 weeks 0 days until delivery

  pregnant patient with any condition → O code FIRST  (+ Z3A weeks of gestation)
  not related to pregnancy at all     → condition first + Z33.1 pregnant state, incidental
  delivery: mother's chart → outcome Z37.-    baby's first chart → Z38.- (place of birth)
```

#### Notes

- **Chapter 15 (O) codes come first** on a pregnant patient's record and are used **only** on the mother's record. If the provider documents that the condition is **not** affecting the pregnancy, code the condition and add **Z33.1**.
- **Trimester:** most O codes end in the trimester at the time of the encounter. Add **Z3A.-** for the weeks of gestation when documented.
- **Routine prenatal care** with no complications: Z34.0- (first pregnancy) or Z34.8- (other). High-risk supervision uses O09.- (for example O09.513, elderly primigravida, third trimester).
- **Pre-existing conditions complicating pregnancy:** hypertension → O10.-; diabetes → O24.0–O24.3; gestational diabetes → O24.4- (diet-controlled, insulin-controlled, oral-drug-controlled). Gestational hypertension → O13.-.
- **Delivery:** a normal, uncomplicated full-term single delivery is **O80**, always with the outcome code **Z37.0** (single live birth) on the mother's record. Any complication means you code that complication instead of O80.
- **Newborn:** the baby's birth record starts with **Z38.-** (Z38.00 single, born vaginally in hospital), then any P or other codes.
- **Z codes** (factors influencing health status) can be first-listed or additional:
  - Encounters: Z00.00 / Z00.01 general adult exam without / with abnormal findings (add codes for the findings), Z23 immunization, Z12.31 screening mammogram, Z12.11 colon cancer screening, Z13.1 diabetes screening, Z09 follow-up after completed treatment.
  - Status and history: Z79.- long-term drugs, Z95.- presence of devices/grafts, Z99.2 dialysis, Z85.- / Z86.- / Z87.- personal history, Z80.- family history, Z68.- BMI (only with an associated condition such as obesity), Z72.0 tobacco use (F17.- is nicotine **dependence**).
- **Screening vs diagnostic:** screening is testing someone **without** symptoms (Z12/Z13 code). If there are symptoms, code the symptoms: it is a diagnostic test.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. Prenatal visit at 32 weeks: gestational diabetes, controlled by diet. O code first.
   - Your codes: ______________
2. Routine prenatal visit, first pregnancy, 10 weeks, no complications.
   - Your codes: ______________
3. Full-term uncomplicated vaginal delivery of a single live baby (mother's record; weeks not documented).
   - Your codes: ______________
4. Baby's birth record: single liveborn infant, born vaginally in the hospital, healthy.
   - Your codes: ______________
5. Adult annual physical, no abnormal findings; flu shot given at the same visit. Exam first.
   - Your codes: ______________
6. A pregnant patient at 20 weeks is 'pregnant, incidental' and seen for a sprained left ankle unrelated to pregnancy. Which code shows the pregnancy?
   - a) Z3A.20 only
   - b) Z33.1
   - c) O99.891
   - d) Z34.02
7. Screening mammogram for a patient with a breast lump. Which is right?
   - a) Use Z12.31 screening
   - b) It is diagnostic: code the lump
   - c) Code both screening and lump first
   - d) No code

**Done when:** all green and you can work out the trimester from weeks of gestation in your head.

---

[← Lesson 13](mc13-injuries-poisonings-and-external-causes.md) · [All notes](README.md) · [Lesson 15 →](mc15-how-the-cpt-book-works.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
