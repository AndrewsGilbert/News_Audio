
async function display (id, button, buttonBGMclr, parentDivId) {
  // button.disabled = true

  const refnewsDiv = document.getElementById(`news${id}`)
  const refbuttonDiv = document.getElementById(`nextprocess${id}`)

  if (refnewsDiv === null) {
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

      const newsDiv = document.createElement('div')
      const buttonDiv = document.createElement('div')
      const audioButton = document.createElement('BUTTON')
      const videoButton = document.createElement('BUTTON')
      const postButton = document.createElement('BUTTON')

      newsDiv.id = `news${id}`
      buttonDiv.id = `nextprocess${id}`

      newsDiv.className = 'ntext'
      audioButton.className = `text font2 ${buttonBGMclr}`
      videoButton.className = `text font2 ${buttonBGMclr}`
      postButton.className = `text font2 ${buttonBGMclr}`

      newsDiv.innerHTML = result
      audioButton.innerHTML = 'Generate the Audio'
      videoButton.innerHTML = 'Generate the Video'
      postButton.innerHTML = 'Post Video'

      newsDiv.style.display = 'block'
      buttonDiv.style.display = 'block'

      audioButton.setAttribute('onClick', `audioGen(${index})`)
      videoButton.setAttribute('onClick', `videoGen(${index})`)
      postButton.setAttribute('onClick', `postVideo(${index})`)

      buttonDiv.appendChild(audioButton)
      buttonDiv.appendChild(videoButton)
      buttonDiv.appendChild(postButton)
      parentDiv.appendChild(newsDiv)
      parentDiv.appendChild(buttonDiv)
    }
  } else if (refnewsDiv !== null && refnewsDiv.style.display === 'none') {
    refnewsDiv.style.display = 'block'
    refbuttonDiv.style.display = 'block'
  } else if (refnewsDiv !== null && refnewsDiv.style.display === 'block') {
    refnewsDiv.style.display = 'none'
    refbuttonDiv.style.display = 'none'
  }
}

async function audioGen (index) {
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
