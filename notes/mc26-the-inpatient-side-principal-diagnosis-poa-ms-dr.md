# Medical Coding 26 — The inpatient side: principal diagnosis, POA, MS-DRG and ICD-10-PCS

> **AIM Biological path** · Stage 4 · Claims, compliance + career · Lesson 26 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 25](mc25-denials-appeals-audits-fraud-and-abuse.md) · [All notes](README.md) · [Lesson 27 →](mc27-ai-in-medical-coding-reviewing-machine-suggested.md)

---

**Dataset:** UHDDS definitions, POA indicators, ICD-10-PCS structure · **Time:** ~3 h

**Goal:** Understand how hospital inpatient coding differs, and read a 7-character ICD-10-PCS code.

#### Visual

```text
 ICD-10-PCS  (7 characters, letters + digits, never the letters I or O)
   0     D       T         J        4          Z       Z
 section body   root      body    approach   device  qualifier
 Med/Surg GI    operation  part    percutaneous none    none
          system RESECTION APPENDIX endoscopic
   = laparoscopic appendectomy

 POA indicator on each inpatient diagnosis:  Y present on admission · N not present
   U documentation insufficient · W clinically undetermined · 1 exempt from reporting
```

#### Notes

- **Inpatient facility coding** (hospital stays) uses **ICD-10-CM** for diagnoses and **ICD-10-PCS** for procedures; it's covered by the CCS (AHIMA) and CIC (AAPC) credentials. The physician's own services in the hospital are still CPT.
- **Principal diagnosis** (UHDDS definition): the condition established **after study** to be chiefly responsible for the admission. Not the first symptom, not necessarily what the ED wrote.
- **Uncertain diagnoses, inpatient:** "probable", "suspected", "likely" at the time of **discharge** are coded **as if confirmed**. (Opposite of the outpatient rule in Lesson 10.)
- **Secondary diagnoses** are reported when they affect the stay: clinical evaluation, treatment, diagnostic tests, longer stay or more nursing care.
- **POA (present on admission)** indicators flag whether each diagnosis existed at admission. Conditions acquired in hospital (some infections, falls, pressure injuries) can reduce payment.
- **MS-DRG:** the stay is grouped by principal diagnosis, procedures, secondary diagnoses that are **CCs** (complications/comorbidities) or **MCCs** (major CCs), and discharge status. Each DRG has a relative weight × the hospital's base rate = payment. A missed MCC can cost thousands of dollars, which is why inpatient coding pays more.
- **ICD-10-PCS:** each character has a meaning set by the section. In the Medical and Surgical section (first character 0): body system, **root operation** (the objective: excision B, resection T, drainage 9, replacement R, bypass 1...), body part, **approach** (0 open, 3 percutaneous, 4 percutaneous endoscopic, 7 via natural or artificial opening, 8 via opening endoscopic, X external), device, qualifier. Build codes from the PCS **tables**, not by guessing.
- **Excision vs resection:** excision removes **part** of a body part; resection removes **all** of it.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. Inpatient: discharge summary says 'likely viral pneumonia'. The coder:
   - a) Codes the symptoms only
   - b) Codes it as if confirmed
   - c) Queries every time
   - d) Codes nothing
2. The principal diagnosis is:
   - a) The first diagnosis the ED wrote
   - b) The condition established after study to be chiefly responsible for the admission
   - c) The most expensive diagnosis
   - d) The patient's oldest diagnosis
3. POA indicator 'N' means:
   - a) Not present on admission
   - b) No documentation
   - c) Exempt
   - d) Not applicable
4. In ICD-10-PCS, the 3rd character in the Medical and Surgical section is the:
   - a) Body part
   - b) Approach
   - c) Root operation
   - d) Device
5. Removing ALL of a body part is the root operation:
   - a) Excision
   - b) Resection
   - c) Extraction
   - d) Detachment
6. In 0DTJ4ZZ, the 5th character '4' means the approach was:
   - a) Open
   - b) Percutaneous
   - c) Percutaneous endoscopic (laparoscopic)
   - d) External
7. A secondary diagnosis classed as an MCC usually makes the MS-DRG payment:
   - a) Lower
   - b) Higher
   - c) Unchanged
   - d) Zero

**Done when:** all green and you can name all 7 PCS character positions in order.

---

[← Lesson 25](mc25-denials-appeals-audits-fraud-and-abuse.md) · [All notes](README.md) · [Lesson 27 →](mc27-ai-in-medical-coding-reviewing-machine-suggested.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
