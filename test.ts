import express from 'express'
import fs from 'fs'
import request from 'request'
import cheerio from 'cheerio'
import bodyParser from 'body-parser'
import path from 'path'
import cron from 'node-cron'
import { exec } from 'child_process'
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
    oneaudio:string

}

type content = {
    web: Array<web>
    newsObject:Array<news>
}

cron.schedule('32 16 * * *', function () {

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
              detail.oneaudio = `new/NewsId:${index+1}-${date}.wav`
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

  let recur1 = function () {
    console.log(6)

    const newsCollection: Array<newsContent> = newsObject[objectInd].newsDet

        if (newsInd < newsCollection.length - 1) {
            console.log(7,1)
            newsInd++
            audioGen().then(audioDuration).then(write).then(recur1)
        } else if (objectInd < newsObject.length ) {
            console.log(7,2)
            mergeAudiopath().then(mergeAudio).then(recur2)

        }
  }

  audioGen().then(audioDuration).then(write).then(recur1)

  const mergeAudiopath = function ():Promise<string>{

    const myPromise1 = new Promise<string>((resolve, reject) => {
        const newsCollection:Array<newsContent> = newsObject[objectInd].newsDet
        const newsId:number = newsObject[objectInd].newsId
        const fileName:string = newsObject[objectInd].oneaudio
        const third:number = newsCollection.length
        let first = ''
        let second = ''
        console.log(1)
        for (let j = 0; j < third; j++) {
          first += ' -i ' + newsCollection[j].audio
          second += '[' + j + ':0]'
        }
        const final:string = `ffmpeg${first} \\-filter_complex '${second}concat=n=${third}:v=0:a=1[out]' \\-map '[out]' ${fileName}`
        console.log(2)
        resolve(final)
      })
      return myPromise1
  } 
  
  const mergeAudio = function (final:string):Promise<string> {
  
    const myPromise1 = new Promise<string>((resolve, reject) => {
        console.log(3)
    exec(`${final}`, (error, stderr, stdout) => {
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
        console.log(4)
        resolve('Done')
      }
    })
    })
    return myPromise1
  }
  
  const recur2 = function(){
      console.log(5)
      if(objectInd <newsObject.length-1){
          console.log(6)
            newsInd = 0
            objectInd++
            audioGen().then(audioDuration).then(write).then(recur1)
      }
      else{console.log('All audio generated')}
  }

}
  


app.listen(8588, function () {
  console.log('Node server is running 8588..')
})



