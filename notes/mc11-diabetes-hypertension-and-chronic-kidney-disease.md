# Medical Coding 11 — Diabetes, hypertension and chronic kidney disease

> **AIM Biological path** · Stage 2 · ICD-10-CM diagnosis coding · Lesson 11 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 10](mc10-general-coding-guidelines.md) · [All notes](README.md) · [Lesson 12 →](mc12-neoplasms-and-infections.md)

---

**Dataset:** guideline sections I.C.4 (diabetes), I.C.9 (hypertension), I.C.14 (CKD) · **Time:** ~3 h

**Goal:** Code the most common trio in US charts, including the presumed links between them.

#### Visual

```text
  HYPERTENSION +  ...            ICD-10-CM category      add
  nothing else                 → I10
  heart disease (e.g. failure) → I11.-   (presumed link)  + I50.- type of heart failure
  chronic kidney disease       → I12.-   (presumed link)  + N18.- CKD stage
  heart disease AND CKD        → I13.-                    + I50.- and N18.-

  DIABETES type 2 (E11) + 'with' complication → combination code, e.g.
  E11.22 diabetic CKD  → + N18.- stage       E11.42 diabetic polyneuropathy
  on insulin → + Z79.4      on oral drugs → + Z79.84     both → Z79.4 + Z79.84
```

#### Notes

- **Diabetes mellitus categories:** E08 (due to an underlying condition), E09 (drug or chemical induced), E10 (type 1), E11 (type 2), E13 (other specified). **If the type is not documented, the default is E11 (type 2).**
- Diabetes codes are **combination codes**: E11.22 = type 2 with diabetic CKD; E11.42 = with polyneuropathy; E11.649 = with hypoglycemia without coma; E11.65 = with hyperglycemia; E11.9 = without complications. Assign as many E11 codes as needed to describe all complications.
- **"With" presumes the link:** if the patient has diabetes and CKD, code E11.22 even if the provider did not write "diabetic CKD", unless the provider says the CKD has another cause.
- **Long-term drug status:** add Z79.4 for insulin, Z79.84 for oral hypoglycemics, Z79.85 for injectable non-insulin antidiabetics. If both insulin and oral drugs are used, report both Z79.4 and Z79.84. (Not for a temporary insulin use, and not for type 1, where insulin is implied.)
- **New in FY2026:** E11.A, type 2 diabetes without complications **in remission**, when the provider documents remission.
- **Diabetes in pregnancy** is coded in chapter O (O24.-), and gestational diabetes is O24.4-, not E11.
- **Hypertension:** I10 when there is no heart or kidney involvement. Hypertension with heart disease → I11; with CKD → I12; with both → I13. The link is **presumed** for heart failure and CKD, so use the combination category and add the code for the type of heart failure (I50.-) and the CKD stage (N18.-).
- **CKD stages:** N18.1–N18.5 by stage (stage 3 has N18.30/N18.31/N18.32), **N18.6 ESRD**. Add **Z99.2** for dialysis dependence.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. Type 2 diabetes, no complications, takes insulin daily.
   - Your codes: ______________
2. Type 2 diabetes with diabetic chronic kidney disease, stage 4.
   - Your codes: ______________
3. Hypertension and chronic kidney disease stage 3 (unspecified 3a/3b).
   - Your codes: ______________
4. Hypertensive heart disease with chronic systolic heart failure.
   - Your codes: ______________
5. Hypertension with end-stage renal disease, on dialysis.
   - Your codes: ______________
6. Diabetes (type not stated) without complications.
   - Your codes: ______________
7. Type 2 diabetes with diabetic polyneuropathy; treated with metformin (oral) and insulin.
   - Your codes: ______________
8. FY2026: type 2 diabetes without complications, documented as in remission.
   - Your codes: ______________

**Done when:** all green and you can draw the I10 / I11 / I12 / I13 decision from memory.

---

[← Lesson 10](mc10-general-coding-guidelines.md) · [All notes](README.md) · [Lesson 12 →](mc12-neoplasms-and-infections.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
