# Build Decisions

## Stage 0 — Browser C2PA Proof of Concept

### Decision

Keep C2PA inspection in the browser using the official `@contentauth/c2pa-web` package and WebAssembly.

The approved Node-side C2PA fallback is not triggered because the browser implementation successfully exposed the locked C2PA evidence from a controlled C2PA image.

### Environment

- Browser: Google Chrome
- Build tool: Vite
- Package: `@contentauth/c2pa-web@0.14.3`
- WASM import used:

```javascript
import wasmSrc from '@contentauth/c2pa-web/resources/c2pa.wasm?url'
```

### Controlled positive test

Controlled file:

`adobe-20220124-C.jpg`

Source:

`https://raw.githubusercontent.com/c2pa-org/public-testfiles/main/legacy/1.4/image/jpeg/adobe-20220124-C.jpg`

Observed browser results:

- C2PA SDK initialized successfully.
- Controlled sample fetched successfully.
- Blob type: `image/jpeg`
- Blob size: `140297` bytes.
- `reader.manifestStore()` returned a real manifest store.
- `c2pa_manifest_present: true`
- `c2pa_validation_result: "Valid"`
- `c2pa_active_manifest_id`: real `contentauth:urn:uuid:...` value returned by the SDK.

The active manifest identifier was not hard-coded.

### Controlled negative test

A plain JPEG was generated locally in the browser using an HTML canvas.

Observed results:

- Blob type: `image/jpeg`
- Blob size: `764` bytes.
- `c2pa.reader.fromBlob(...)` returned `null`.
- `reader_returned: false`
- `c2pa_manifest_present: false`
- `c2pa_validation_result: null`
- `c2pa_active_manifest_id: null`

The implementation now checks for a null reader before calling `manifestStore()`.

### Interpretation boundary

The negative control records only that no C2PA reader/manifest evidence was available.

It does not mean the image is fake, false, manipulated, AI-generated, deceptive, or untrustworthy.

No `VERIFIABLE`, `CHANGED`, or `NOT VERIFIABLE` product status was assigned during Stage 0.

### Fallback decision

Do not move C2PA inspection server-side.

Stage 0 demonstrated that the official browser `@contentauth/c2pa-web` + WASM path works in the target local Chrome/Vite environment. The approved Node fallback remains available only if a genuine browser/WASM compatibility problem is demonstrated later.