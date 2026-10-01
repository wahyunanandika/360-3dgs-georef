const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const goProTelemetry = require('gopro-telemetry')
const gpmfExtract = require('gpmf-extract')

const inputDir = "E:/04.Pak_ival/Dataset/merdeka_2/1.360_raw"
const outputDir = 'E:/04.Pak_ival/Dataset/merdeka_2/1.360_raw/metadata'

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

function runFFmpeg(inputPath, outputMp4Path) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-i', inputPath,
      '-map', '0:v:0',
      '-map', '0:3',
      '-c:v', 'copy',
      '-c:d', 'copy',
      outputMp4Path
    ])

    ffmpeg.stderr.on('data', data => {
      process.stderr.write(data)
    })

    ffmpeg.on('error', reject)

    ffmpeg.on('close', code => {
      code === 0
        ? resolve()
        : reject(new Error(`FFmpeg exited with code ${code}`))
    })
  })
}

async function runTelemetry(mp4Path, outputJsonPath) {
  const file = fs.readFileSync(mp4Path)
  const extracted = await gpmfExtract(file)

  const telemetry = await new Promise(resolve => {
    goProTelemetry(extracted, { preset: 'json' }, data => resolve(data))
  })

  fs.writeFileSync(outputJsonPath, JSON.stringify(telemetry, null, 2))
  console.log(`Telemetry saved → ${outputJsonPath}`)
}

async function processFile(fileName) {
  const inputPath = path.join(inputDir, fileName)
  const baseName = path.parse(fileName).name

  const tempMp4Path = path.join(outputDir, baseName + '.mp4')
  const outputJsonPath = path.join(outputDir, baseName + '.json')

  console.log(`\n=== Processing ${fileName} ===`)

  await runFFmpeg(inputPath, tempMp4Path)
  console.log('FFmpeg done')

  await runTelemetry(tempMp4Path, outputJsonPath)
  fs.unlinkSync(tempMp4Path)
  console.log('Temporary MP4 deleted')
}

async function main() {
  try {
    const files = fs.readdirSync(inputDir)
      .filter(f => f.toLowerCase().endsWith('.360'))

    if (files.length === 0) {
      console.log('No .360 files found')
      return
    }

    console.log(`Found ${files.length} files\n`)

    for (const file of files) {
      try {
        await processFile(file)
      } catch (err) {
        console.error(`Failed processing ${file}:`, err.message)
      }
    }

    console.log('\n All files processed')
  } catch (err) {
    console.error('Pipeline failed:', err.message)
  }
}

main()
