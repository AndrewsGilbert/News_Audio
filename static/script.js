const loaddiv = document.getElementById('load')
const layoutDiv = document.getElementById('layout')

async function front (button) {
  const refnewslayoutdiv = document.getElementById('newslayout')

  if (refnewslayoutdiv === null) {
    const contentJson = await fetchfunction('http://localhost:8588/getjson', {})
    const web = contentJson.web

    const newsLayoutDiv = document.createElement('div')
    newsLayoutDiv.id = 'newslayout'
    newsLayoutDiv.style.display = 'block'

    layoutDiv.appendChild(newsLayoutDiv)

    for (let i = 0; i < web.length; i++) {
      const webId = web[i].id
      const parentDivId = `newswebdiv${webId}`
      const webname = web[i].name

      const newswebDiv = document.createElement('div')
      const newswebButtonDiv = document.createElement('BUTTON')

      newswebDiv.id = parentDivId
      newswebButtonDiv.id = `newswebbuttondiv${webId}`
      newswebButtonDiv.className = `button nbd${webId}`
      newswebButtonDiv.innerHTML = webname
      newswebButtonDiv.setAttribute('onClick', `display(${webId},${parentDivId})`)

      newswebDiv.appendChild(newswebButtonDiv)
      newsLayoutDiv.appendChild(newswebDiv)
    }
  } else if (refnewslayoutdiv !== null && refnewslayoutdiv.style.display === 'none') {
    refnewslayoutdiv.style.display = 'block'
  } else if (refnewslayoutdiv !== null && refnewslayoutdiv.style.display === 'block') {
    refnewslayoutdiv.style.display = 'none'
  }
}

async function display (id, div) {
  const parentDivId = div.id

  const refMainNewsDiv = document.getElementById(`mainnews${id}`)

  if (refMainNewsDiv === null) {
    const contentJson = await fetchfunction('http://localhost:8588/getjson', {})
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
      audioButton.className = `text font2 tc${id}`
      videoButton.className = `text font2 tc${id}`
      postButton.className = `text font2 tc${id}`
      addNewsButton.className = `text font2 tc${id}`
      addNewsTextbox.className = 'addnewsinput'

      newsDiv.innerHTML = result
      audioButton.innerHTML = 'Generate the Audio'
      videoButton.innerHTML = 'Generate the Video'
      postButton.innerHTML = 'Post Video'
      addNewsButton.innerHTML = 'Add News'

      MainNewsDiv.style.display = 'block'

      if (newsObject[index].audioGen === 'yes') {
        addNewsDiv.style.display = 'none'
      } else { addNewsDiv.style.display = 'block' }

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

      const displayVid = document.createElement('div')
      displayVid.id = `displayviddiv${id}`
      MainNewsDiv.appendChild(displayVid)
      MainNewsDiv.appendChild(buttonDiv)
      parentDiv.appendChild(MainNewsDiv)

      if (newsObject[index].videoGen === 'yes') {
        displayVideo(newsObject[index].webId, newsObject[index].oneaudio)
      }
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

  const contentJson = await fetchfunction('http://localhost:8588/getjson', {})
  const newsObject = contentJson.newsObject
  const objectInd = index

  if (newsObject[objectInd].audioGen === 'yes') { alert('Audio Already Generated') } else {
    alert('Audio Generation started')
    layoutDiv.className = 'hide'
    loaddiv.className = 'show'
    const data = {"ind":index}
    const response = await fetchfunction('http://localhost:8588/generateaudio', data)
    layoutDiv.className = 'show'
    loaddiv.className = 'hide'
    alert(response.result)
  }
}

async function videoGen (index) {
  const contentJson = await fetchfunction('http://localhost:8588/getjson', {})
  const newsObject = contentJson.newsObject
  const objectInd = index

  if (newsObject[objectInd].videoGen === 'yes') { alert('Video Already Generated') } else if (newsObject[objectInd].audioGen === 'no') { alert('Audio is not yet Generated') } else {
    alert('Video Generation started')
    layoutDiv.className = 'hide'
    loaddiv.className = 'show'
    const data = {"ind":index}
    const response = await fetchfunction('http://localhost:8588/generatevideo', data)
    layoutDiv.className = 'show'
    loaddiv.className = 'hide'
    alert(response.result)
    displayVideo(newsObject[index].webId, `${newsObject[index].oneaudio}.mp4`)
  }
}

async function postVideo (index) {
  const contentJson = await fetchfunction('http://localhost:8588/getjson', {})
  const newsObject = contentJson.newsObject
  const objectInd = index

  if (newsObject[objectInd].postVideo === 'yes') { alert('Video Already Posted') } else if (newsObject[objectInd].videoGen === 'no') { alert('Video is not yet Generated') } else {
    alert('Video Posting started')
    layoutDiv.className = 'hide'
    loaddiv.className = 'show'
    const data = {"ind":index}
    const response = await fetchfunction('http://localhost:8588/postvideo', data)
    layoutDiv.className = 'show'
    loaddiv.className = 'hide'
    alert(response.result)
  }
}

async function addNews (ind, id) {
  const getNews = document.getElementById(`addNewstext${id}`).value
  document.getElementById(`addNewstext${id}`).value = ''
  const contentJson = await fetchfunction('http://localhost:8588/getjson', {})
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

  const response = await fetchfunction('http://localhost:8588/updatejson', contentJson)
  alert(response.result)
}

function displayVideo (id, filename) {
  const disvidediv = document.getElementById(`displayviddiv${id}`)
  const heading = document.createElement('h2')
  const video = document.createElement('VIDEO')

  heading.innerHTML = '<br> The Generated Video is below <br>'
  video.className = 'video'
  video.setAttribute('controls', 'controls')
  video.setAttribute('type', 'video/mp4')
  video.setAttribute('src', filename)

  disvidediv.appendChild(heading)
  disvidediv.appendChild(video)
}

async function fetchfunction (url, body) {
  const sendreq = await fetch (url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const fetchobject = await sendreq.json()
  return fetchobject
}
