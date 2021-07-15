import express from 'express'
import fs from 'fs'
import request from 'request'
import cheerio from 'cheerio'
import { exec } from 'child_process'

const word: string = 'Hello all,How are you'
const fileName: string = 'temp/ref.wav'
const url:string = 'https://www.goldpricesindia.com/' 

test()

function test() {
    console.log(1)
    let myPromise1 = new Promise((resolve, reject) => {
        console.log(2)
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
            console.log(3)
            resolve('Processing myPromise1')
          }
        })
    })

  myPromise1.then(() => {
    console.log(4)
      let data:any
    let myPromise2 = new Promise((resolve, reject) => {

      console.log(5)
          request(url, function (err, resp, html) {
            if (!err && resp.statusCode === 200) {
                const $ = cheerio.load(html)
                const dataPath = $('.no-js')
              data = dataPath.html()
              console.log(6)
              resolve('Processing myPromise2')

            }
          })
    })
    
    myPromise2.then(() => {
      console.log(7)
      fs.writeFileSync('ref.txt', data, 'utf8')
    }).then(() => {
      const content: string = fs.readFileSync('ref.txt', 'utf8')
      console.log(8)
      console.log(content)
    })
    })
}

/*
                fs.writeFileSync('ref.txt',data, 'utf8')
                const content: string = fs.readFileSync('ref.txt', 'utf8')
                console.log(content) */