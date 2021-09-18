require('dotenv').config({ path: './config/config.env' })
require('colors')
const hashOfFile = require('object-hash')
const path = require('path')
const db = require('./data/videos.json')
const { getVideos, writeDB, convert } = require('./utils/shrinkerUtils')

const main = async () => {
  console.log(`Video Shrinker`.green.inverse)
  const videos = getVideos()
  console.log(
    `Loaded ${videos.length} videos from ${path.join(process.env.VIDEO_PATH)}`
      .yellow
  )
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i]
    const inputPath = path.join(process.env.VIDEO_PATH) + video
    const outputPath = path.join(process.env.OUTPUT_PATH) + video
    const hash = hashOfFile(video)
    let alreadyProcessed = false
    for (let j = 0; j < db.processed.length; j++) {
      if (db.processed[j].hash === hash) {
        console.log(
          `${inputPath} already processed on ${new Date(
            db.processed[i].dateProcessed
          ).toLocaleDateString('en-US')}, skipping`
        )
        alreadyProcessed = true
        break
      }
    }
    if (alreadyProcessed) continue
    console.log(`processing ${video}...`)
    try {
      await convert(inputPath, outputPath)
      db.processed.push({
        inputPath,
        outputPath,
        hash,
        dateProcessed: Date.now(),
      })
      console.log('writing db...')
      writeDB(db)
      console.log('written.')
    } catch (err) {
      console.log(`unable to convert ${video}`.red.inverse)
    }
  }
}

main()
