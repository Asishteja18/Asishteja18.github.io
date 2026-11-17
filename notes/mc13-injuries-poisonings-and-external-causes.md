# Medical Coding 13 — Injuries, poisonings and external causes

> **AIM Biological path** · Stage 2 · ICD-10-CM diagnosis coding · Lesson 13 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 12](mc12-neoplasms-and-infections.md) · [All notes](README.md) · [Lesson 14 →](mc14-pregnancy-newborns-and-z-codes.md)

---

**Dataset:** chapters 19 (S–T) and 20 (V–Y) · **Time:** ~3 h

**Goal:** Choose the 7th character correctly, tell poisoning from adverse effect, and add external cause codes.

#### Visual

```text
  SAME FRACTURE, THREE VISITS                     7th character
  ED: closed fracture set, cast applied     →  S52.501A   initial (active treatment)
  week 3: cast check, healing normally      →  S52.501D   subsequent, routine healing
  1 year later: wrist stiffness from it     →  M25.631 + S52.501S   sequela (residual first)

  POISONING  (wrong drug / overdose / not prescribed)   T-code FIRST  → then the effects
  ADVERSE EFFECT (right drug, taken correctly)          effect FIRST  → then T-code '5'
```

#### Notes

- **7th character for most injuries:** A initial encounter (active treatment: ED, surgery, first evaluation), D subsequent encounter (routine healing or recovery: cast change, removal of sutures, follow-up), S sequela.
- **Fractures** add more letters for healing status: e.g. G delayed healing, K nonunion, P malunion, and B/C for open fractures in many categories. A fracture not documented as open is **closed**; not documented as displaced is **displaced**.
- Active treatment is about the **care**, not the provider: an orthopaedist's first visit after the ED, if still treating actively, is still A.
- **Multiple injuries:** list the most serious first.
- **Poisoning:** wrong substance, wrong dose, overdose, a drug taken with alcohol, or a non-prescribed drug. Code the T36–T65 poisoning code **first** (intent in the 6th character: 1 accidental, 2 intentional self-harm, 3 assault, 4 undetermined), then the manifestations.
- **Adverse effect:** a correctly prescribed drug, properly taken, causes a reaction. Code the **reaction first**, then the T code with **5** as the 6th character (adverse effect).
- **Underdosing** (taking less than prescribed) uses 6 in the 6th character.
- **External cause codes (V00–Y99):** how it happened (W01 slip/trip fall), where (Y92 place), what the patient was doing (Y93 activity), status (Y99). They are **never first-listed**, and you report the place, activity and status codes only once, at the initial encounter.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. ED: closed fracture of the lower end of the right radius (type not specified), from tripping and falling at home (place in home not specified). Fracture first, then how, then where.
   - Your codes: ______________
2. Week 4 follow-up for the same right radius fracture: cast changed, healing as expected.
   - Your codes: ______________
3. Accidental overdose of acetaminophen causing nausea and vomiting. Poisoning first.
   - Your codes: ______________
4. Hyperglycemia caused by prednisone taken exactly as prescribed (patient is not diabetic). Effect first.
   - Your codes: ______________
5. Laceration of the right hand (no foreign body) from contact with broken glass, initial visit. Injury first.
   - Your codes: ______________
6. A fracture note doesn't say open or closed. Code it as:
   - a) Open
   - b) Closed
   - c) Query only
   - d) Unspecified
7. External cause codes can be the first-listed code.
   - a) True
   - b) False

**Done when:** all green and you can explain poisoning vs adverse effect with one example each.

---

[← Lesson 12](mc12-neoplasms-and-infections.md) · [All notes](README.md) · [Lesson 14 →](mc14-pregnancy-newborns-and-z-codes.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
