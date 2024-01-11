/* JavaScript för webb-applikation som möjliggör lyssnande till Sveriges Radio och presenterar dess tablå.
Skapat av Cecilia Edvardsson cecilia.edvardsson23@gmail.com */

("use strict");

window.onload = init;

function init() {
  getChannels();
  displayInfo();
}

// Variabler för HTML-element
let infoSection = document.getElementById("info");
let playerList = document.getElementById("numrows");
let channelList = document.getElementById("mainnavlist");
let radioPlayer = document.getElementById("radioplayer");

// URL från Sveriges Radios API
let urlChannels =
  "http://api.sr.se/api/v2/channels?format=json&pagination=false";
let urlSchedule =
  "http://api.sr.se/api/v2/scheduledepisodes?format=json&indent=true&pagination=false";
let urlLiveStream = "http://sverigesradio.se/topsy/direkt/srapi/";

let radioShow;
let endTime;

// Funktion som presenterar applikationen
function displayInfo() {
  // Skapar element
  let infoHeadline = document.createElement("h3");
  let infoHeadlineContent = document.createTextNode(
    "Välkommen till den digitala radiolyssnaren"
  );
  let logo = document.createElement("img");
  logo.src = "images/sr_logo.jpg";
  logo.setAttribute("width", "100%");
  infoHeadline.appendChild(infoHeadlineContent);
  infoSection.appendChild(logo);
  infoSection.appendChild(infoHeadline);

  let infoArticle = document.createElement("article");
  let infoText = document.createElement("p");
  let infoTextContent = document.createTextNode(
    "Här kan du lyssna på Sveriges Radio och se dagens tablå för alla tillhörande kanaler. För att se tablåer, klicka på önskad kanal i listan till vänster. För att lyssna på radion, välj önskad kanal i listan i höger övre hörn så startar en spelare längst ned på sidan. "
  );

  // Kopplar ihop element
  infoText.appendChild(infoTextContent);
  infoArticle.appendChild(infoText);
  infoSection.appendChild(infoArticle);
}

// Funktion som hämtar kanaler och publicerar dessa i två listor
function getChannels() {
  // AJAX-anrop som hämtar data
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let jsonStr = JSON.parse(this.responseText);
      let channelArray = jsonStr.channels;

      // Funktion som skapar lista med kanaler
      function fetchChannels() {
        // Rensa tidigare lista
        while (channelList.firstChild) {
          channelList.removeChild(channelList.firstChild);
        }

        // Publicera enligt valt maxantal
        for (let i = 0; i < playerList.value; i++) {
          let channel = document.createElement("li");
          channel.innerText = channelArray[i].name;
          channelList.appendChild(channel);
          channel.title = channelArray[i].tagline;
          channel.id = channelArray[i].id;

          channel.addEventListener("click", setChannelColor, false);
          channel.addEventListener("click", emptySchedule, false);
          channel.addEventListener("click", getSchedule, false);

          // Funktion som färglägger sidan med vald kanals färg
          function setChannelColor() {
            let channelColor = "#" + channelArray[i].color;
            document.getElementById("mainheader").style.backgroundColor =
              channelColor;
          }
        }
      }

      // Funktion som skapar spellista med kanaler
      function fetchPlayerList() {
        // Publicera enligt valt maxantal
        for (let i = 0; i < channelArray.length; i++) {
          let channel = document.createElement("option");
          channel.innerText = channelArray[i].name;
          channel.id = channelArray[i].id;
          document.getElementById("playchannel").add(channel, undefined);
        }
      }

      fetchChannels();
      fetchPlayerList();
      // Eventlyssnare för ändring av antal kanaler som ska visas
      playerList.addEventListener("change", fetchChannels, false);
    }
  };
  xhttp.open("GET", urlChannels, true);
  xhttp.send();
}

// Funktion som laddar in kanalens nuvarande tablå efter klick på kanal
function getSchedule(event) {
  currentUrlSchedule = urlSchedule + "&channelid=" + event.target.id;
  console.log(event.target.id);
  console.log(urlSchedule);
  // AJAX-anrop som hämtar data
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let jsonStr = JSON.parse(this.responseText);
      console.log(jsonStr);

      for (let i = 0; jsonStr.schedule[i]; i++) {
        radioShow = jsonStr.schedule[i];
        endTime = jsonStr.schedule[i].endtimeutc;

        endTime = endTime.toString();
        fetchNumbers = endTime.slice(6, 19);
        fetchNumbers = parseInt(fetchNumbers, 10);
        endTime = new Date(fetchNumbers);
        let currentDateAndTime = new Date();
        if (endTime > currentDateAndTime) {
          publishSchedule(radioShow);
        }
      }
    }
  };

  xhttp.open("GET", currentUrlSchedule, true);
  xhttp.send();
}

// Funktion som skapar de HTML-element som bygger upp tablån
function publishSchedule(chosenRadioShow) {
  // Titel
  let article = document.createElement("article");
  let articleH3 = document.createElement("H3");
  let articleH3Text = document.createTextNode(chosenRadioShow.title);

  articleH3.appendChild(articleH3Text);
  article.appendChild(articleH3);
  infoSection.appendChild(article);

  // Eventuell undertitel
  if (chosenRadioShow.subtitle) {
    let articleH4 = document.createElement("H4");
    let articleH4Text = document.createTextNode(chosenRadioShow.subtitle);
    articleH4.style.fontStyle = "italic";
    articleH4.appendChild(articleH4Text);
    article.appendChild(articleH4);
  }

  // Eventuell bild
  if (chosenRadioShow.imageurltemplate) {
    let image = document.createElement("img");
    let imageSource = chosenRadioShow.imageurltemplate;
    image.src = imageSource;
    image.setAttribute("width", "250px");
    article.appendChild(image);
  }

  // Tidsangivelser
  let articleH5 = document.createElement("H5");

  let startTimeFormatUTC = chosenRadioShow.starttimeutc;
  let endTimeFormatUTC = chosenRadioShow.endtimeutc;

  let startTimeFormatXXXX = convertTime(startTimeFormatUTC);
  let endTimeFormatXXXX = convertTime(endTimeFormatUTC);

  let articleH5Text = document.createTextNode(
    startTimeFormatXXXX + " - " + endTimeFormatXXXX
  );
  articleH5.appendChild(articleH5Text);
  article.appendChild(articleH5);

  // Konvertering format UTC -> TT MM
  function convertTime(time) {
    time = time.toString();
    fetchNumbers = time.slice(6, 19);
    fetchNumbers = parseInt(fetchNumbers, 10);
    let timeFormatUTC = new Date(fetchNumbers);
    timeFormatUTC = timeFormatUTC.toString();

    let convertedTime = timeFormatUTC.slice(16, 21);
    return convertedTime;
  }

  // Beskrivning
  let paragraph = document.createElement("p");
  let paragraphText = document.createTextNode(chosenRadioShow.description);
  paragraph.appendChild(paragraphText);
  article.appendChild(paragraph);
}

// Funktion som tömmer tablån mellan varje kanal
function emptySchedule() {
  infoSection.innerHTML = "";
}

// Funktion som spelar upp kanal live och presenterar detta
function getLiveStream() {
  // Tar bort eventuell tidigare kanal

  while (radioPlayer.firstChild) {
    radioPlayer.removeChild(radioPlayer.firstChild);
  }

  // Tar fram vald kanal
  let player = document.getElementById("playchannel");
  let channelID = player.options[player.selectedIndex].id;
  currentUrlLiveStream = urlLiveStream + channelID + ".mp3";

  // Skapar spelare
  let audioEl = document.createElement("audio");
  let sourceEl = document.createElement("source");

  audioEl.setAttribute("controls", "");
  audioEl.setAttribute("autoplay", "");
  sourceEl.setAttribute("type", "audio/mpeg");
  sourceEl.setAttribute("src", currentUrlLiveStream);

  radioPlayer.appendChild(audioEl);
  audioEl.appendChild(sourceEl);
}

// Kanaler läggs in i spellista
document
  .getElementById("playbutton")
  .addEventListener("click", getLiveStream, false);
