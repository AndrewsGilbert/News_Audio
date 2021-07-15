import express from 'express'
import fs from 'fs'
import request from 'request'
import cheerio from 'cheerio'
import { exec } from 'child_process'

const word: string = 'Hello all,How are you'
const fileName: string = 'temp/ref.wav'
const url:string = 'https://www.goldpricesindia.com/' 

let audio = function(){ 
let myPromise1 = new Promise((resolve, reject) => {
        console.log(1)
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
            console.log(2)
            resolve('Processing myPromise1')
          }
        })
    })
    return myPromise1
  }

 let scrap = function(){   

    let myPromise2 = new Promise((resolve, reject) => {

      console.log(3)
          request(url, function (err, resp, html) {
            if (!err && resp.statusCode === 200) {
                const $ = cheerio.load(html)
                const dataPath = $('.no-js')
                const data:any = dataPath.html()
                console.log(4)
                resolve(data)

            }
          })
    })
    return myPromise2
  }

let write = function(data:any){ 

  
    let myPromise3 = new Promise<string>((resolve, reject) => {

      console.log(5)
      const fileName:string = 'ref.txt'
      fs.writeFile(fileName, data, function (err) {
        if (err) throw err
        console.log(6)
        resolve(fileName)
      })

    })
    return myPromise3
  }

let read = function(fileName:string){     
    let myPromise4 = new Promise((resolve, reject) => {

      console.log(7)
      fs.readFile(fileName, 'utf8', function(err, data) {
        if(!err) {
        console.log(data)}
        resolve('Processing myPromise4')
      }) 

    })
    return myPromise4
  }

audio().then(scrap).then(write).then(read)


