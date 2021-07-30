
async function display (id, button, buttonBGMclr, parentDivId) {
  // button.disabled = true

  const refMainNewsDiv = document.getElementById(`mainnews${id}`)

  if (refMainNewsDiv === null) {
    const url = 'http://localhost:8588/getjson'
    const res = await fetch(url)
    const contentJson = await res.json()
    const web = contentJson.web
    const newsObject = contentJson.newsObject
    let index = newsObject.length - web.length
    let newsDet

    await getnewsObject()

    function getnewsObject () {
      for (let j = index; j < newsObject.length; j++) {
        if (newsObject[j].webId !== id) { continue }
        newsDet = newsObject[j].newsDet
        index = j
      }
    }

    let serialNum = 1
    let result = ''

    for (let i = 0; i < newsDet.length; i++) {
      result += `<br> ${serialNum}. ${newsDet[i].text} <br>`
      serialNum++
      if (i === newsDet.length - 1) { present() }
    }

    function present () {
      const parentDiv = document.getElementById(parentDivId)

      const MainNewsDiv = document.createElement('div')

      const newsDiv = document.createElement('div')
      const buttonDiv = document.createElement('div')
      const addNewsDiv = document.createElement('div')

      const audioButton = document.createElement('BUTTON')
      const videoButton = document.createElement('BUTTON')
      const postButton = document.createElement('BUTTON')

      const addNewsButton = document.createElement('BUTTON')
      const addNewsTextbox = document.createElement('INPUT')

      MainNewsDiv.id = `mainnews${id}`
      newsDiv.id = `news${id}`
      buttonDiv.id = `nextprocess${id}`
      addNewsDiv.id = `addnews${id}`
      addNewsTextbox.id = `addNewstext${id}`

      newsDiv.className = 'ntext'
      audioButton.className = `text font2 ${buttonBGMclr}`
      videoButton.className = `text font2 ${buttonBGMclr}`
      postButton.className = `text font2 ${buttonBGMclr}`
      addNewsButton.className = `text font2 ${buttonBGMclr}`
      addNewsTextbox.className = 'addnewsinput'

      newsDiv.innerHTML = result
      audioButton.innerHTML = 'Generate the Audio'
      videoButton.innerHTML = 'Generate the Video'
      postButton.innerHTML = 'Post Video'
      addNewsButton.innerHTML = 'Add News'

      MainNewsDiv.style.display = 'block'

      if (newsObject[index].audioGen === 'yes') { addNewsDiv.style.display = 'none' }
      else { addNewsDiv.style.display = 'block' }

      audioButton.setAttribute('onClick', `audioGen(${index}, ${id})`)
      videoButton.setAttribute('onClick', `videoGen(${index}, ${id})`)
      postButton.setAttribute('onClick', `postVideo(${index}, ${id})`)
      addNewsButton.setAttribute('onClick', `addNews(${index}, ${id})`)
      addNewsTextbox.setAttribute('type', 'text')

      buttonDiv.appendChild(audioButton)
      buttonDiv.appendChild(videoButton)
      buttonDiv.appendChild(postButton)

      addNewsDiv.appendChild(addNewsTextbox)
      addNewsDiv.appendChild(addNewsButton)

      MainNewsDiv.appendChild(newsDiv)
      MainNewsDiv.appendChild(addNewsDiv)
      MainNewsDiv.appendChild(buttonDiv)

      parentDiv.appendChild(MainNewsDiv)
    }
  } else if (refMainNewsDiv !== null && refMainNewsDiv.style.display === 'none') {
    refMainNewsDiv.style.display = 'block'
  } else if (refMainNewsDiv !== null && refMainNewsDiv.style.display === 'block') {
    refMainNewsDiv.style.display = 'none'
  }
}

async function audioGen (index, id) {
  const refaddNewsDiv = document.getElementById(`addnews${id}`)
  refaddNewsDiv.style.display = 'none'

  const url = 'http://localhost:8588/getjson'
  const res = await fetch(url)
  const contentJson = await res.json()
  const newsObject = contentJson.newsObject
  const objectInd = index

  if (newsObject[objectInd].audioGen === 'yes') { alert('Audio Already Generated') } else {
    alert('Audio Generation started')
    const xhttp = new XMLHttpRequest()
    xhttp.onload = function () {
      alert(this.responseText)
    }
    xhttp.open('POST', 'http://localhost:8588/generateaudio')
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    xhttp.send(`ind=${index}`)
  }
}

async function videoGen (index) {
  const url = 'http://localhost:8588/getjson'
  const res = await fetch(url)
  const contentJson = await res.json()
  const newsObject = contentJson.newsObject
  const objectInd = index

  if (newsObject[objectInd].videoGen === 'yes') { alert('Video Already Generated') } else if (newsObject[objectInd].audioGen === 'no') { alert('Audio is not yet Generated') } else {
    alert('Video Generation started')
    const xhttp = new XMLHttpRequest()
    xhttp.onload = function () {
      alert(this.responseText)
    }
    xhttp.open('POST', 'http://localhost:8588/generatevideo')
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    xhttp.send(`ind=${index}`)
  }
}

async function postVideo (index) {
  const url = 'http://localhost:8588/getjson'
  const res = await fetch(url)
  const contentJson = await res.json()
  const newsObject = contentJson.newsObject
  const objectInd = index

  if (newsObject[objectInd].postVideo === 'yes') { alert('Video Already Posted') } else if (newsObject[objectInd].videoGen === 'no') { alert('Video is not yet Generated') } else {
    alert('Video Posting started')
    const xhttp = new XMLHttpRequest()
    xhttp.onload = function () {
      alert(this.responseText)
    }
    xhttp.open('POST', 'http://localhost:8588/postvideo')
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    xhttp.send(`ind=${index}`)
  }
}

async function addNews (ind, id) {
  const getNews = document.getElementById(`addNewstext${id}`).value
  document.getElementById(`addNewstext${id}`).value = ''
  const url = 'http://localhost:8588/getjson'
  const res = await fetch(url)
  const contentJson = await res.json()
  const newsObject = contentJson.newsObject
  const objectInd = ind
  const newsDet = newsObject[objectInd].newsDet
  const newsId = newsObject[objectInd].newsId
  const index = newsDet.length

  let result = document.getElementById(`news${id}`).innerHTML
  result += `<br> ${index + 1}. ${getNews} <br>`
  document.getElementById(`news${id}`).innerHTML = result

  const date = new Date().toString().replace(/[{(+)}]|GMT|0530|India Standard Time| /g, '')
  const fileName = 'voice/NewsId:' + newsId + '-index:' + index + '-' + date + '.wav'

  const detail = {}
  detail.text = getNews
  detail.audio = fileName
  newsDet[index] = detail

  const xhttp = new XMLHttpRequest()
  xhttp.onload = function () {
    alert(this.responseText)
  }
  xhttp.open('POST', 'http://localhost:8588/updatejson')
  xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
  xhttp.send(`data=${JSON.stringify(contentJson)}`)
}
