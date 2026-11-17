# Medical Coding 7 — HIPAA, compliance and reading clinical documentation

> **AIM Biological path** · Stage 1 · Healthcare foundations · Lesson 7 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 6](mc06-pathology-and-pharmacology-for-coders.md) · [All notes](README.md) · [Lesson 8 →](mc08-how-an-icd-10-cm-code-is-built.md)

---

**Dataset:** a SOAP note and an operative report · **Time:** ~2 h

**Goal:** Protect patient information, understand coding ethics, and find the codable facts in real documentation.

#### Visual

```text
  SOAP NOTE                           what the coder takes from it
  S  Subjective:  "c/o cough x5 days"   symptoms (code only if no diagnosis)
  O  Objective:   temp 38.4, crackles   supports the diagnosis
  A  Assessment:  community-acquired    ◄── DIAGNOSIS CODES come from here
                  pneumonia; HTN stable
  P  Plan:        chest X-ray, amoxicillin  ◄── services, orders, follow-up
```

#### Notes

- **HIPAA** (US, 1996) protects **PHI**: protected health information such as name, date of birth, address, phone, medical record number, Social Security number, photos and any diagnosis tied to a person. Coders see PHI all day.
  - **Minimum necessary:** look only at what you need for the job.
  - Never copy charts to personal devices, email, WhatsApp or screenshots. Offshore coding companies audit this strictly; a breach can end a career and bring large fines.
- **Compliance basics:** code only what is documented; never upcode (bill a higher level than done), never **unbundle** (split one service into many codes to get paid more). Lesson 25 covers fraud vs abuse and audits.
- **Query the provider** when documentation is conflicting, incomplete or unclear. A query asks a non-leading question; it never suggests the answer that pays more.
- **Documentation types:** SOAP / progress notes (office visits), history and physical (H&P), consultation reports, operative reports (pre-op and post-op diagnosis, procedure, findings), discharge summaries, pathology and radiology reports.
- **Operative reports:** code the **post-operative diagnosis**, and if the pathology report is back with a more definitive answer, use that. Read the body of the report, not just the heading: the procedure title can be incomplete.
- **Where diagnoses come from:** the provider's assessment/impression. Nurse notes, patient forms and radiology findings alone are not enough to code a diagnosis for a physician claim (a few exceptions exist, such as BMI).

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. Which of these is PHI?
   - a) A list of ICD-10-CM chapter titles
   - b) A patient's date of birth with their diagnosis
   - c) The CPT book
   - d) A blank claim form
2. In a SOAP note, which section do diagnosis codes mainly come from?
   - a) Subjective
   - b) Objective
   - c) Assessment
   - d) Plan
3. Billing a higher service level than was documented is called:
   - a) Unbundling
   - b) Upcoding
   - c) Querying
   - d) Bundling
4. For a surgery, which diagnosis should the coder use?
   - a) Pre-operative diagnosis
   - b) Post-operative diagnosis (or pathology if more definitive)
   - c) The diagnosis on the appointment request
   - d) The nurse's note
5. A coder may take work charts home on a personal USB stick if they are careful.
   - a) True
   - b) False
6. A good provider query:
   - a) Suggests the diagnosis that pays more
   - b) Asks a clear, non-leading question about unclear documentation
   - c) Is sent only after the claim is paid
   - d) Is not allowed
7. What does the A in SOAP stand for?

**Done when:** all green and you can mark the codable facts in a SOAP note.

---

[← Lesson 6](mc06-pathology-and-pharmacology-for-coders.md) · [All notes](README.md) · [Lesson 8 →](mc08-how-an-icd-10-cm-code-is-built.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
