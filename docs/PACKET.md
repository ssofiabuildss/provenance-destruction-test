# WEEK 3 — BUSINESS BENDING
## Provenance Destruction Test

**Sofía Lopez**  
**Global Business**

---

## 1. Problem in My Own Words

Digital media can lose or alter its provenance information after ordinary transformations such as screenshots, cropping, or recompression. This makes it difficult to know what provenance evidence still survives after the media has been transformed.

The problem is not to determine whether the media is real or fake, but to test which provenance signals remain verifiable after each transformation and clearly report when the evidence becomes insufficient.

**Evidence Boundary:** The test must never translate “provenance missing” into “fake.” Its strongest valid conclusion is that a specific provenance signal survived, changed, or can no longer be verified after a transformation.

This keeps the build narrow and prevents it from becoming a generic deepfake detector or claiming authenticity beyond what the evidence proves.

---

## 2. Exact User

**Exact user:** A journalist or newsroom fact-checker reviewing a piece of digital media that may have been transformed before reaching them.

**Specific moment of use:** Before deciding whether the media’s available provenance can be cited or relied on during verification, the journalist runs the controlled files through the Provenance Destruction Test to see which provenance signals remain verifiable after ordinary transformations.

**Decision the result helps them make:** Whether the surviving provenance evidence is strong enough to support a specific provenance claim, or whether they must label the provenance as uncertain and seek additional evidence.

**What the tool must not imply:** The tool must never tell the journalist that media is real, fake, manipulated, AI-generated, or trustworthy simply because provenance is present, altered, or missing. Missing provenance means uncertainty about provenance—not evidence of falsity.

---

## 3. Success Definition

**Before the module closes:** The Provenance Destruction Test must take one controlled image file with known, inspectable provenance evidence and compare it with three reproducibly created external transformations: Crop, Screenshot, and JPEG Recompression.

The prototype must show whether the specific provenance evidence being tested remains verifiable after each transformation. The journalist receives a transformation-by-transformation comparison using only **VERIFIABLE, CHANGED, or NOT VERIFIABLE** per eligible evidence signal, together with the evidence observed for each result.

If provenance can no longer be verified, the tool must explicitly report uncertainty and must not infer that the image is fake, manipulated, AI-generated, or untrustworthy.

### Acceptance Criteria

- One controlled Original with known and recorded baseline provenance evidence.
- Exactly four uploaded files: Original, Crop, Screenshot, and JPEG Recompression.
- The three transformations are created outside the prototype using a documented procedure.
- The same predefined, baseline-eligible provenance signals are inspected across all four files.
- C2PA evidence remains separate from ordinary EXIF/XMP metadata.
- Each eligible signal receives only **VERIFIABLE, CHANGED, or NOT VERIFIABLE**.
- A field absent from the Original is marked **“not part of baseline”** and excluded from comparison.
- The interface shows the baseline, observed transformed evidence, and the resulting per-signal status.
- NOT VERIFIABLE means uncertainty about the tested provenance evidence; it does not mean the image is fake.
- Success depends on accurate measurement, not on getting a predetermined transformation result.

---

## 4. Image-Generated Mockup

[INSERT THE APPROVED MOCKUP IMAGE HERE]

**Figure 1. Provenance Destruction Test — Approved Interface Mockup**

This mockup shows the proposed journalist-facing interface. The controlled Original remains visible as the baseline and is compared with three externally created transformations: Crop, Screenshot, and JPEG Recompression. The interface displays the provenance evidence observed for each version, the per-signal result (**VERIFIABLE, CHANGED, or NOT VERIFIABLE**), and the evidence supporting that result.

**Important:** The statuses shown in the mockup are illustrative UI content only. They are not experimental results. The actual provenance-survival outcomes remain unknown until the controlled experiment is executed.

---

## 5. Flow Diagram

[INSERT THE APPROVED MERMAID DIAGRAM IMAGE HERE]

**Figure 2. Provenance Destruction Test Workflow**

The controlled transformations are created outside the prototype. The journalist uploads the four labeled files, while the prototype inspects provenance evidence, establishes the Original as the baseline, compares each transformed file, and reports only what the observed evidence supports.

**The experiment creates the transformations; the prototype measures their consequences.**

---

## 6. Benchmark Line

**Strongest benchmark: Adobe Content Authenticity — Inspect**

Adobe Content Authenticity — Inspect is the closest benchmark because it already allows users to inspect Content Credentials and associated provenance information. It demonstrates that provenance inspection and Content Credentials verification are real capabilities rather than functionality invented for this prototype.

Our working slice does not attempt to replace Adobe Inspect or claim to perform provenance verification better. Instead, it asks a narrower experimental question: **What happened to the same predefined provenance evidence after this specific ordinary transformation?**

The working slice creates a controlled comparison:

**Known baseline → Crop / Screenshot / JPEG Recompression → Inspect the same predefined evidence → Compare against baseline → VERIFIABLE / CHANGED / NOT VERIFIABLE**

For the Mexican journalist/fact-checker context, the localization is primarily in the workflow and evidence boundary. The tool provides a small, reproducible test while explicitly preventing missing provenance from becoming a false-media judgment.

**Benchmark line:** “The best existing solution on Earth is Adobe Content Authenticity — Inspect. Mine differs/localizes by turning provenance inspection into a controlled, reproducible transformation test for a Mexican journalist/fact-checker, explicitly comparing what evidence survives crop, screenshot, and JPEG recompression while enforcing that missing provenance means uncertainty, not falsity.”

### Sources

Adobe Help Center. *Inspect Content Credentials.*

Adobe Help Center. *Possible matches in Adobe Content Authenticity Inspect.*

---

## 7. Long View

This prototype tests whether predefined provenance evidence remains verifiable after three controlled, ordinary media transformations and reports only what the observed evidence supports. If the experiment proves useful, a future version could expand to additional media formats and transformation types, document reproducible provenance-loss patterns, and help journalists and fact-checkers understand when additional verification evidence is needed. Even long-term, it should not become a deepfake detector, truth or authenticity score, or automated publication decision system, because absent provenance must remain evidence of uncertainty rather than evidence that media is false.

---

## 8. Scope Cut

### IN SCOPE

- Upload exactly four controlled image files: **Original, Crop, Screenshot, and JPEG Recompression**.
- Inspect the same predefined provenance evidence in each file.
- Keep **C2PA evidence and ordinary EXIF/XMP metadata separate**.
- Use the Original to establish the eligible provenance baseline.
- Exclude fields absent from the Original as **“not part of baseline.”**
- Compare each transformed file against the Original.
- Assign only **VERIFIABLE, CHANGED, or NOT VERIFIABLE** per eligible evidence signal.
- Display the observed evidence supporting each status.
- Produce descriptive file-level summaries without creating an authenticity verdict.
- Enforce the evidence boundary: **NOT VERIFIABLE means the tested provenance could not be verified; it does not mean the media is fake.**

### OUT OF SCOPE

- Creating or editing the Crop, Screenshot, or JPEG Recompression inside the prototype.
- Transformations beyond the approved three.
- Generic deepfake, synthetic-media, or AI-content detection.
- Real/fake labels or authenticity, confidence, manipulation, or trust scores.
- Determining whether the depicted event or information is true.
- Automated publication, rejection, moderation, or editorial decisions.
- User accounts, authentication, databases, or permanent media storage.
- Newsroom collaboration or case-management features.
- Issuing Content Credentials or production-scale C2PA signing.
- Claims about authenticity, manipulation, AI generation, trustworthiness, or falsity that the inspected evidence does not establish.

**Most important scope decision:** The prototype does not create the transformations. The Crop, Screenshot, and JPEG Recompression are controlled experimental inputs created outside the product. The prototype functions only as the measurement instrument: **inspect → compare → classify the provenance evidence → show why.**

---

## 9. Architecture + Stack

**Architecture:** Browser-local deterministic provenance inspection with a narrow server-side Gemini endpoint.

**Frontend / UI:** HTML, CSS, JavaScript, and Vite. Handles the four-file workflow and displays the journalist-facing results.

**Input Validation:** Client-side JavaScript validates the four required labels, file type, and file size before processing.

**Provenance Inspection:** ExifReader reads the approved EXIF/XMP metadata, while `@contentauth/c2pa-web` + WebAssembly inspect available C2PA provenance evidence.

**Baseline + Comparison:** Client-side deterministic JavaScript establishes the Original as the baseline, excludes fields that were not part of that baseline, and compares each transformed file against it.

**Status Engine:** Deterministic rules assign only **VERIFIABLE, CHANGED, or NOT VERIFIABLE**. No authenticity or trust score is produced.

**Gemini:** A narrow serverless Node endpoint uses the Gemini multimodal API only to explain findings already measured by the system. Gemini cannot assign, change, or override a status.

**Security & Storage:** The Gemini API key remains in a server-side environment variable. There is no database or permanent media storage.

**Hosting:** Vercel hosts the frontend, WASM assets, and serverless endpoint.

### Data Flow

**4 controlled files → Validate → Inspect EXIF/XMP + C2PA → Establish Original baseline → Compare → VERIFIABLE / CHANGED / NOT VERIFIABLE → Show evidence → Optional Gemini explanation**

**Technical Dependency:** Browser C2PA inspection must first be verified with `c2pa-web` and WebAssembly using the controlled baseline. If a genuine browser/WASM compatibility problem is demonstrated, only C2PA inspection may move to the approved Node-side fallback.

---

## 10. Test Plan

**1. Happy Path:** Upload the four valid controlled files. The system must establish the Original baseline and assign only approved per-signal statuses.

**2. Input Validation:** Missing, extra, mislabeled, unsupported, or oversized files must stop processing before results are generated.

**3. Controlled Experiment:** The system must report the evidence actually observed. No transformation-survival result may be hard-coded.

**4. Mixed Evidence:** Different signals may receive different statuses without producing an overall authenticity verdict.

**5. Baseline Field Absent:** A signal absent from the Original must be marked **“not part of baseline”** and excluded from comparison.

**6. C2PA / Metadata Separation:** C2PA and ordinary EXIF/XMP evidence must remain separate.

**7. Evidence Boundary:** **NOT VERIFIABLE** must communicate uncertainty only, never “fake.”

**8. CHANGED Semantics:** A difference from the Original must not automatically imply manipulation or falsity.

**9. Summary Accuracy:** Any descriptive status counts must exactly match the underlying per-signal results.

**10. Gemini Boundary:** Gemini may explain measured findings but cannot add, change, or override statuses.

**11. Adversarial Gemini Test:** Even when provenance is missing, Gemini must not infer that the media is fake, false, or AI-generated.

**12. C2PA Compatibility:** Test `c2pa-web` + WASM with a controlled C2PA Original. Use the approved fallback only if a genuine compatibility problem is demonstrated.

**13. Ephemeral Processing:** After reload or closing the session, uploaded files and results must not persist.

### Experimental Outcomes

The software behavior is predetermined, but the provenance-survival results are not. Crop, Screenshot, and JPEG Recompression may produce different evidence outcomes, and the prototype must report whatever is actually observed.

### Evidence Boundary

**VERIFIABLE** means the eligible evidence remains verifiable; **CHANGED** means it differs from the Original baseline; **NOT VERIFIABLE** means the tested evidence could not be verified. None of these statuses determines whether the media is real, fake, manipulated, or AI-generated.