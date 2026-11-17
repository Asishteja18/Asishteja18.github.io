# Medical Coding 27 — AI in medical coding: reviewing machine-suggested codes

> **AIM Biological path** · Stage 4 · Claims, compliance + career · Lesson 27 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 26](mc26-the-inpatient-side-principal-diagnosis-poa-ms-dr.md) · [All notes](README.md) · [Lesson 28 →](mc28-cpc-style-mock-exam.md)

---

**Dataset:** computer-assisted coding output vs real notes · **Time:** ~2 h

**Goal:** Work like a modern coder: let software suggest codes, then catch what it got wrong. Bonus: the bridge to the Digital path.

#### Visual

```text
  provider note ──► AI / NLP suggests codes ──► CODER VALIDATES ──► claim
                         │                          │
                    fast, but can:             checks every code against:
                    • miss a link ('with')      • documentation (is it really there?)
                    • pick unspecified codes    • guidelines + conventions
                    • invent unsupported codes  • sequencing + specificity
                    • ignore 'rule out'         • the code set valid on that date
  RISK ADJUSTMENT (HCC):  each chronic condition needs MEAT in the note:
                          Monitor · Evaluate · Assess/Address · Treat
```

#### Notes

- **Computer-assisted coding (CAC)** reads documentation with natural language processing (NLP) and, more and more, large language models, and **suggests** codes. Coding companies use it to raise productivity; the **coder stays responsible** for every code submitted.
- **Typical AI mistakes** (and they're all things you learned): missing the presumed link (coding E11.9 + N18.30 instead of E11.22 + N18.30); coding "rule out" or "suspected" conditions outpatient; choosing unspecified codes when the note gives laterality; wrong 7th character; mixing up poisoning and adverse effect; suggesting codes from a medication list; outdated or header codes.
- **Your review checklist:** supported by the note? highest specificity? guideline and convention rules (Excludes1, code first, with)? sequencing? valid on the date of service? any missing conditions that affected care?
- **Privacy:** never paste PHI into a public chatbot or unapproved tool. Use only your employer's approved, secured systems.
- **Risk adjustment (HCC coding):** Medicare Advantage plans are paid more for sicker members, based on diagnosis codes grouped into **Hierarchical Condition Categories** (CMS-HCC model V28, fully phased in for 2026). Each chronic condition must be supported by **MEAT** in that year's documentation. HCC and AI-review roles are growing fast in Indian RCM companies.
- **Bridge to Digital:** these tools are machine-learning models trained on notes and codes. If you want to build them, AIM's Digital path teaches Python, ML and how language models work.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. AI suggested E11.9, N18.30, I10 for: 'Type 2 diabetes, CKD stage 3, hypertension, all stable.' Enter the CORRECT codes (diabetes first, then hypertension, then CKD stage).
   - Your codes: ______________
2. AI suggested I21.4 (NSTEMI) for an office note: 'Chest pain, rule out MI, sent to ED.' Correct code?
   - Your codes: ______________
3. AI suggested S52.509A (unspecified side) for: 'Closed fracture of the lower end of the RIGHT radius, initial visit.' Correct code?
   - Your codes: ______________
4. The AI coded diabetes because metformin is on the medication list, but the assessment never mentions diabetes. You:
   - a) Accept it
   - b) Remove it and query the provider if it looks like a missed diagnosis
   - c) Change it to E11.9
   - d) Add Z79.84 only
5. MEAT in risk adjustment stands for:
   - a) Monitor, Evaluate, Assess/Address, Treat
   - b) Medicine, Exam, Assessment, Test
   - c) Measure, Enter, Audit, Track
   - d) Map, Encode, Adjust, Total
6. Is it acceptable to paste a patient's note into a free public chatbot to get codes faster?
   - a) Yes, if you remove the name
   - b) No: use only approved, secure tools
   - c) Yes, for practice charts only

**Done when:** all green and you can list five mistakes AI coders make.

---

[← Lesson 26](mc26-the-inpatient-side-principal-diagnosis-poa-ms-dr.md) · [All notes](README.md) · [Lesson 28 →](mc28-cpc-style-mock-exam.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
