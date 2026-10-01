const { spawn } = require('child_process')
const fs = require('fs')
const goProTelemetry = require('gopro-telemetry')
const gpmfExtract = require('gpmf-extract')

function runFFmpeg() {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-i', 'D:/metadata/360/single_file/360/1.360_raw/GS014251.360',
      '-map', '0:v:0',
      '-map', '0:3',
      '-c:v', 'copy',
      '-c:d', 'copy',
      'D:/metadata/360/single_file/360/1.360_raw/GS014251.mp4'
    ])

    // FFmpeg log (pakai stderr)
    ffmpeg.stderr.on('data', data => {
      process.stderr.write(data)
    })

    ffmpeg.on('error', err => {
      reject(err)
    })

    ffmpeg.on('close', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`))
      }
    })
  })
}

async function runTelemetry() {
  const file = fs.readFileSync('D:/metadata/360/single_file/360/1.360_raw/GS014251.mp4')

  const extracted = await gpmfExtract(file)

  const telemetry = await new Promise(resolve => {
    goProTelemetry(extracted, { preset: 'json' }, data => {
      resolve(data)
    })
  })

  fs.writeFileSync(
    'GS014251.json',
    JSON.stringify(telemetry, null, 2)
  )

  console.log('Telemetry done')
}

async function main() {
  try {
    console.log('Running FFmpeg...')
    await runFFmpeg()
    console.log('FFmpeg done')

    console.log('Extracting telemetry...')
    await runTelemetry()

  } catch (err) {
    console.error('Pipeline failed:', err.message)
  }
}

main()
