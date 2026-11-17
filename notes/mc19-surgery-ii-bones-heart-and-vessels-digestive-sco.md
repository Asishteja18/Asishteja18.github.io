# Medical Coding 19 — Surgery II: bones, heart and vessels, digestive scopes, other systems

> **AIM Biological path** · Stage 3 · CPT + HCPCS procedure coding · Lesson 19 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 18](mc18-surgery-i-the-surgical-package-and-the-skin.md) · [All notes](README.md) · [Lesson 20 →](mc20-anesthesia-radiology-pathology-lab-and-medicine.md)

---

**Dataset:** CPT surgery subsection rules · **Time:** ~3 h

**Goal:** Apply the coding rules that matter most per body system, especially fracture care and endoscopy.

#### Visual

```text
 FRACTURE CARE                                    ENDOSCOPY FAMILIES
 closed treatment  → no surgical opening           surgical scope INCLUDES the diagnostic scope
   without / with manipulation (reduction)         code the furthest point reached:
 open treatment    → fracture surgically exposed     EGD: oesophagus → stomach → duodenum
 percutaneous fixation → pins through the skin       colonoscopy: rectum → colon → CECUM
 the first cast/splint is INCLUDED in the treatment  (didn't reach the cecum? special rules)
 Medicare screening colonoscopy: HCPCS G0121 (average risk) / G0105 (high risk)
```

#### Notes

- **Musculoskeletal:** fracture and dislocation codes depend on **closed, open or percutaneous treatment** and **with or without manipulation**. These words describe the treatment, not the fracture type (an "open fracture" can get "closed treatment"). The initial cast or splint is included; replacement casts later are separate. Arthroscopy: a surgical arthroscopy includes the diagnostic one.
- **Cardiovascular:** vascular catheter codes depend on **selective vs non-selective** placement and the vascular family and order reached. Pacemakers and defibrillators are coded by what is inserted, replaced or removed (generator, leads). Coronary interventions use HCPCS-defined vessel modifiers (LC, LD, RC...).
- **Digestive:** for any endoscopy, a surgical endoscopy (biopsy, polyp removal) **includes** the diagnostic look. Code to the furthest extent the scope reached. Several techniques on one polyp: one code; different lesions by different techniques: separate codes. Screening colonoscopy for Medicare uses HCPCS G0121 (not high risk) or G0105 (high risk); if a screening becomes therapeutic, Medicare uses the CPT code with modifier PT, commercial payers modifier 33.
- **Urinary and genital:** cystoscopy follows endoscopy logic. The **maternity care** subsection has global obstetric packages (routine antepartum care + delivery + postpartum care); report parts separately only if the provider didn't do all of them.
- **Nervous system:** spinal injections are coded by level and imaging guidance; check what's included.
- **Eye:** cataract extraction with lens implant; laterality via modifiers RT/LT.
- **Exam tip:** surgery is the largest part of the CPC exam. For every scenario, first decide the subsection, then the approach (open, percutaneous, endoscopic), then the specifics.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. A displaced fracture is pushed back into place without cutting the skin, and a cast applied. This is:
   - a) Open treatment
   - b) Closed treatment with manipulation
   - c) Closed treatment without manipulation
   - d) Percutaneous fixation
2. 'Open fracture' describes the injury. 'Open treatment' describes:
   - a) The same thing
   - b) Surgically exposing the fracture site
   - c) A fracture through the skin
   - d) An X-ray
3. During a colonoscopy, a biopsy is taken. How many colonoscopy codes?
   - a) Diagnostic + biopsy
   - b) Only the biopsy code (it includes the diagnostic scope)
   - c) Only diagnostic
   - d) Three
4. Medicare patient, average risk, screening colonoscopy with no findings. Which code set gives the procedure code?
   - a) CPT diagnostic colonoscopy
   - b) HCPCS Level II G0121
   - c) ICD-10-PCS
   - d) Category III
5. A Medicare screening colonoscopy turns into a polyp removal. Which modifier signals it began as a screening?
   - a) 33
   - b) PT
   - c) 59
   - d) 52
6. Global obstetric care includes:
   - a) Only the delivery
   - b) Routine antepartum care, delivery and postpartum care
   - c) Only prenatal visits
   - d) Complications too
7. A diagnostic knee arthroscopy and a surgical meniscus repair are done in the same session (same knee). Report:
   - a) Both
   - b) Only the surgical arthroscopy
   - c) Only the diagnostic
   - d) Neither

**Done when:** all green and you can explain closed vs open treatment and the endoscopy rule to a friend.

---

[← Lesson 18](mc18-surgery-i-the-surgical-package-and-the-skin.md) · [All notes](README.md) · [Lesson 20 →](mc20-anesthesia-radiology-pathology-lab-and-medicine.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
