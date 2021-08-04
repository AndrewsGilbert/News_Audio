import express from 'express'
import fs from 'fs'
import request from 'request'
import cheerio from 'cheerio'
import bodyParser from 'body-parser'
import path from 'path'
import cron from 'node-cron'
import { exec } from 'child_process'
import alert from 'alert'

import { IgApiClient } from 'instagram-private-api'
require('dotenv').config()
import util from 'util'
require('util.promisify').shim()
const readFileAsync = util.promisify(fs.readFile)


const app = express()

app.use(bodyParser.urlencoded({extended:true}))

app.use(express.static(path.join(__dirname,'/')))

type web = {
    id:number
    name:string
    url:string
    selector:Array<string>
}

type newsContent = {
    text:string
    audio: string
}

type news = {
    webId: number
    newsId:number
    newsDet: Array<newsContent>
    oneaudio:string
    audioGen:string
    videoGen:string
    postVideo:string

}

type content = {
    web: Array<web>
    newsObject:Array<news>
}

type jsnews = {
  index: number
  newsDet: Array<newsContent>
}

app.get('/', function (req, res) {

  res.sendFile(path.join(__dirname,  '/static/home.html'))
  
})

app.get('/getjson', function (req, res) {

  const content: string = fs.readFileSync('ref.json', 'utf8')
  const contentJson: content = JSON.parse(content)
  res.json(contentJson)

})

app.post('/generateaudio', function (req, res) {

  const content: string = fs.readFileSync('ref.json', 'utf8')
  const contentJson: content = JSON.parse(content)
  const newsObject: Array<news> = contentJson.newsObject
  const objectInd = Number(req.body.ind)
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

  let recur1 = function () {
  
      const newsCollection: Array<newsContent> = newsObject[objectInd].newsDet

        if (newsInd < newsCollection.length - 1) {
          newsInd++
          audioGen().then(recur1)
        } else if (objectInd < newsObject.length ) {
            mergeAudiopath().then(mergeAudio)
        }
  }

    audioGen().then(recur1)

  let mergeAudiopath = function ():Promise<string>{

      const myPromise1 = new Promise<string>((resolve, reject) => {
          const newsCollection:Array<newsContent> = newsObject[objectInd].newsDet
          const newsId:number = newsObject[objectInd].newsId
          const fileName:string = newsObject[objectInd].oneaudio
          const length:number = newsCollection.length
          let first = ''
          let second = ''
          let third = ''
          for (let j = 0; j < length; j++) {
            first += ' -i ' + newsCollection[j].audio
            if(j < length-1 ){
            second += '[' + length + ']atrim=duration=2[g];'
            third += '[' + j + '][g]'
            }
          }
          const merge:string = `ffmpeg${first} -f lavfi -i anullsrc -filter_complex \ "${second}${third}[${length-1}]concat=n=${length+length-1}:v=0:a=1" ${fileName}.wav`
          resolve(merge)
        })
        return myPromise1
  } 
    
  let mergeAudio = function (merge:string):Promise<string> {
    
      const fileName:string = newsObject[objectInd].oneaudio
      const myPromise1 = new Promise<string>((resolve, reject) => {
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
            newsObject[objectInd].audioGen = 'yes'
            fs.writeFileSync('ref.json', JSON.stringify(contentJson, null, 2), 'utf8')
            res.end('Audio Generated')
            resolve('Audio Generated')
          }
        })
      })
      return myPromise1
  } 
})

app.post('/generatevideo', function (req, res) {

  const content: string = fs.readFileSync('ref.json', 'utf8')
  const contentJson: content = JSON.parse(content)
  const newsObject: Array<news> = contentJson.newsObject
  const objectInd = Number(req.body.ind)
  const fileName:string = newsObject[objectInd].oneaudio
  const video:string = `ffmpeg  -stream_loop -1 -i video.mp4 -i ${fileName}.wav -shortest -map 0:v:0 -map 1:a:0 -y ${fileName}:old.mp4`

  const viedogen = function():Promise<string>{
      const fileName:string = newsObject[objectInd].oneaudio
      const myPromise1 = new Promise<string>((resolve, reject) => {

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
            fs.unlinkSync(`${fileName}:old.mp4`)
            const filepath:string = `${fileName}.mp4`
            newsObject[objectInd].oneaudio = filepath
            newsObject[objectInd].videoGen = 'yes'
            fs.writeFileSync('ref.json', JSON.stringify(contentJson, null, 2), 'utf8')
            res.end('Video  Generated')
            resolve('Video Generated')
          }
        })
      })
      return myPromise1
  }
  viedogen().then(backroundGen)
})


app.post('/postvideo', function (req, res) {

  const content: string = fs.readFileSync('ref.json', 'utf8')
  const contentJson: content = JSON.parse(content)
  const web: Array<web> = contentJson.web
  const newsObject: Array<news> = contentJson.newsObject
  const objectInd = Number(req.body.ind)
  const webId:number = newsObject[objectInd].webId
  const fileName:string = newsObject[objectInd].oneaudio


  const postvideo = async () => {
      const { username, password } = process.env
      const ig = new IgApiClient()
      try {
        if (typeof username === 'string' && typeof password === 'string' ){
          ig.state.generateDevice(username)
          await ig.simulate.preLoginFlow()
          const user = await ig.account.login(username, password)
          const coverPath:string = './cover.jpg'
          const webname:string = web[webId - 1].name
          const date:string = new Date().toString()
          const published = await ig.publish.video({
        
            video: await readFileAsync(fileName),
            coverImage: await readFileAsync(coverPath),
            caption:`This Economical news clip is from ${webname} on ${date}`
          })
          console.log(published)

          newsObject[objectInd].postVideo = 'yes'
          fs.writeFileSync('ref.json', JSON.stringify(contentJson, null, 2), 'utf8')
          res.end('Video  Posted')
        }
      } catch (error) {
          console.log(error)
      }
  }
  postvideo()
})

app.post('/updatejson', function (req, res) {

  const contentJson = JSON.parse(req.body.data)
  fs.writeFileSync('ref.json', JSON.stringify(contentJson, null, 2), 'utf8')
  res.end('News Updated')

})


cron.schedule('19 13 * * *', function () {

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
        detail.audioGen = 'no'
        detail.videoGen = 'no'
        detail.postVideo = 'no'
        newsObject[index] = detail
            
        fs.writeFileSync('ref.json', JSON.stringify(contentJson, null, 2), 'utf8')
      }
        })
    } 
})

app.listen(8588, function () {
  console.log('Node server is running 8588..')
})
