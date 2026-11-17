# Medical Coding 22 — NCCI edits, medical necessity and the ABN

> **AIM Biological path** · Stage 4 · Claims, compliance + career · Lesson 22 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 21](mc21-modifiers-and-hcpcs-level-ii.md) · [All notes](README.md) · [Lesson 23 →](mc23-claim-forms-cms-1500-ub-04-and-place-of-service.md)

---

**Dataset:** CMS National Correct Coding Initiative (quarterly) · **Time:** ~2 h

**Goal:** Know why some code pairs are rejected, when a modifier may legitimately bypass an edit, and how Medicare patients are warned about non-covered services.

#### Visual

```text
 NCCI PROCEDURE-TO-PROCEDURE (PTP) EDIT
   column 1 code  +  column 2 code   → column 2 is NOT paid ...
   modifier indicator 0 → never, no modifier can unlock it
   modifier indicator 1 → unless a valid modifier (59 / XE XS XP XU, etc.) is SUPPORTED by the note
 MEDICALLY UNLIKELY EDIT (MUE) → max units of one code per patient per day
 COVERAGE: NCD (national) / LCD (your MAC's region) list covered diagnoses
 MAY NOT BE COVERED for a Medicare patient → ABN signed before the service → modifier GA
```

#### Notes

- **NCCI** is CMS's set of automated edits that stop incorrect code pairs and impossible unit counts. Medicaid uses them too, and most commercial payers have similar edits. Updated every quarter.
- **PTP edits** pair a **column 1** (comprehensive) code with a **column 2** (component) code. If both are billed for the same patient on the same day by the same provider, column 2 is denied, unless the edit allows a modifier (**modifier indicator 1**) and the documentation proves the services were truly separate: a different site, a different session, a different lesion. Indicator **0** means no modifier can ever unbundle the pair.
- **Mutually exclusive edits** pair procedures that could not reasonably be done together.
- **MUEs** cap the number of units of a code per patient per day (for example a bilateral body part can't be operated on three times).
- **Medical necessity:** Medicare **NCDs** (national) and **LCDs** (from the regional Medicare Administrative Contractor, MAC) list the diagnoses that justify certain services. If your diagnosis code is not on the covered list, the claim denies, even when everything else is correct.
- **ABN (Advance Beneficiary Notice of Non-coverage):** when a provider expects Medicare may deny an item or service as not reasonable and necessary, the patient signs an ABN **before** the service, accepting financial responsibility. Modifiers: **GA** (ABN on file), **GZ** (expected denial, no ABN: the provider can't bill the patient), **GY** (statutorily excluded, not a Medicare benefit at all).
- **Never** add a modifier only to get past an edit. That is a compliance risk (Lesson 25).

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. An NCCI PTP edit has modifier indicator 0. Can modifier 59 make the column 2 code payable?
   - a) Yes
   - b) No
2. What does an MUE limit?
   - a) Which diagnoses are covered
   - b) Units of one code per patient per day
   - c) The fee
   - d) The number of claims per month
3. Coverage rules written by a regional Medicare Administrative Contractor are called:
   - a) NCDs
   - b) LCDs
   - c) MUEs
   - d) PTPs
4. A Medicare patient signed an ABN for a test that may not be covered. Which modifier tells Medicare?
   - a) GA
   - b) GZ
   - c) GY
   - d) 25
5. When must the ABN be signed?
   - a) After the denial
   - b) Before the service is given
   - c) Within 30 days
   - d) Never for Medicare
6. Two procedures on different lesions in different body areas form a PTP pair with indicator 1. You may report the column 2 code with:
   - a) Modifier 25
   - b) Modifier 59 or the right X modifier, if documented
   - c) Modifier 51 only
   - d) No way to report it

**Done when:** all green and you can explain column 1 / column 2 to a new coder.

---

[← Lesson 21](mc21-modifiers-and-hcpcs-level-ii.md) · [All notes](README.md) · [Lesson 23 →](mc23-claim-forms-cms-1500-ub-04-and-place-of-service.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
