# Medical Coding 10 — General coding guidelines

> **AIM Biological path** · Stage 2 · ICD-10-CM diagnosis coding · Lesson 10 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 9](mc09-finding-the-code-alphabetic-index-tabular-list-a.md) · [All notes](README.md) · [Lesson 11 →](mc11-diabetes-hypertension-and-chronic-kidney-disease.md)

---

**Dataset:** ICD-10-CM Official Guidelines FY2026, Section I.B and Section IV (outpatient) · **Time:** ~2.5 h

**Goal:** Apply the rules that decide WHICH conditions to code and in WHAT order for outpatient and physician services.

#### Visual

```text
  provider writes...                         outpatient coder codes...
  "chest pain, r/o MI"                    →  R07.9 chest pain        (never code 'rule out')
  "RLQ pain due to acute appendicitis"    →  K35.80                  (pain is integral: not coded)
  "acute and chronic bronchitis"          →  acute first, then chronic (when both indexed)
  "COPD with acute exacerbation"          →  J44.1  one COMBINATION code covers both
  "DM2, HTN, here for BP check; DM stable" → I10 first (reason for visit), then E11.9
```

#### Notes

- **Signs and symptoms** (chapter R) are coded when the provider has **not** made a definitive diagnosis.
- **Symptoms that are a routine part of a diagnosis are not coded separately** (RLQ pain with appendicitis). Symptoms **not** routinely associated with the diagnosis can be added.
- **Uncertain diagnoses, outpatient:** never code "probable", "suspected", "questionable", "rule out", "compatible with", "consistent with" or "working diagnosis" as if confirmed. Code the condition **to the highest degree of certainty**: the symptoms, signs or abnormal findings. (Inpatient hospital coding is different: there, uncertain diagnoses at discharge are coded as if they existed. Lesson 26.)
- **First-listed diagnosis (outpatient):** the condition chiefly responsible for the encounter. Then code all **coexisting conditions that affect care**, and chronic conditions treated or managed. Do not code conditions that no longer exist.
- **Acute and chronic:** if both are documented and the Index lists separate subterms, code both, **acute first**.
- **Combination codes:** one code for two diagnoses, or a diagnosis with an associated complication. Use it whenever it fully describes the condition; do not add separate codes for what it already includes.
- **Sequela (late effects):** a residual effect after the acute phase is over. Code the residual condition first, then the sequela code (7th character S on injuries).
- **Laterality:** code the side documented; if both sides have the condition and there is no bilateral code, report right and left separately.
- **BMI, pressure ulcer stage and some social factors** may come from other clinicians' notes, but the associated diagnosis (obesity, for example) must come from the provider.
- **Chronic diseases** treated on an ongoing basis can be coded at every visit where they are addressed.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. Outpatient: 'Chest pain, rule out myocardial infarction. Troponin pending.'
   - Your codes: ______________
2. Outpatient: 'Fever and cough. Suspected COVID-19, test sent.' Code fever first, then cough.
   - Your codes: ______________
3. Emergency visit: 'Acute appendicitis, presenting with right lower quadrant pain.'
   - Your codes: ______________
4. Office visit: 'COPD with acute exacerbation.'
   - Your codes: ______________
5. Outpatient note: 'probable pneumonia'. You should:
   - a) Code pneumonia
   - b) Code the symptoms documented
   - c) Code nothing
   - d) Code pneumonia and the symptoms
6. Both acute and chronic bronchitis are documented and the Index lists both. Order?
   - a) Chronic first
   - b) Acute first
   - c) Only acute
   - d) Only chronic
7. Office visit: 'Here for blood pressure follow-up. Essential hypertension, controlled. Hyperlipidemia also reviewed.' Hypertension first.
   - Your codes: ______________

**Done when:** all green and you can explain why 'rule out' is never coded in the office.

---

[← Lesson 9](mc09-finding-the-code-alphabetic-index-tabular-list-a.md) · [All notes](README.md) · [Lesson 11 →](mc11-diabetes-hypertension-and-chronic-kidney-disease.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
