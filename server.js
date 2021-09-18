require('dotenv').config({ path: './config/config.env' })
require('colors')

console.log(`Video Shrinker`.green.inverse)

console.log(process.env.VIDEO_PATH)
console.log(process.env.OUTPUT_PATH)
