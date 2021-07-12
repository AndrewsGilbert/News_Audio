import express from 'express'
import fs from 'fs'
import request from 'request'
import cheerio from 'cheerio'
import bodyParser from 'body-parser'
import path from 'path'
import cron from 'node-cron'
import { exec } from 'child_process'
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
    audio:string
}

type news = {
    webId: number
    newsDet: Array<newsContent>

}

type content = {
    web: Array<web>
    newsObject:Array<news>
}

cron.schedule('15 23 * * *', function () {

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
                  
                  let newsDetail = <newsContent>{}
                  newsDetail.text = data
                  const fileName = 'voice/webId:'+id+'-ind:'+j+'-'+date+'.wav'
                  newsDetail.audio = fileName
                  news[j] = newsDetail
                  
                }

              const index = newsObject.length
              let detail = <news>{}
              detail.webId = id
              detail.newsDet = news
              newsObject[index] = detail
            
              fs.writeFileSync('ref.json', JSON.stringify(contentJson, null, 2), 'utf8')
            
            }
        })
    }
})

app.get('/', function (req, res) {
  
  const content: string = fs.readFileSync('ref.json', 'utf8')
  const contentJson: content = JSON.parse(content)
  const newsObject: Array<news> = contentJson.newsObject

  audioGen()
  
  function audioGen(webInd: number = 0, newsInd = 0) {

    const newsCollection: Array<newsContent> = newsObject[webInd].newsDet
    const data = newsCollection[newsInd].text
    const fileName = newsCollection[newsInd].audio
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

        if (newsInd < newsCollection.length - 1) {
          newsInd++
          audioGen(webInd, newsInd)
        }
        if (newsInd === newsCollection.length - 1 && webInd < newsObject.length - 1) {
          newsInd = 0
          webInd++
          audioGen(webInd, newsInd)
        }
        console.log(`stdout: ${stdout}`)
      }
    })
  }
 res.end()
})

  
app.listen(8588, function () {
  console.log('Node server is running 8588..')
})