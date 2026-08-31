import { createC2pa } from '@contentauth/c2pa-web'
import wasmSrc from '@contentauth/c2pa-web/resources/c2pa.wasm?url'

document.querySelector('#app').innerHTML = `
  <main>
    <h1>C2PA Browser Proof of Concept</h1>
    <p id="status">Initializing C2PA SDK...</p>
  </main>
`

const statusElement = document.querySelector('#status')

const CONTROLLED_C2PA_SAMPLE =
  'https://raw.githubusercontent.com/c2pa-org/public-testfiles/main/legacy/1.4/image/jpeg/adobe-20220124-C.jpg'
async function runC2paProof() {
  let reader

  try {
    statusElement.textContent = 'Initializing C2PA SDK...'

    const c2pa = await createC2pa({ wasmSrc })
    console.log('C2PA SDK initialized successfully:', c2pa)

    statusElement.textContent = 'Fetching controlled C2PA sample...'

    const response = await fetch(CONTROLLED_C2PA_SAMPLE)

    if (!response.ok) {
      throw new Error(
        `Controlled sample request failed: ${response.status} ${response.statusText}`
      )
    }

    const blob = await response.blob()

    console.log('Controlled sample fetched successfully:', {
      type: blob.type,
      size: blob.size,
    })

    statusElement.textContent = 'Reading C2PA manifest...'

    reader = await c2pa.reader.fromBlob(blob.type, blob)

    const manifestStore = await reader.manifestStore()

    console.log('REAL C2PA MANIFEST STORE:', manifestStore)
    const c2paBaseline = {
  c2pa_manifest_present: Boolean(manifestStore?.active_manifest),
  c2pa_validation_result: manifestStore?.validation_state ?? null,
  c2pa_active_manifest_id: manifestStore?.active_manifest ?? null,
}

console.log('LOCKED C2PA BASELINE:', c2paBaseline)
const canvas = document.createElement('canvas')
canvas.width = 32
canvas.height = 32

const context = canvas.getContext('2d')
context.fillStyle = '#ffffff'
context.fillRect(0, 0, canvas.width, canvas.height)

const noManifestBlob = await new Promise((resolve, reject) => {
  canvas.toBlob(
    (blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Could not create the no-manifest JPEG control.'))
      }
    },
    'image/jpeg',
    0.9
  )
})

console.log('NO-MANIFEST JPEG CREATED:', {
  type: noManifestBlob.type,
  size: noManifestBlob.size,
})

let noManifestReader

try {
 noManifestReader = await c2pa.reader.fromBlob(
  noManifestBlob.type,
  noManifestBlob
)

if (!noManifestReader) {
  console.log('NO-MANIFEST CONTROL RESULT:', {
    reader_returned: false,
    c2pa_manifest_present: false,
    c2pa_validation_result: null,
    c2pa_active_manifest_id: null,
  })
} else {
  const noManifestStore = await noManifestReader.manifestStore()

  console.log('NO-MANIFEST CONTROL RESULT:', {
    reader_returned: true,
    manifest_store: noManifestStore,
  })
}
} catch (error) {
  console.error('NO-MANIFEST CONTROL ERROR:', error)
} finally {
  if (noManifestReader) {
    await noManifestReader.free()
  }
}

    statusElement.textContent =
      'Controlled C2PA sample read successfully. Check the console.'
  } catch (error) {
    console.error('C2PA proof failed:', error)

    statusElement.textContent =
      'C2PA proof failed. Check the browser console for the exact error.'
  } finally {
    if (reader) {
      await reader.free()
    }
  }
}

runC2paProof()