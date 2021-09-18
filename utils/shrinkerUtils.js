const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')

exports.getVideos = () => {
  const videoPath = path.join(process.env.VIDEO_PATH)
  const videos = []
  fs.readdirSync(videoPath).forEach((file) => {
    if (fs.statSync(videoPath + file).isFile()) videos.push(file)
  })
  return videos
}

exports.writeDB = (toSet) => {
  let data = JSON.stringify(toSet)
  fs.writeFileSync(path.join(process.env.DATA_PATH), data)
}

exports.convert = async (input, output) => {
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
  try {
    await ffConvert()
  } catch (err) {
    console.log(error)
  }
}
