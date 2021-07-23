import express from 'express'
import fs from 'fs'
import request from 'request'
import cheerio from 'cheerio'
import bodyParser from 'body-parser'
import path from 'path'
import cron from 'node-cron'
import { exec } from 'child_process'
const load = require('audio-loader')

import { IgApiClient } from 'instagram-private-api'
require('dotenv').config()
import util from 'util'
require('util.promisify').shim()
const readFileAsync = util.promisify(fs.readFile)


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



cron.schedule('4 21 * * *', function () {

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
              detail.oneaudio = `video/NewsId:${index+1}`
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

  let audioDurWrite = function():Promise<string> {
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
            audioGen().then(audioDuration).then(audioDurWrite).then(recur1)
        } else if (objectInd < newsObject.length ) {
            console.log(7,2)
            mergeAudiopath().then(mergeAudio).then(viedogen).then(backroundGen).then(videopathwrite).then(postvideo).then(recur2)

        }
  }

  audioGen().then(audioDuration).then(audioDurWrite).then(recur1)

  const mergeAudiopath = function ():Promise<string>{

    const myPromise1 = new Promise<string>((resolve, reject) => {
        const newsCollection:Array<newsContent> = newsObject[objectInd].newsDet
        const newsId:number = newsObject[objectInd].newsId
        const fileName:string = newsObject[objectInd].oneaudio
        const length:number = newsCollection.length
        let first = ''
        let second = ''
        let third = ''
        console.log(8)
        for (let j = 0; j < length; j++) {
          first += ' -i ' + newsCollection[j].audio
          if(j < length-1 ){
          second += '[' + length + ']atrim=duration=2[g];'
          third += '[' + j + '][g]'
          }
        }
        const merge:string = `ffmpeg${first} -f lavfi -i anullsrc -filter_complex \ "${second}${third}[${length-1}]concat=n=${length+length-1}:v=0:a=1" ${fileName}.wav`
        console.log(9)
        resolve(merge)
      })
      return myPromise1
  } 
  
  const mergeAudio = function (merge:string):Promise<string> {
  
    const fileName:string = newsObject[objectInd].oneaudio
    const myPromise1 = new Promise<string>((resolve, reject) => {
        console.log(10)
    exec(`${merge}`, (error, stderr, stdout) => {
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
        const video:string = `ffmpeg  -stream_loop -1 -i video.mp4 -i ${fileName}.wav -shortest -map 0:v:0 -map 1:a:0 -y ${fileName}:old.mp4`
        console.log(11)
        resolve(video)
      }
    })
    })
    return myPromise1
  }
  
  const viedogen = function(video:string):Promise<string>{

    const fileName:string = newsObject[objectInd].oneaudio
    const myPromise1 = new Promise<string>((resolve, reject) => {
      console.log(12)
      exec(`${video}`, (error, stderr, stdout) => {
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
          console.log(13)
          const backroundMusic:string = `ffmpeg -i bgm.wav -i ${fileName}:old.mp4 -filter_complex \ "[0:a]volume=0.2[a1];[1:a]volume=2[a2];[a1][a2]amerge,pan=stereo|c0<c0+c2|c1<c1+c3[out]" -map 1:v -map "[out]" -c:v copy -c:a aac -shortest ${fileName}.mp4`
          fs.unlinkSync(`${fileName}.wav`)
          resolve(backroundMusic)
        }
      })
      })
      return myPromise1
  }
  
  const backroundGen = function(backroundMusic:string):Promise<string>{
  
    const fileName:string = newsObject[objectInd].oneaudio
    const myPromise1 = new Promise<string>((resolve, reject) => {
      console.log(14)
      exec(`${backroundMusic}`, (error, stderr, stdout) => {
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
          console.log(15)
          fs.unlinkSync(`${fileName}:old.mp4`)
          const filepath:string = `${fileName}.mp4`
          resolve(filepath)
        }
      })
      })
      return myPromise1
  }

  const videopathwrite = function(filepath:string):Promise<string> {
    console.log(16)
    const myPromise = new Promise<string>((resolve, reject) => {
        console.log(4)
        newsObject[objectInd].oneaudio = filepath
        fs.writeFile('ref.json',JSON.stringify(contentJson, null, 2) , function (err) {
            if (err) throw err
            console.log(17)
            resolve(filepath)
        })   
    })
    return myPromise
  }

  const postvideo = async (filepath:string) => {
    const { username, password } = process.env
    const ig = new IgApiClient()
    console.log(18)
    try {
      if (typeof username === 'string' && typeof password === 'string' ){
      console.log(19)
      ig.state.generateDevice(username)
      await ig.simulate.preLoginFlow()
      const user = await ig.account.login(username, password)
      const coverPath:string = './cover.jpg'
      const webname:string = web[(newsObject[objectInd].webId) - 1].name
      const date:string = new Date().toString()
      const published = await ig.publish.video({
  
        video: await readFileAsync(filepath),
        coverImage: await readFileAsync(coverPath),
        caption:`This Economical news clip is from ${webname} on ${date}`
  
      })
      console.log(20)
      console.log(published)
    }
    } catch (error) {
      console.log(error)
    }
  }


  const recur2 = function(){
      console.log(21)
      if(objectInd <newsObject.length-1){
          console.log('done', 19)
            newsInd = 0
            objectInd++
            audioGen().then(audioDuration).then(audioDurWrite).then(recur1)
      }
      else{console.log('All audio generated')}
  }

}
  

app.listen(8588, function () {
  console.log('Node server is running 8588..')
})
