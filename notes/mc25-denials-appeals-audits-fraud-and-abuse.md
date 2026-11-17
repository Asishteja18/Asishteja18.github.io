# Medical Coding 25 — Denials, appeals, audits, fraud and abuse

> **AIM Biological path** · Stage 4 · Claims, compliance + career · Lesson 25 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 24](mc24-payers-and-how-payment-is-calculated.md) · [All notes](README.md) · [Lesson 26 →](mc26-the-inpatient-side-principal-diagnosis-poa-ms-dr.md)

---

**Dataset:** CARC / group codes, Medicare appeal levels, federal fraud laws · **Time:** ~2 h

**Goal:** Read a denial, fix or appeal it, and stay on the right side of compliance.

#### Visual

```text
 REMITTANCE LINE:  CO-97   → group code + claim adjustment reason code (CARC)
   group: CO contractual (write off) · PR patient responsibility · OA other · PI payer initiated
   CARC 1 deductible · 2 coinsurance · 3 copay · 16 missing info · 18 duplicate
        29 timely filing expired · 50 not medically necessary · 97 bundled into another service
 MEDICARE APPEALS  1 redetermination (MAC) → 2 reconsideration (QIC) → 3 ALJ hearing
                   → 4 Medicare Appeals Council → 5 federal district court
```

#### Notes

- **Denial vs rejection:** a **rejected** claim never entered the payer's system (format or data error: fix and resend). A **denied** claim was processed and not paid (appeal or correct).
- **Reading a remittance:** each adjustment has a **group code** (CO, PR, OA, PI) plus a **CARC** number, often with a **RARC** remark explaining more.
- **Common coder-fixable denials:** CO-16 (missing or invalid information), CO-97 (included in another service: bundling), CO-50 (diagnosis doesn't support medical necessity), CO-18 (duplicate), wrong modifier, invalid code for the date of service (for example a header ICD-10-CM code, or last year's code).
- **Appeals:** Medicare has **five levels**; the first, redetermination by the MAC, must be filed within **120 days** of the initial determination. Commercial payers have their own processes.
- **Audits:** internal (by your own team) and external (Recovery Audit Contractors, the OIG, payers). Prospective audits happen before billing, retrospective after payment.
- **Fraud vs abuse vs error:** **fraud** is intentional (billing services never provided, deliberate upcoding). **Abuse** is a practice that causes unnecessary costs without proof of intent (routine overuse of a high E/M level). **Errors** are honest mistakes; fix and refund promptly.
- **Laws:** False Claims Act (penalties for false claims to government programs), Anti-Kickback Statute (no payment for referrals), Stark Law (physician self-referral limits), HIPAA. The OIG keeps a list of **excluded** individuals and entities; providers may not employ or bill for them.
- **Compliance program:** written policies, a compliance officer, training, auditing and monitoring, reporting channels, enforcement and corrective action. Coders are expected to speak up.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. Remittance shows CO-97. Most likely cause?
   - a) Missing information
   - b) The service is bundled into another paid service
   - c) Patient deductible
   - d) Timely filing
2. PR-1 on a line means:
   - a) Write off
   - b) Patient owes it as their deductible
   - c) Duplicate claim
   - d) Not covered
3. A claim bounced back before processing because the NPI was formatted wrongly. That is a:
   - a) Denial
   - b) Rejection
   - c) Appeal
   - d) Audit
4. First level of a Medicare appeal:
   - a) ALJ hearing
   - b) Reconsideration by a QIC
   - c) Redetermination by the MAC
   - d) Federal court
5. A provider knowingly bills for visits that never happened. This is:
   - a) Abuse
   - b) Fraud
   - c) An error
   - d) Upcoding by accident
6. Which law limits physicians referring patients to services they have a financial interest in?
   - a) Stark Law
   - b) HIPAA
   - c) False Claims Act
   - d) Anti-Kickback Statute
7. CO-50 usually means the coder should first check:
   - a) The patient's address
   - b) Whether the diagnosis codes support the service (medical necessity)
   - c) The modifier order
   - d) The NPI

**Done when:** all green and you can explain the difference between fraud and abuse with an example.

---

[← Lesson 24](mc24-payers-and-how-payment-is-calculated.md) · [All notes](README.md) · [Lesson 26 →](mc26-the-inpatient-side-principal-diagnosis-poa-ms-dr.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
