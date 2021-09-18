require('dotenv').config({ path: './config/config.env' })
require('colors')
const fs = require('fs')
const hashOfFile = require('object-hash')
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')

const db = require('./data/videos.json')

console.log(`Video Shrinker`.green.inverse)

const getVideos = () => {
  const videoPath = path.join(process.env.VIDEO_PATH)
  const videos = []
  fs.readdirSync(videoPath).forEach((file) => {
    if (fs.statSync(videoPath + file).isFile()) videos.push(file)
  })
  return videos
}

const writeDB = (toSet) => {
  let data = JSON.stringify(toSet)
  fs.writeFileSync(path.join(process.env.DATA_PATH), data)
}

const convert = async (input, output) => {
  function ffConvert() {
    return new Promise((resolve, reject) => {
      try {
        ffmpeg()
          .input(input)
          .inputOptions(['-hwaccel cuda', '-hwaccel_output_format cuda'])
          .fps(30)
          .outputOptions(['-c:v hevc_nvenc', '-b:v 5M', '-preset fast'])
          .outputFormat('mp4')
          .on('progress', (progress) => {
            process.stdout.cursorTo(0)
            process.stdout.write(
              `converting: ${
                progress.timemark
              }   progress: ${progress.percent.toFixed(3)}%   size: ${(
                progress.targetSize / 1024
              ).toFixed(3)} MB`.yellow.inverse
            )
          })
          .save(output)
          .on('end', async () => {
            process.stdout.write('\n')
            console.log(`done converting ${output}`.blue.inverse)
            resolve()
          })
          .on('err', (err) => reject(err))
      } catch (error) {
        throw new Error(error)
      }
    })
  }
  await ffConvert()
}

const main = async () => {
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
