# Medical Coding 9 — Finding the code: Alphabetic Index, Tabular List and conventions

> **AIM Biological path** · Stage 2 · ICD-10-CM diagnosis coding · Lesson 9 of 28  
> ICD-10-CM FY2026 · CPT descriptions are AMA copyright: use your own CPT book · source: [MEDCODE_MASTER.md](../syllabus/MEDCODE_MASTER.md)

[← Lesson 8](mc08-how-an-icd-10-cm-code-is-built.md) · [All notes](README.md) · [Lesson 10 →](mc10-general-coding-guidelines.md)

---

**Dataset:** ICD-10-CM Index and Tabular conventions · **Time:** ~2.5 h

**Goal:** Use the two-step method (Index → Tabular) and obey the instructional notes that change which codes you report.

#### Visual

```text
 STEP 1  ALPHABETIC INDEX  — look up the CONDITION (not the body part)
         Pharyngitis (acute) ......... J02.9          ◄ (acute) in parentheses = nonessential word
           - streptococcal ........... J02.0          ◄ subterm, indented
 STEP 2  TABULAR LIST      — ALWAYS confirm the code and read every note
         J02 Acute pharyngitis
           Excludes1: chronic pharyngitis (J31.2)    ◄ never code these two together
           J02.0 Streptococcal pharyngitis
           J02.9 Acute pharyngitis, unspecified
```

#### Notes

- **Never code from the Index alone.** The Index points you to a code; the Tabular List tells you whether it needs more characters and which notes apply.
- **Main terms are conditions**, not anatomy: look up "Fracture, radius", "Infection, urinary tract", "Pain, chest". Anatomical sites appear as subterms.
- **Punctuation:** parentheses ( ) hold **nonessential modifiers** (words that may or may not be in the note without changing the code). Square brackets [ ] hold synonyms in the Tabular, and in the Index they show a **manifestation code** that must follow the underlying condition. A colon : ends a phrase that needs one of the words after it.
- **NEC** = not elsewhere classifiable: the note is specific but there is no specific code. **NOS** / **unspecified** = the note is not specific. Use unspecified codes only when the record truly lacks detail.
- **Includes / Excludes:**
  - **Excludes1** = NOT CODED HERE, never report both together (the two conditions cannot exist together), except when they are unrelated.
  - **Excludes2** = NOT INCLUDED HERE: the excluded condition is a different problem; you may report both if the patient has both.
- **Etiology / manifestation:** "**Code first** underlying condition" sits on manifestation codes; "**Use additional code**" sits on etiology codes. The underlying cause goes first.
- **"Code also"** = two codes may be needed; sequence depends on the circumstances.
- **"With" / "in"** in the Index or Tabular means the two conditions are **presumed linked** unless the provider says they are unrelated (diabetes with CKD → E11.22).
- **"See"** sends you to another term (follow it); **"see also"** offers another place to look.
- **Default code:** the code listed right after the main term is used when no further detail is documented.

#### Practice

Answer these, then check yourself with instant grading on [telugucoders.com](https://telugucoders.com/) (choose the Biological path).

1. To code 'fracture of the right patella', which main term do you look up in the Index?
   - a) Patella
   - b) Right
   - c) Fracture
   - d) Knee
2. An Excludes1 note means:
   - a) The two conditions are never coded together
   - b) Code both if present
   - c) Code the excluded one first
   - d) It is a suggestion
3. 'Acute pharyngitis' — the word (acute) is shown in parentheses after the main term. That means:
   - a) The code is only for acute cases
   - b) The word may be present or absent without changing the code
   - c) Ignore the main term
   - d) You must query
4. A manifestation code has the note 'Code first underlying disease'. What goes first?
   - a) The manifestation
   - b) The underlying disease (etiology)
   - c) Either
   - d) Only the manifestation
5. NEC means:
   - a) The record is vague
   - b) The record is specific but no specific code exists
   - c) Not an emergency case
   - d) Never coded
6. Code: acute pharyngitis due to streptococcus.
   - Your codes: ______________
7. Code: otitis media, right ear (no other detail).
   - Your codes: ______________
8. Code: acute sinusitis, not further specified.
   - Your codes: ______________

**Done when:** all green and you look up three codes with the Index-then-Tabular method without skipping step 2.

---

[← Lesson 8](mc08-how-an-icd-10-cm-code-is-built.md) · [All notes](README.md) · [Lesson 10 →](mc10-general-coding-guidelines.md)

<sub>Generated from `syllabus/MEDCODE_MASTER.md` by `tools/build_notes.py`.</sub>
