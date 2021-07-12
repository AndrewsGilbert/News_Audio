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

cron.schedule('23 9 * * *', function () {

    const content: string = fs.readFileSync('ref.json', 'utf8')
    const contentJson: content = JSON.parse(content)
    const web: Array<web> = contentJson.web
    const newsObject: Array<news> = contentJson.newsObject

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
                  const fileName = 'voice/id:' + id + ',' + j + '.wav'
                  newsDetail.audio = fileName
                  news[j] = newsDetail
                  
                   exec(`./tts --text "${data}" --out_path ${fileName}`, (error, stdout, stderr) => {
                      if (error) {
                        console.log(`error: ${error.message}`)
                        return
                      }
                      if (stderr) {
                        console.log(`stderr: ${stderr}`)
                        return
                      }
                      console.log(`stdout: ${stdout}`)
                    }) 
                  

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


  
 app.listen(8586, function () {
  console.log('Node server is running 8586..')
})
