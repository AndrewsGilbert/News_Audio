import express from 'express'
import fs from 'fs'
import request from 'request'
import cheerio from 'cheerio'
import { exec } from 'child_process'

const word: string = 'Hello all,How are you'
const fileName: string = 'temp/ref.wav'
const url: string = 'https://www.goldpricesindia.com/'

test()
function test() {
     exec(`./tts --text "${word}" --out_path ${fileName}`, (error, stdout, stderr) => {

        if (error) {
            console.log(`error: ${error.message}`)
            return
          }
          if (stderr) {
            console.log(`stderr: ${stderr}`)
            return
          }
          if (stdout) {
              console.log(`stdout: ${stdout}`)
              request(url, function (err, resp, html) {
                if (!err && resp.statusCode === 200) {
                    const $ = cheerio.load(html)
                    const dataPath = $('.no-js')
                    const data: any = dataPath.html()
                    fs.writeFileSync('ref.txt',data, 'utf8')
                    const content: string = fs.readFileSync('ref.txt', 'utf8')
                    console.log(content)
                }
              })
          }
        })
}

