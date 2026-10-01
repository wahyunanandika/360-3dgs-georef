const fs = require('fs')
const goProTelemetry = require('gopro-telemetry')
const gpmfExtract = require('gpmf-extract')


const file = fs.readFileSync('metadata.mp4')

gpmfExtract(file).then(extracted=> {
  goProTelemetry(extracted, {preset:'json'}, telemetry=> {
    fs.writeFileSync(
      'metadata.json', JSON.stringify(telemetry,null,2)
    )
    console.log('done')
  })
})