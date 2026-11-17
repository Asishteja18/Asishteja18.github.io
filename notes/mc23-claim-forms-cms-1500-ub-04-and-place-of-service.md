# Medical Coding 23 — Claim forms: CMS-1500, UB-04 and place of service

> **AIM Biological path** · Stage 4 · Claims, compliance + career · Lesson 23 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 22](mc22-ncci-edits-medical-necessity-and-the-abn.md) · [All notes](README.md) · [Lesson 24 →](mc24-payers-and-how-payment-is-calculated.md)

---

**Dataset:** CMS-1500 (02/12) form layout + CMS place-of-service codes · **Time:** ~2 h

**Goal:** Put codes on the right form, in the right boxes, with diagnosis pointers and place of service.

#### Visual

```text
 CMS-1500 (professional: doctors, clinics)       UB-04 (institutional: hospitals, facilities)
 electronic version: 837P                        electronic version: 837I
 ┌ 21  ICD indicator 0 · diagnoses A–L (up to 12) ───────────────────────────────┐
 │ A. E11.22   B. N18.4   C. I12.9   D. ...                                      │
 ├ 24 lines ───────────────────────────────────────────────────────────────────┤
 │ 24A date │ 24B POS │ 24D CPT/HCPCS + modifiers │ 24E pointer │ 24F $ │ 24G units│
 │ 11/03/26 │  11     │ 99214                     │ A B C       │       │ 1        │
 └ 24J rendering provider NPI · 33 billing provider NPI ───────────────────────┘
```

#### Notes

- **CMS-1500** is the paper form for **professional** claims (837P electronic). **UB-04** (CMS-1450) is for **institutional** claims from hospitals and facilities (837I), using revenue codes and ICD-10-PCS for inpatient procedures.
- **Item 21:** up to **12 diagnosis codes**, lettered A–L, with the ICD indicator **0** for ICD-10-CM.
- **Item 24E diagnosis pointer:** each service line points to up to **4** diagnosis letters, the main reason for that service first. This is how you prove medical necessity line by line.
- **Item 24B place of service (POS)**, two-digit CMS codes: **11** office, **12** home, **02** telehealth (not in patient's home), **10** telehealth in patient's home, **19** off-campus outpatient hospital, **21** inpatient hospital, **22** on-campus outpatient hospital, **23** emergency room (hospital), **24** ambulatory surgical center, **31** skilled nursing facility, **32** nursing facility, **81** independent laboratory. POS changes payment (facility vs non-facility rates).
- **NPI:** 10-digit National Provider Identifier. 24J = rendering provider, 33 = billing provider.
- **Other transactions you'll hear about:** 270/271 eligibility check, 276/277 claim status, 835 remittance advice (the payer's explanation of what was paid and why).
- **Clean claim:** no errors, all required data, passes edits the first time. Clean-claim rate is a key KPI for coding teams.
- **Timely filing:** Medicare allows **12 months** from the date of service; commercial payers set their own (often 90–180 days).

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. A doctor's office visit is billed on which form?
   - a) UB-04
   - b) CMS-1500
   - c) CMS-1450
   - d) ABN
2. Place-of-service code for a physician's office? (two digits)
3. Place-of-service code for the emergency room of a hospital? (two digits)
4. How many diagnosis codes fit in item 21 of the CMS-1500?
   - a) 4
   - b) 8
   - c) 12
   - d) 25
5. What does the diagnosis pointer in 24E do?
   - a) Shows the fee
   - b) Links each service to the diagnoses that justify it
   - c) Gives the place of service
   - d) Lists modifiers
6. The payer's electronic explanation of what was paid and why is the:
   - a) 837
   - b) 835
   - c) 270
   - d) 276
7. Medicare timely filing limit:
   - a) 90 days
   - b) 6 months
   - c) 12 months from the date of service
   - d) 2 years

**Done when:** all green and you can fill item 21 and 24 for a three-line visit.

---

[← Lesson 22](mc22-ncci-edits-medical-necessity-and-the-abn.md) · [All notes](README.md) · [Lesson 24 →](mc24-payers-and-how-payment-is-calculated.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
