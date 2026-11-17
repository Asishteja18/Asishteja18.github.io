# Medical Coding 18 — Surgery I: the surgical package and the skin

> **AIM Biological path** · Stage 3 · CPT + HCPCS procedure coding · Lesson 18 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 17](mc17-evaluation-and-management-ii-hospital-ed-prevent.md) · [All notes](README.md) · [Lesson 19 →](mc19-surgery-ii-bones-heart-and-vessels-digestive-sco.md)

---

**Dataset:** CPT surgery guidelines + Integumentary subsection rules · **Time:** ~3 h

**Goal:** Know what a surgical code already includes, then code lesion excisions and wound repairs by size and complexity.

#### Visual

```text
 GLOBAL SURGICAL PACKAGE (Medicare)       0-day | 10-day | 90-day (major: also the day before)
 included: anaesthesia by the surgeon, the surgery, typical follow-up visits, routine
 post-op care. NOT included: an unrelated problem (mod 24), the decision for major
 surgery visit (mod 57), complications needing a return to the OR (mod 78)

 LESION EXCISION SIZE = lesion diameter + narrowest margin x 2
   1.2 cm lesion, 0.2 cm margins  →  1.2 + 0.4 = 1.6 cm   (simple closure included)

 WOUND REPAIR: add lengths of the SAME type (simple / intermediate / complex)
 in the SAME anatomic group, then pick ONE code by the total length
```

#### Notes

- **Surgical package:** a surgical code includes the procedure plus related routine care: local or digital block anaesthesia by the surgeon, one E/M after the decision for surgery on the day before or day of, writing orders, and typical post-operative follow-up. Medicare assigns **global periods**: 0 days (endoscopies, minor), 10 days (minor procedures), 90 days (major; the global period also includes the day before).
- **During the global period:** an unrelated E/M → modifier **24**; an unrelated procedure → **79**; a planned or more extensive related procedure (staged) → **58**; an unplanned return to the operating room for a complication → **78**. The visit where the decision for **major** surgery is made → **57**; for a minor procedure, a separate E/M uses **25**.
- **Lesion excision:** code by **excised diameter** = the lesion's largest diameter plus the narrowest margin on **each** side, and by **benign vs malignant** (from the pathology report) and body area. Simple closure is included; **intermediate or complex** repair is reported separately. Measure before excision.
- **Wound repair (laceration closure):**
  - **Simple:** superficial wound, one-layer closure (includes local anaesthesia and simple cleaning).
  - **Intermediate:** layered closure of deeper layers, **or** a single-layer closure of a heavily contaminated wound needing extensive cleaning.
  - **Complex:** more than layered closure (for example scar revision, debridement, extensive undermining, stents or retention sutures).
  - **Add together** the lengths of repairs of the **same complexity** in the **same anatomic group** listed in the code descriptions; report one code for the total. Different complexities or groups: report separately, most complex first (modifier 59/X{EPSU} as payers require).
- Debridement, skin grafts and flaps, Mohs surgery and breast procedures also live here; graft codes count by area (square centimetres).

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. A benign lesion measures 1.5 cm; the narrowest margins are 0.3 cm on each side. What is the excised diameter in cm? (number only)
2. Two simple repairs on the same anatomic group: 2.5 cm and 3.0 cm. Total length to code, in cm? (number only)
3. A 2 cm simple repair of the scalp and a 3 cm intermediate repair of the arm. How many repair codes?
   - a) One, total 5 cm
   - b) Two, one per complexity
   - c) One intermediate 5 cm
   - d) None, they're bundled
4. Layered closure of the subcutaneous tissue and skin is a:
   - a) Simple repair
   - b) Intermediate repair
   - c) Complex repair
   - d) Excision
5. Ten days after a knee replacement (90-day global) the surgeon treats the patient's unrelated sinusitis. The E/M needs:
   - a) Modifier 25
   - b) Modifier 24
   - c) Modifier 79
   - d) No modifier: it's in the package
6. The visit where the surgeon decides to do major surgery the next day gets which modifier?
   - a) 25
   - b) 57
   - c) 58
   - d) 78
7. A patient returns to the OR during the global period for a bleeding complication of the first surgery. Modifier?
   - a) 76
   - b) 78
   - c) 79
   - d) 58
8. Lesion excision: benign or malignant is decided from:
   - a) The pre-op note
   - b) The pathology report
   - c) The patient's history
   - d) The size

**Done when:** all green and you can measure and add repairs from an operative note.

---

[← Lesson 17](mc17-evaluation-and-management-ii-hospital-ed-prevent.md) · [All notes](README.md) · [Lesson 19 →](mc19-surgery-ii-bones-heart-and-vessels-digestive-sco.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
