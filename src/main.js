import { createC2pa } from '@contentauth/c2pa-web'
import wasmSrc from '@contentauth/c2pa-web/resources/c2pa.wasm?url'
import ExifReader from 'exifreader'

document.querySelector('#app').innerHTML = `
  <main>
    <header class="hero">
      <h1>Provenance Destruction Test</h1>
      <p>
        Test what provenance evidence survives ordinary media transformations.
      </p>
    </header>

    <section class="warning">
      <strong>Evidence boundary</strong>
      <p>
        NOT VERIFIABLE means that the available provenance evidence
        could not be verified in this file. It does not mean the image is fake.
      </p>
    </section>

    <section class="upload-panel">
      <h2>Upload the four controlled files</h2>

      <label>
        Original
        <input id="original-file" type="file" accept="image/jpeg,image/png" />
      </label>

      <label>
        Crop
        <input id="crop-file" type="file" accept="image/jpeg,image/png" />
      </label>

      <label>
        Screenshot
        <input id="screenshot-file" type="file" accept="image/jpeg,image/png" />
      </label>

      <label>
        JPEG Recompression
        <input id="jpeg-file" type="file" accept="image/jpeg,image/png" />
      </label>

      <button id="analyze-button" type="button">
        Analyze provenance
      </button>

      <p id="status">C2PA engine initializing...</p>
    </section>

    <section id="results"></section>
  </main>
`

const statusElement = document.querySelector('#status')
const resultsElement = document.querySelector('#results')
const analyzeButton = document.querySelector('#analyze-button')

const fileInputs = [
  {
    label: 'Original',
    input: document.querySelector('#original-file'),
  },
  {
    label: 'Crop',
    input: document.querySelector('#crop-file'),
  },
  {
    label: 'Screenshot',
    input: document.querySelector('#screenshot-file'),
  },
  {
    label: 'JPEG Recompression',
    input: document.querySelector('#jpeg-file'),
  },
]

let c2pa = null

async function initializeC2pa() {
  try {
    c2pa = await createC2pa({ wasmSrc })
    statusElement.textContent =
      'C2PA engine ready. Upload all four files.'
  } catch (error) {
    console.error(error)
    statusElement.textContent =
      'C2PA engine could not initialize.'
  }
}

async function inspectC2pa(file) {
  let reader = null

  try {
    reader = await c2pa.reader.fromBlob(file.type, file)

    if (!reader) {
      return {
        c2pa_manifest_present: false,
        c2pa_validation_result: null,
        c2pa_active_manifest_id: null,
      }
    }

    const manifestStore = await reader.manifestStore()

    return {
      c2pa_manifest_present:
        Boolean(manifestStore?.active_manifest),

      c2pa_validation_result:
        manifestStore?.validation_state ?? null,

      c2pa_active_manifest_id:
        manifestStore?.active_manifest ?? null,
    }
  } catch (error) {
    console.error(`C2PA error: ${file.name}`, error)

    return {
      c2pa_manifest_present: false,
      c2pa_validation_result: null,
      c2pa_active_manifest_id: null,
    }
  } finally {
    if (reader) {
      await reader.free()
    }
  }
}

async function inspectMetadata(file) {
  try {
    const buffer = await file.arrayBuffer()
    const tags = ExifReader.load(buffer)

    return {
      DateTimeOriginal:
        tags.DateTimeOriginal?.description ?? null,

      Make:
        tags.Make?.description ?? null,

      Model:
        tags.Model?.description ?? null,

      CreatorTool:
        tags.CreatorTool?.description ??
        tags['Creator Tool']?.description ??
        null,
    }
  } catch (error) {
    console.error(`Metadata error: ${file.name}`, error)

    return {
      DateTimeOriginal: null,
      Make: null,
      Model: null,
      CreatorTool: null,
    }
  }
}

function getStatus(result, baseline) {
  if (!result.c2pa_manifest_present) {
    return 'NOT VERIFIABLE'
  }

  if (
    result.c2pa_validation_result ===
      baseline.c2pa_validation_result &&
    result.c2pa_active_manifest_id ===
      baseline.c2pa_active_manifest_id
  ) {
    return 'VERIFIABLE'
  }

  return 'CHANGED'
}

function getReason(result, baseline) {
  if (result.label === 'Original') {
    return 'This file provides the C2PA provenance baseline used for comparison.'
  }

  if (!result.c2pa_manifest_present) {
    return 'The C2PA provenance evidence present in the Original could not be verified in this file.'
  }

  if (
    result.c2pa_validation_result ===
      baseline.c2pa_validation_result &&
    result.c2pa_active_manifest_id ===
      baseline.c2pa_active_manifest_id
  ) {
    return 'The same C2PA provenance evidence remains verifiable.'
  }

  return 'C2PA evidence is present, but it differs from the Original baseline.'
}

function renderResults(results, baseline) {
  resultsElement.innerHTML = `
    <section class="results-panel">
      <h2>Evidence Results</h2>

      <div class="boundary-note">
        <strong>Important:</strong>
        These results describe observable provenance evidence only.
        They do not determine whether an image is authentic, fake,
        manipulated, or AI-generated.
      </div>

      <div class="results-grid">
        ${results
          .map((result) => {
            const status = getStatus(result, baseline)
            const reason = getReason(result, baseline)

            return `
              <article class="result-card">
                <h3>${result.label}</h3>

                <div class="status">
                  ${status}
                </div>

                <p>
                  <strong>File:</strong>
                  ${result.file_name}
                </p>

                <h4>C2PA evidence</h4>

                <p>
                  Manifest:
                  ${
                    result.c2pa_manifest_present
                      ? 'Present'
                      : 'Not available'
                  }
                </p>

                <p>
                  Validation:
                  ${
                    result.c2pa_validation_result ??
                    'No C2PA evidence'
                  }
                </p>

                <p class="small-text">
                  Manifest ID:
                  ${
                    result.c2pa_active_manifest_id ??
                    'No C2PA evidence'
                  }
                </p>

                <h4>Metadata evidence</h4>

                <p>
                  DateTimeOriginal:
                  ${
                    result.metadata.DateTimeOriginal ??
                    'Not available'
                  }
                </p>

                <p>
                  Make:
                  ${result.metadata.Make ?? 'Not available'}
                </p>

                <p>
                  Model:
                  ${result.metadata.Model ?? 'Not available'}
                </p>

                <p>
                  CreatorTool:
                  ${
                    result.metadata.CreatorTool ??
                    'Not available'
                  }
                </p>

                <h4>Why?</h4>

                <p>${reason}</p>

                ${
                  status === 'NOT VERIFIABLE'
                    ? `
                      <p class="limit">
                        NOT VERIFIABLE ≠ FAKE
                      </p>
                    `
                    : ''
                }
              </article>
            `
          })
          .join('')}
      </div>
    </section>
  `
}

async function analyzeFiles() {
  if (!c2pa) {
    statusElement.textContent =
      'C2PA engine is not ready yet.'
    return
  }

  const missing = fileInputs
    .filter(({ input }) => !input.files?.[0])
    .map(({ label }) => label)

  if (missing.length > 0) {
    statusElement.textContent =
      `Missing required files: ${missing.join(', ')}.`
    return
  }

  analyzeButton.disabled = true
  resultsElement.innerHTML = ''

  statusElement.textContent =
    'Inspecting provenance evidence...'

  try {
    const results = []

    for (const { label, input } of fileInputs) {
      const file = input.files[0]

      const c2paResult = await inspectC2pa(file)
      const metadata = await inspectMetadata(file)

      results.push({
        label,
        file_name: file.name,
        metadata,
        ...c2paResult,
      })
    }

    const original = results.find(
      (result) => result.label === 'Original'
    )

    const baseline = {
      c2pa_manifest_present:
        original.c2pa_manifest_present,

      c2pa_validation_result:
        original.c2pa_validation_result,

      c2pa_active_manifest_id:
        original.c2pa_active_manifest_id,
    }

    console.log('ORIGINAL BASELINE:', baseline)
    console.log('FOUR-FILE RESULTS:', results)

    renderResults(results, baseline)

    statusElement.textContent =
      'Inspection complete. No authenticity judgment was made.'
  } catch (error) {
    console.error(error)

    statusElement.textContent =
      'Inspection failed. Check the console.'
  } finally {
    analyzeButton.disabled = false
  }
}

analyzeButton.addEventListener(
  'click',
  analyzeFiles
)

initializeC2pa()