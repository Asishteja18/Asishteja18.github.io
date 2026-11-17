# Medical Coding 12 — Neoplasms and infections

> **AIM Biological path** · Stage 2 · ICD-10-CM diagnosis coding · Lesson 12 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 11](mc11-diabetes-hypertension-and-chronic-kidney-disease.md) · [All notes](README.md) · [Lesson 13 →](mc13-injuries-poisonings-and-external-causes.md)

---

**Dataset:** Table of Neoplasms + guideline sections I.C.2 and I.C.1 · **Time:** ~3 h

**Goal:** Pick the right Neoplasm Table column, sequence cancer treatment encounters, and code infections with their organism.

#### Visual

```text
 TABLE OF NEOPLASMS (site) │ Malignant │ Malignant │ Ca in │ Benign │ Uncertain │ Unspecified
                           │ Primary   │ Secondary │ situ  │        │ behaviour │ behaviour
 breast (female, right) .. │ C50.91-   │ C79.81    │ D05.9-│ D24.1  │ D48.61    │ D49.3
 lung, right ............. │ C34.91    │ C78.0-    │ ...                                 │
   1. look up the HISTOLOGY first in the Index ("Carcinoma" → see Neoplasm, malignant)
   2. then the SITE in the Table, in the right column        3. confirm in the Tabular
```

#### Notes

- **Start with the histology** in the Alphabetic Index (carcinoma, adenoma, lipoma...). The Index tells you which column (malignant, benign...) to use, or gives a code directly. Then find the **site** in the Table of Neoplasms.
- **Primary vs secondary:** "metastatic **from** the breast" = breast is primary. "Metastatic **to** the bone" = bone is secondary (C79.51). Code both primary and secondary when both are present.
- **Current cancer vs history:** if the primary was removed and there is **no further treatment** and no evidence of disease, use a **Z85** personal history code (Z85.3 for breast). If the patient is still treated, keep coding the cancer.
- **Encounters for treatment:** a visit solely for chemotherapy → **Z51.11** first, then the cancer. If the visit is for the cancer itself (for example surgery to remove it), the cancer goes first.
- **Female breast laterality:** C50.911 right, C50.912 left (unspecified site of breast).
- **Infections:** many codes need the **organism** as a second code ("use additional code"): UTI due to E. coli = N39.0 + B96.20. Some codes combine both (J02.0 streptococcal pharyngitis).
- **Sepsis:** code the systemic infection first (A41.9 unspecified organism, A41.51 due to E. coli), then the localized infection. **Severe sepsis** (with organ dysfunction) adds R65.20, or R65.21 with septic shock.
- **HIV:** the FY2026 guidelines rewrote the HIV section (I.C.1.a). Always read the current section before coding HIV; it is a high-risk, high-confidentiality area.
- **COVID-19:** confirmed = U07.1. Exposure without disease = Z20.822.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. Malignant neoplasm of the left female breast (site within the breast not stated), with metastasis to bone. Primary first.
   - Your codes: ______________
2. Patient had a right breast cancer removed 3 years ago, completed treatment, no evidence of disease. Seen today for an unrelated cough. Code only the cancer-related status.
   - Your codes: ______________
3. Encounter solely for antineoplastic chemotherapy for cancer of the colon (site not specified).
   - Your codes: ______________
4. Urinary tract infection due to E. coli.
   - Your codes: ______________
5. Sepsis with a urinary tract infection; organism not identified; no organ dysfunction. Sepsis first.
   - Your codes: ______________
6. 'Adenocarcinoma of the lung metastatic to the brain.' The brain is:
   - a) Primary
   - b) Secondary
   - c) In situ
   - d) Benign
7. Exposure to COVID-19 at work; no symptoms; test negative.
   - Your codes: ______________

**Done when:** all green and you can find a code in the Table of Neoplasms starting from the histology.

---

[← Lesson 11](mc11-diabetes-hypertension-and-chronic-kidney-disease.md) · [All notes](README.md) · [Lesson 13 →](mc13-injuries-poisonings-and-external-causes.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
