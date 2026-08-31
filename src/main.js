import { createC2pa } from '@contentauth/c2pa-web'
import wasmSrc from '@contentauth/c2pa-web/resources/c2pa.wasm?url'

document.querySelector('#app').innerHTML = `
  <main>
    <h1>Provenance Destruction Test</h1>

    <p>
      Compare what provenance evidence remains verifiable after ordinary
      media transformations.
    </p>

    <p>
      <strong>Evidence boundary:</strong>
      NOT VERIFIABLE means the provenance evidence could not be verified.
      It does not mean the image is fake.
    </p>

    <div>
      <label>
        <strong>Original</strong>
        <input id="original-file" type="file" accept="image/jpeg,image/png" />
      </label>

      <label>
        <strong>Crop</strong>
        <input id="crop-file" type="file" accept="image/jpeg,image/png" />
      </label>

      <label>
        <strong>Screenshot</strong>
        <input id="screenshot-file" type="file" accept="image/jpeg,image/png" />
      </label>

      <label>
        <strong>JPEG Recompression</strong>
        <input id="jpeg-file" type="file" accept="image/jpeg,image/png" />
      </label>
    </div>

    <button id="analyze-button" type="button">
      Analyze provenance
    </button>

    <p id="status">C2PA engine initializing...</p>

    <div id="results"></div>
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

let c2pa

async function initializeC2pa() {
  try {
    c2pa = await createC2pa({ wasmSrc })

    statusElement.textContent =
      'C2PA engine ready. Upload all four files.'

    console.log('C2PA SDK initialized successfully.')
  } catch (error) {
    console.error('C2PA initialization failed:', error)

    statusElement.textContent =
      'C2PA engine could not initialize.'
  }
}

async function inspectC2pa(file) {
  let reader

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
      c2pa_manifest_present: Boolean(
        manifestStore?.active_manifest
      ),
      c2pa_validation_result:
        manifestStore?.validation_state ?? null,
      c2pa_active_manifest_id:
        manifestStore?.active_manifest ?? null,
    }
  } catch (error) {
    console.error(`C2PA read error for ${file.name}:`, error)

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

function getC2paStatus(result, baseline) {
  if (!result.c2pa_manifest_present) {
    return 'NOT VERIFIABLE'
  }

  if (
    result.c2pa_validation_result === baseline.c2pa_validation_result &&
    result.c2pa_active_manifest_id === baseline.c2pa_active_manifest_id
  ) {
    return 'VERIFIABLE'
  }

  return 'CHANGED'
}

function getExplanation(result, baseline, label) {
  if (label === 'Original') {
    if (result.c2pa_manifest_present) {
      return 'C2PA provenance evidence is readable in the Original and establishes the comparison baseline.'
    }

    return 'No C2PA provenance evidence is readable in the Original. C2PA is therefore not part of the usable baseline.'
  }

  if (!result.c2pa_manifest_present) {
    return 'The C2PA evidence readable in the Original is not verifiable in this transformed file. This does not mean the image is fake.'
  }

  if (
    result.c2pa_validation_result === baseline.c2pa_validation_result &&
    result.c2pa_active_manifest_id === baseline.c2pa_active_manifest_id
  ) {
    return 'The same C2PA provenance evidence observed in the Original remains verifiable after this transformation.'
  }

  return 'C2PA evidence is present, but at least one locked provenance field differs from the Original baseline.'
}

function renderResults(results, baseline) {
  resultsElement.innerHTML = `
    <h2>Provenance Comparison</h2>

    <p>
      Each result is based only on observed provenance evidence.
      Missing provenance is uncertainty, not evidence of falsity.
    </p>

    ${results
      .map((result) => {
        const status = getC2paStatus(result, baseline)
        const explanation = getExplanation(
          result,
          baseline,
          result.label
        )

        return `
          <section>
            <h3>${result.label}</h3>

            <p>
              <strong>Status:</strong>
              ${status}
            </p>

            <p>
              <strong>File:</strong>
              ${result.file_name}
            </p>

            <p>
              <strong>C2PA manifest present:</strong>
              ${String(result.c2pa_manifest_present)}
            </p>

            <p>
              <strong>C2PA validation result:</strong>
              ${
                result.c2pa_validation_result ??
                'No C2PA evidence'
              }
            </p>

            <p>
              <strong>Active manifest ID:</strong>
              ${
                result.c2pa_active_manifest_id ??
                'No C2PA evidence'
              }
            </p>

            <p>
              <strong>Interpretation:</strong>
              ${explanation}
            </p>
          </section>
        `
      })
      .join('')}
  `
}

async function analyzeFiles() {
  if (!c2pa) {
    statusElement.textContent =
      'C2PA engine is not ready yet.'
    return
  }

  const missingFiles = fileInputs
    .filter(({ input }) => !input.files?.[0])
    .map(({ label }) => label)

  if (missingFiles.length > 0) {
    statusElement.textContent =
      `Missing required files: ${missingFiles.join(', ')}.`
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

      results.push({
        label,
        file_name: file.name,
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

    console.log('ORIGINAL C2PA BASELINE:', baseline)
    console.log('FOUR-FILE C2PA RESULTS:', results)

    renderResults(results, baseline)

    statusElement.textContent =
      'Inspection complete. No authenticity judgment was made.'
  } catch (error) {
    console.error('Four-file inspection failed:', error)

    statusElement.textContent =
      'Inspection failed. Check the console.'
  } finally {
    analyzeButton.disabled = false
  }
}

analyzeButton.addEventListener('click', analyzeFiles)

initializeC2pa()