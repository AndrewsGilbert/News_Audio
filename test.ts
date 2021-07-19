import express from 'express'
import fs from 'fs'
import request from 'request'
import cheerio from 'cheerio'
import bodyParser from 'body-parser'
import path from 'path'
import cron from 'node-cron'
import { exec } from 'child_process'
//import load from 'audio-loader'
const load = require('audio-loader')

const app = express()

app.use(bodyParser.urlencoded({
  extended: true
}))

type web = {
    id:number
    name:string
    url:string
    selector:Array<string>
}

type newsContent = {
    text:string
    audio: string
    duration:number
}

type news = {
    webId: number
    newsId:number
    newsDet: Array<newsContent>

}

type content = {
    web: Array<web>
    newsObject:Array<news>
}

cron.schedule('29 21 * * *', function () {

    const content: string = fs.readFileSync('ref.json', 'utf8')
    const contentJson: content = JSON.parse(content)
    const web: Array<web> = contentJson.web
    const newsObject: Array<news> = contentJson.newsObject
    const date:string = new Date().toString().replace(/[{(+)}]|GMT|0530|India Standard Time| /g, '')

    for (let i: number = 0; i < web.length; i++) {

        const id: number = web[i].id
        const url: string = web[i].url
        const selector: Array<string> = web[i].selector

        request(url, function (err, resp, html) {
         
            if (!err && resp.statusCode === 200) {

              let news: Array<newsContent> = []
         
                for (let j: number = 0; j < selector.length; j++) {
        
                  const selectorId: string = selector[j]
                  const $ = cheerio.load(html)
                  const dataPath = $(selectorId)
                  const data: any = dataPath.text()
                  
                  const newsId:number = newsObject.length+1

                  let newsDetail = <newsContent>{}
                  newsDetail.text = data
                  const fileName = 'voice/NewsId:'+newsId+'-index:'+j+'-'+date+'.wav'
                  newsDetail.audio = fileName
                  news[j] = newsDetail
                  
                }

              const index = newsObject.length
              let detail = <news>{}
              detail.webId = id
              detail.newsId = index+1
              detail.newsDet = news
              newsObject[index] = detail
            
              fs.writeFileSync('ref.json', JSON.stringify(contentJson, null, 2), 'utf8')

              if(i === web.length-1){generate()}
            
            }
        })
    }
})

function generate() {
  
  const content: string = fs.readFileSync('ref.json', 'utf8')
  const contentJson: content = JSON.parse(content)
  const web: Array<web> = contentJson.web
  const newsObject: Array<news> = contentJson.newsObject
  const index: number = newsObject.length - web.length
  let objectInd:number = index
  let newsInd:number  = 0

 
  let audioGen = function ():Promise<string> {

    const newsCollection: Array<newsContent> = newsObject[objectInd].newsDet
    const data = newsCollection[newsInd].text
    const fileName = newsCollection[newsInd].audio

    let myPromise = new Promise<string>((resolve, reject) => {

      if (objectInd < newsObject.length && newsInd < newsCollection.length) {

        exec(`./tts --text "${data}" --out_path ${fileName}`, (error, stdout, stderr) => {

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
            const data1:string = fileName
            resolve(data1)
          }
        })
      }
    })
    return myPromise
  }

  let audioDuration = function(data1:string):Promise<string> {

    console.log(1)
    const fileName:string = data1
    let myPromise = new Promise<string>((resolve, reject) => {

        load(fileName).then(function (res: { duration: number }) {
            const duration = res.duration
            const newsCollection: Array<newsContent> = newsObject[objectInd].newsDet
            newsCollection[newsInd].duration = duration
            console.log(2)
            resolve("duration got")
        })
    })
    return myPromise
  }

  let write = function():Promise<string> {
    console.log(3)
    let myPromise = new Promise<string>((resolve, reject) => {
        console.log(4)
        fs.writeFile('ref.json',JSON.stringify(contentJson, null, 2) , function (err) {
            if (err) throw err
            console.log(5)
            resolve('duration wrote')
        })   
    })
    return myPromise
  }

  let recur = function () {
    console.log(6)

    const newsCollection: Array<newsContent> = newsObject[objectInd].newsDet

        if (newsInd < newsCollection.length - 1) {
            console.log(7,1)
            newsInd++
            audioGen().then(audioDuration).then(write).then(recur)
        } else if (objectInd < newsObject.length - 1) {
            console.log(7,2)
            newsInd = 0
            objectInd++
            audioGen().then(audioDuration).then(write).then(recur)
        } else {
            console.log(7,3)
            console.log('All text news are converted to audio')
        }
  }

  audioGen().then(audioDuration).then(write).then(recur)

}
  
app.listen(8588, function () {
  console.log('Node server is running 8588..')
})



