import { createC2pa } from '@contentauth/c2pa-web'
import wasmSrc from '@contentauth/c2pa-web/resources/c2pa.wasm?url'
import ExifReader from 'exifreader'

document.querySelector('#app').innerHTML = `
  <main>
    <h1>Provenance Destruction Test</h1>

    <p>
      Compare provenance evidence before and after ordinary media
      transformations.
    </p>

    <p>
      <strong>Evidence boundary:</strong>
      NOT VERIFIABLE means that the available provenance evidence
      could not be verified. It does not mean the image is fake.
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
      'C2PA engine could not initialize. Check the console.'
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

async function inspectMetadata(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const tags = ExifReader.load(arrayBuffer)

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
    console.error(`Metadata read error for ${file.name}:`, error)

    return {
      DateTimeOriginal: null,
      Make: null,
      Model: null,
      CreatorTool: null,
    }
  }
}

function getC2paStatus(result, baseline) {
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

function compareMetadata(result, baseline) {
  const fields = [
    'DateTimeOriginal',
    'Make',
    'Model',
    'CreatorTool',
  ]

  return fields.map((field) => {
    const originalValue = baseline.metadata[field]
    const currentValue = result.metadata[field]

    let state = 'UNCHANGED'

    if (originalValue === null && currentValue === null) {
      state = 'UNAVAILABLE'
    } else if (originalValue !== currentValue) {
      state = 'CHANGED'
    }

    return {
      field,
      original_value: originalValue,
      current_value: currentValue,
      state,
    }
  })
}

function getExplanation(result, baseline, metadataComparison) {
  if (result.label === 'Original') {
    return 'The Original establishes the baseline of observable provenance evidence.'
  }

  const c2paChanged =
    result.c2pa_manifest_present !==
      baseline.c2pa_manifest_present ||
    result.c2pa_validation_result !==
      baseline.c2pa_validation_result ||
    result.c2pa_active_manifest_id !==
      baseline.c2pa_active_manifest_id

  const metadataChanged = metadataComparison.some(
    (item) => item.state === 'CHANGED'
  )

  if (!c2paChanged && !metadataChanged) {
    return 'No observed change was detected in the selected provenance signals.'
  }

  if (!result.c2pa_manifest_present) {
    return 'C2PA evidence present in the Original is not verifiable in this file. This is an evidence limitation, not a claim that the image is fake.'
  }

  if (c2paChanged && metadataChanged) {
    return 'Both C2PA and at least one observed metadata field differ from the Original baseline.'
  }

  if (c2paChanged) {
    return 'C2PA evidence differs from the Original baseline.'
  }

  return 'At least one observed metadata field differs from the Original baseline.'
}

function renderResults(results, baseline) {
  resultsElement.innerHTML = `
    <h2>Evidence Matrix</h2>

    <p>
      The system reports observed evidence only. It does not determine
      whether an image is authentic, fake, manipulated, or AI-generated.
    </p>

    ${results
      .map((result) => {
        const status = getC2paStatus(result, baseline)
        const metadataComparison =
          compareMetadata(result, baseline)

        const explanation = getExplanation(
          result,
          baseline,
          metadataComparison
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

            <h4>C2PA Evidence</h4>

            <p>
              <strong>Manifest present:</strong>
              ${String(result.c2pa_manifest_present)}
            </p>

            <p>
              <strong>Validation result:</strong>
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

            <h4>Metadata Evidence</h4>

            ${metadataComparison
              .map(
                (item) => `
                  <p>
                    <strong>${item.field}:</strong>
                    ${
                      item.current_value ??
                      'Not available'
                    }
                    — ${item.state}
                  </p>
                `
              )
              .join('')}

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

      metadata: {
        ...original.metadata,
      },
    }

    console.log('ORIGINAL BASELINE:', baseline)
    console.log('FOUR-FILE EVIDENCE MATRIX:', results)

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

analyzeButton.addEventListener(
  'click',
  analyzeFiles
)

initializeC2pa()
