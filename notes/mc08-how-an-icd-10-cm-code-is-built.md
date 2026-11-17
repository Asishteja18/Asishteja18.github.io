# Medical Coding 8 — How an ICD-10-CM code is built

> **AIM Biological path** · Stage 2 · ICD-10-CM diagnosis coding · Lesson 8 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 7](mc07-hipaa-compliance-and-reading-clinical-documentat.md) · [All notes](README.md) · [Lesson 9 →](mc09-finding-the-code-alphabetic-index-tabular-list-a.md)

---

**Dataset:** the full FY2026 ICD-10-CM code set (about 74,700 billable codes) · **Time:** ~2 h

**Goal:** Read any code's structure: category, subcategory, laterality, 7th character, placeholder X, and know when a code is billable.

#### Visual

```text
   S   5   2   .   5   0   1   A
   └──category──┘  │   │   │   └ 7th character: encounter (A initial, D subsequent, S sequela)
   letter + 2 chars│   │   └──── 6th: laterality (1 right, 2 left)
   (always 3)      │   └──────── 5th: more detail (type of fracture)
                   └──────────── 4th: site within the bone (lower end of radius)

   T 3 9 . 1 X 1 A      the X is a PLACEHOLDER: the code needs a 7th character,
   W 1 9 . X X X A      so empty positions before it are filled with X
```

#### Notes

- A code is **3 to 7 characters**. Character 1 is a **letter** (every letter is used except U for routine work, which is reserved: U07.1 is COVID-19). Characters 2–3 complete the **category**; a **decimal point** follows the third character.
- Characters 4–6 add detail: cause, body site, severity, **laterality**. Character 7 is an **extension**, used mainly in injuries, poisonings, pregnancy-related fetal codes and some musculoskeletal codes.
- **Billable (valid) code = a code with no further subdivisions.** E11 is a category, E11.6 is a subcategory, E11.65 is billable. Submitting E11.6 gets the claim rejected. Always code to the **highest level of detail** documented.
- **Placeholder X:** when a code needs a 7th character but has fewer than 6 characters, fill the gaps with X. Unspecified fall, initial encounter = W19.XXXA.
- **22 chapters**, roughly by body system or type of problem: A–B infections, C–D49 neoplasms, D50–D89 blood, E endocrine, F mental, G nervous, H eye and ear, I circulatory, J respiratory, K digestive, L skin, M musculoskeletal, N genitourinary, O pregnancy, P newborn (perinatal), Q congenital, R symptoms and abnormal findings, S–T injury and poisoning, V–Y external causes, Z factors influencing health status, U special purposes.
- **Code set year:** ICD-10-CM updates every **1 October** (fiscal year). FY2026 is valid for dates of service 1 Oct 2025 – 30 Sep 2026; it added 487 codes (for example E11.A, type 2 diabetes in remission). Always code with the set valid on the **date of service**.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. Which of these is a billable ICD-10-CM code?
   - a) E11
   - b) E11.6
   - c) E11.65
   - d) E11.6X
2. What does the 7th character A mean on an injury code?
   - a) Subsequent encounter
   - b) Initial encounter (active treatment)
   - c) Sequela
   - d) Left side
3. Why is there an X in W19.XXXA?
   - a) Unknown cause
   - b) Placeholder so the 7th character sits in position 7
   - c) It means unspecified
   - d) It is a typo
4. Which chapter holds symptoms, signs and abnormal findings?
   - a) R
   - b) S
   - c) Z
   - d) Q
5. ICD-10-CM codes update every year on:
   - a) 1 January
   - b) 1 April
   - c) 1 October
   - d) 1 July
6. Use the lookup: unspecified fall, initial encounter.
   - Your codes: ______________
7. Use the lookup: essential (primary) hypertension.
   - Your codes: ______________
8. Use the lookup: COVID-19, confirmed.
   - Your codes: ______________

**Done when:** all green and you can say what each character of S52.501A means.

---

[← Lesson 7](mc07-hipaa-compliance-and-reading-clinical-documentat.md) · [All notes](README.md) · [Lesson 9 →](mc09-finding-the-code-alphabetic-index-tabular-list-a.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
