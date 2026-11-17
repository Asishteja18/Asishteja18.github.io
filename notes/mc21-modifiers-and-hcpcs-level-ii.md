# Medical Coding 21 — Modifiers and HCPCS Level II

> **AIM Biological path** · Stage 3 · CPT + HCPCS procedure coding · Lesson 21 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 20](mc20-anesthesia-radiology-pathology-lab-and-medicine.md) · [All notes](README.md) · [Lesson 22 →](mc22-ncci-edits-medical-necessity-and-the-abn.md)

---

**Dataset:** CPT and HCPCS Level II modifiers, HCPCS sections, drug units · **Time:** ~3 h

**Goal:** Choose modifiers that tell the payer what happened, and code drugs, supplies and equipment with HCPCS Level II.

#### Visual

```text
 HCPCS LEVEL II: one letter + 4 digits                     COMMON MODIFIERS (in our words)
 A  ambulance + medical/surgical supplies (A4253 strips)   25 separate E/M same day
 B  enteral / parenteral nutrition                         26 professional component  TC technical
 E  durable medical equipment (crutches, walkers)          50 bilateral      51 multiple procedures
 G  professional services (temporary)  J  drugs not oral   59 / XE XS XP XU  distinct service
 L  orthotics + prosthetics   Q  temporary   V  vision/hearing   RT / LT right / left side
 DRUG UNITS = dose given ÷ the amount in the code's description (round up partials)
   J3420 vitamin B-12 'up to 1000 mcg': 1000 mcg given = 1 unit
```

#### Notes

- **Modifiers** are two characters added to a procedure code. **CPT modifiers** are numeric; **HCPCS modifiers** are letters or letter + number. They never change what the code means, they add information: side, repeat, reduced service, distinct service, who performed it.
- **Key modifiers, explained in our own words:**
  - 22 unusually difficult or extended procedure (needs documentation); 52 reduced service; 53 discontinued for patient safety after starting.
  - 24, 25, 57, 58, 78, 79: see Lessons 17–18 (global period and same-day E/M).
  - 26 / TC: professional / technical component.
  - 50 bilateral (same procedure both sides, same session); 51 multiple procedures (others besides the main one, many payers apply it themselves); RT / LT, F1–FA fingers, T1–TA toes, E1–E4 eyelids.
  - 59 distinct procedural service; Medicare prefers the more specific **XE** (separate encounter), **XS** (separate structure/organ), **XP** (separate practitioner), **XU** (unusual non-overlapping service). Use only when documentation shows a truly separate service, never just to bypass an edit.
  - 76 repeat procedure by the same physician; 77 by another physician; 91 repeat lab test.
  - 62 two surgeons; 80 / 82 assistant surgeon.
  - 95 synchronous telemedicine; GA a waiver of liability (ABN) is on file (Lesson 22); QW CLIA-waived test; JW drug amount wasted, JZ no drug wasted from a single-dose container.
- **Order:** payment-affecting (pricing) modifiers first, then informational ones.
- **HCPCS Level II:** public CMS code set, one letter + four digits, updated quarterly. Main sections in the visual. Drugs (J codes) are reported in **units** based on the code's description; the administration is coded separately (CPT).

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. The same procedure is done on the left and right knees in one session. Modifier?
   - a) RT
   - b) LT
   - c) 50
   - d) 51
2. Medicare's more specific alternative to modifier 59 when the service was on a different organ or structure:
   - a) XE
   - b) XS
   - c) XP
   - d) XU
3. A lab test is repeated later the same day to get a new result for patient care. Modifier?
   - a) 76
   - b) 77
   - c) 91
   - d) 59
4. Crutches given to a patient come from which HCPCS section?
   - a) A
   - b) E
   - c) J
   - d) L
5. Use HCPCS Level II: vitamin B-12 (cyanocobalamin) injection, 1000 mcg given. (Drug code only.)
   - Your codes: ______________
6. A drug's HCPCS code says 'per 10 mg'. The patient received 25 mg. How many units? (number only)
7. A4253 describes blood glucose test strips per 50. The patient is supplied 100 strips. Units? (number only)
8. Which modifier goes first on a claim line?
   - a) Informational (e.g. RT)
   - b) Payment-affecting (e.g. 26, 50)
   - c) Alphabetical order
   - d) Any order

**Done when:** all green and you can say what 25, 26, 50, 51, 59 and the X modifiers mean without notes.

---

[← Lesson 20](mc20-anesthesia-radiology-pathology-lab-and-medicine.md) · [All notes](README.md) · [Lesson 22 →](mc22-ncci-edits-medical-necessity-and-the-abn.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
