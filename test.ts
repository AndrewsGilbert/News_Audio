import express from 'express'
import fs from 'fs'
import request from 'request'
import cheerio, { Cheerio } from 'cheerio'
import bodyParser from 'body-parser'
import path from 'path'
import cron from 'node-cron'
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

type news = {
    webId: number
    news:Array<string>
}

type content = {
    web: Array<web>
    newsObject:Array<news>
}

cron.schedule('5 9 * * *', function () {

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

                let newsText: Array<string> = []
  
                for (let j: number = 0; j < selector.length; j++) {
        
                    const selectorId: string = selector[j]
                    const $ = cheerio.load(html)
                    const dataPath = $(selectorId)
                    const data: any = dataPath.text()
                    newsText[j] = data
                }

                let detail = <news>{}
                detail.webId = id
                detail.news = newsText
                const index = newsObject.length
                newsObject[index] = detail
            
                fs.writeFileSync('ref.json', JSON.stringify(contentJson, null, 2), 'utf8')
            }
        })
    }
})


  
/* app.listen(8586, function () {
  console.log('Node server is running 8586..')
}) */