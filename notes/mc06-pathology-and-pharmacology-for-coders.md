# Medical Coding 6 — Pathology and pharmacology for coders

> **AIM Biological path** · Stage 1 · Healthcare foundations · Lesson 6 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 5](mc05-anatomy-ii-kidneys-reproduction-nerves-hormones.md) · [All notes](README.md) · [Lesson 7 →](mc07-hipaa-compliance-and-reading-clinical-documentat.md)

---

**Dataset:** 30 conditions + 25 drug classes · **Time:** ~2 h

**Goal:** Tell acute from chronic, benign from malignant, and link common medicines to the conditions they treat.

#### Visual

```text
  condition words that change the code
  acute ──► sudden, short          chronic ──► long-lasting, ongoing
  benign ─► does not spread        malignant ► invades, can spread (metastasis)
  primary ► where a cancer started  secondary ► where it spread to
  exacerbation ► flare-up of a chronic disease  (COPD with exacerbation = J44.1)

  medicine on the list  ──► condition it suggests ──► still needs the DOCTOR's diagnosis
  metformin               type 2 diabetes             (never code from drugs alone)
```

#### Notes

- **Acute vs chronic:** the same organ can have both. ICD-10-CM often has separate codes, and when both are documented and the Index lists both, code both with the **acute first** (Lesson 10).
- **Benign vs malignant:** malignant neoplasms are cancers. **Primary** = original site; **secondary** = metastasis. **In situ** = cancer not yet invading. **Uncertain behaviour** and **unspecified behaviour** are separate columns in the Neoplasm Table (Lesson 12).
- **Infections:** bacterial, viral, fungal. Many ICD-10-CM codes need a second code for the organism (for example B96.20 for E. coli).
- **Drug classes and what they treat:** antihypertensives (lisinopril, amlodipine, metoprolol) → hypertension; statins (atorvastatin) → high cholesterol; oral hypoglycemics (metformin, glipizide) and insulin → diabetes; bronchodilators (albuterol) and inhaled steroids → asthma/COPD; anticoagulants (warfarin, apixaban) → atrial fibrillation, clots; PPIs (omeprazole) → GERD; levothyroxine → hypothyroidism; analgesics (acetaminophen, ibuprofen, opioids) → pain; antibiotics → bacterial infections; SSRIs (sertraline) → depression/anxiety.
- **Rule:** a medication list helps you **understand** the chart and find **status codes** (for example long-term insulin use, Z79.4), but you **never** assign a disease code from the drug alone. The provider must document the condition.
- **Routes:** PO (oral), IV (intravenous), IM (intramuscular), SubQ, topical, inhaled. Routes matter for drug administration and HCPCS J-code units (Lesson 21).

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. A tumour that has spread from the breast to the bone. The bone tumour is:
   - a) Primary
   - b) Secondary
   - c) In situ
   - d) Benign
2. Metformin on the medication list, but the provider's note never mentions diabetes. Should you code diabetes?
   - a) Yes, metformin proves it
   - b) No, code only what the provider documents; query if needed
   - c) Yes, but as unspecified
   - d) Code Z79.84 and diabetes
3. Which drug class treats GERD?
   - a) Statins
   - b) Proton pump inhibitors
   - c) Anticoagulants
   - d) SSRIs
4. Warfarin is most likely prescribed for:
   - a) Hypothyroidism
   - b) Atrial fibrillation
   - c) Asthma
   - d) Migraine
5. What one word means a sudden flare-up of a chronic disease, as in 'COPD with ______'?
6. A cancer that has not yet invaded nearby tissue is:
   - a) Carcinoma in situ
   - b) Metastatic
   - c) Benign
   - d) Uncertain behaviour
7. IM means a drug was given:
   - a) By mouth
   - b) Into a vein
   - c) Into a muscle
   - d) Under the tongue

**Done when:** all green and you can read a medication list and say which conditions to look for in the note.

---

[← Lesson 5](mc05-anatomy-ii-kidneys-reproduction-nerves-hormones.md) · [All notes](README.md) · [Lesson 7 →](mc07-hipaa-compliance-and-reading-clinical-documentat.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
