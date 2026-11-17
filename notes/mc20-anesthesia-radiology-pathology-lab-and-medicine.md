# Medical Coding 20 — Anesthesia, Radiology, Pathology/Lab and Medicine

> **AIM Biological path** · Stage 3 · CPT + HCPCS procedure coding · Lesson 20 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 19](mc19-surgery-ii-bones-heart-and-vessels-digestive-sco.md) · [All notes](README.md) · [Lesson 21 →](mc21-modifiers-and-hcpcs-level-ii.md)

---

**Dataset:** CPT section guidelines + CY2026 anaesthesia conversion factor · **Time:** ~2.5 h

**Goal:** Learn the special rules of the four non-surgery sections: anaesthesia units, professional vs technical components, panels, and vaccine coding.

#### Visual

```text
 ANESTHESIA PAYMENT = (base units + time units + modifying units) × anesthesia conversion factor
                      by procedure   15 min = 1 unit  physical status / qualifying circumstances
   e.g. base 5 + 60 min (4 units) = 9 units × $20.4976 (CY2026, non-APM) ≈ $184.48

 RADIOLOGY / TESTS     global = technical component (TC: machine, staff)
                              + professional component (modifier 26: the reading)

 VACCINE VISIT  =  administration code(s)  +  vaccine product code   (+ Z23 diagnosis)
```

#### Notes

- **Anesthesia (00100–01999):** codes by body area. Time runs from when the anaesthesia provider starts preparing the patient to when the patient is safely handed over. Medicare counts **15-minute units**. **Physical status modifiers P1–P6** (healthy → brain-dead donor) and **qualifying circumstance** add-on codes (99100–99140: extreme age, emergency, hypothermia...) add units for some payers. Who gave anaesthesia is shown with HCPCS modifiers (AA anaesthesiologist personally, QK/QX/QY/QZ for medical direction and CRNA situations).
- **CY2026 Medicare anaesthesia conversion factor:** $20.4976 (non-qualifying APM). Main physician fee schedule CF: $33.4009 (non-APM) and $33.5675 (qualifying APM participants).
- **Radiology:** many codes have a **professional component** (the radiologist's interpretation, modifier **26**) and a **technical component** (equipment, technologist; HCPCS modifier **TC**). Hospital-based radiologists usually bill 26; a freestanding imaging centre that owns the machine and reads the scan bills globally (no modifier). Contrast matters: without, with, or without followed by with. Count views.
- **Pathology and Laboratory:** **panels** (organ or disease oriented) may be used only when **every** listed test was performed; otherwise code the tests individually. Surgical pathology is coded per specimen by level. The blood draw (venipuncture) is reported separately where allowed. Modifier 91 = repeat test on the same day for a medically necessary new result (not to confirm a faulty one). CLIA-waived tests may need HCPCS modifier QW.
- **Medicine:** vaccines need **two parts**: an **administration** code (by age and counselling) **plus** the **vaccine product** code. Therapeutic injections (IM/SubQ) have their own administration code and the drug comes from HCPCS (J codes). Also here: psychiatry, dialysis, ophthalmology exams, cardiography (ECGs), allergy testing, physical medicine.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. Anaesthesia: base 6 units, 45 minutes of time (Medicare 15-minute units), no modifying units. Total units? (number only)
2. 9 anaesthesia units × the CY2026 non-APM anaesthesia conversion factor $20.4976 = ? (dollars, two decimals, no $ sign)
3. A hospital-employed radiologist reads a CT scan done on the hospital's machine. The radiologist reports the CT code with:
   - a) TC
   - b) 26
   - c) No modifier
   - d) 59
4. A lab panel lists 8 tests. Only 7 were performed. You should:
   - a) Bill the panel
   - b) Bill the 7 tests individually
   - c) Bill the panel with modifier 52
   - d) Bill nothing
5. A flu vaccine is given at a visit. What procedure codes do you need?
   - a) Only the vaccine product
   - b) Only an administration code
   - c) An administration code plus the vaccine product code
   - d) An E/M code only
6. And the ICD-10-CM code for a visit solely for that flu vaccine?
   - Your codes: ______________
7. Physical status modifier P1 means:
   - a) A normal healthy patient
   - b) Severe systemic disease
   - c) Moribund patient
   - d) Brain-dead organ donor

**Done when:** all green and you can calculate anaesthesia units from start and end times.

---

[← Lesson 19](mc19-surgery-ii-bones-heart-and-vessels-digestive-sco.md) · [All notes](README.md) · [Lesson 21 →](mc21-modifiers-and-hcpcs-level-ii.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
