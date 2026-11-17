# Medical Coding 24 — Payers and how payment is calculated

> **AIM Biological path** · Stage 4 · Claims, compliance + career · Lesson 24 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 23](mc23-claim-forms-cms-1500-ub-04-and-place-of-service.md) · [All notes](README.md) · [Lesson 25 →](mc25-denials-appeals-audits-fraud-and-abuse.md)

---

**Dataset:** Medicare PFS CY2026 (conversion factor $33.4009 non-APM) · **Time:** ~2 h

**Goal:** Know who pays for what, how much the patient owes, and compute a Medicare fee from RVUs.

#### Visual

```text
 PAYERS        Medicare A hospital · B doctors, outpatient, DME · C Advantage (private plans) · D drugs
               Medicaid (state + federal, by income) · commercial · TRICARE · workers' comp · self-pay

 MEDICARE PHYSICIAN FEE (RBRVS)
   [ work RVU × work GPCI  +  practice expense RVU × PE GPCI  +  malpractice RVU × MP GPCI ]
   × conversion factor ($33.4009 in 2026, $33.5675 for qualifying APM participants)
   example: (1.30 + 1.20 + 0.10) × 1.0 GPCIs = 2.60 RVUs × 33.4009 = $86.84
```

#### Notes

- **Medicare** (federal, mainly 65+ and some disabled people): Part **A** inpatient hospital, skilled nursing, hospice; Part **B** physician services, outpatient care, DME; Part **C** Medicare Advantage plans run by private insurers (they also pay through **risk adjustment**: Lesson 27); Part **D** prescription drugs.
- **Medicaid:** joint state and federal program for people with low income; rules vary by state. A patient with both is "dual eligible": Medicare pays first.
- **Commercial** insurers (large national and regional plans) each have their own policies, fee schedules and prior-authorisation rules.
- **Coordination of benefits:** when a patient has two plans, the **primary** pays first and the **secondary** may pay part of the rest.
- **Patient responsibility:** **deductible** (amount the patient pays each year before the plan pays), **copay** (fixed amount per visit), **coinsurance** (a percentage; Medicare Part B is usually 20% after the deductible).
- **RBRVS:** Medicare values each CPT/HCPCS code with **relative value units** for physician work, practice expense and malpractice. Each is adjusted by a **GPCI** (geographic index), summed and multiplied by the **conversion factor**. Facility and non-facility practice expense differ, which is why POS matters.
- **Hospitals:** inpatient stays are paid per **MS-DRG** (Lesson 26); outpatient hospital services by **APCs**.
- Accurate coding = accurate payment. Under-coding loses the practice money; over-coding creates refunds and penalties.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. Which Medicare part pays for a doctor's office visit?
   - a) Part A
   - b) Part B
   - c) Part D
   - d) Medicaid
2. Medicare Advantage plans are Medicare Part:
   - a) A
   - b) B
   - c) C
   - d) D
3. A fixed $25 the patient pays at each visit is a:
   - a) Deductible
   - b) Copay
   - c) Coinsurance
   - d) Premium
4. RVUs: work 1.30, practice expense 1.20, malpractice 0.10, all GPCIs 1.0. Total RVUs? (number only)
5. 2.60 RVUs × the CY2026 non-APM conversion factor $33.4009 = ? (two decimals, no $)
6. A patient has Medicare and Medicaid. Who pays first?
   - a) Medicaid
   - b) Medicare
   - c) Patient
   - d) Either
7. Inpatient hospital stays under Medicare are paid by:
   - a) RVUs
   - b) MS-DRGs
   - c) APCs
   - d) Copays

**Done when:** all green and you can compute a fee from RVUs with the calculator above, then by hand.

---

[← Lesson 23](mc23-claim-forms-cms-1500-ub-04-and-place-of-service.md) · [All notes](README.md) · [Lesson 25 →](mc25-denials-appeals-audits-fraud-and-abuse.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
