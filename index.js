require("dotenv").config();
const needle = require("needle");
const client = require("https");
const fs = require("fs");
const searchRegex =
  /\.value='(.*?)';parent.location='\/' \+ encodeURI\('(.*?)'\)/g;
const dataRegex = /messanger\['gdata'\] \= (\[.*?\]);/;
//
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TOKEN, { polling: true });
//
const express = require("express");
const app = express();
/**
 * Searches for people
 * @param {string} query The search query
 * @returns {[{name:string,safeName:string,url:string}]} Array of results
 */
async function search(query) {
  const response = await needle(
    "get",
    `https://www.wikifeet.com/perl/ajax.fpl?req=suggest&gender=undefined&value=${encodeURIComponent(
      query
    )}`
  );
  const results = response.body.replace(/\\/g, "").matchAll(searchRegex);

  return Array.from(results).map((x) => ({
    name: x[1],
    safeName: x[2].replace(/\W/g, "").replace(/_| /g, "-"),
    url: `https://www.wikifeet.com/${encodeURIComponent(x[2])}`,
  }));
}

/**
 * Gets links to all the thumbnails of a person's pictures.
 * @param {{name:string,safeName:string,url:string}} person
 * @returns {[string]} Array of URLs
 */
async function getThumbnails(person) {
  const response = await needle("get", person.url);

  return JSON.parse(response.body.match(dataRegex)[1]).map(
    (x) => `https://thumbs.wikifeet.com/${x.pid}.jpg`
  );
}

function getImageURL(person, id) {
  return `https://pics.wikifeet.com/${person.safeName}-feet-${id}.jpg`;
}

/**
 * Gets links to all of the person's pictures
 * @param {{name:string,safeName:string,url:string}} person
 * @returns {[string]} Array of URLs
 */
async function getImages(person) {
  const response = await needle("get", person.url);

  return JSON.parse(response.body.match(dataRegex)[1]).map((x) =>
    getImageURL(person, x.pid)
  );
}

async function main(name, msg) {
  bot.sendMessage(msg.chat.id, "Seaching......");
  let pokimane = (await search(name))[0];
  let pics = await getImages(pokimane);

  //let random = 0 | (pics.length * Math.random());
  pics.forEach((element, index) => {
    bot.sendPhoto(msg.chat.id, element);
  });
}

//main("inna");

bot.onText(/\/name (.+)/, (msg, match) => {
  main(match[1], msg);
});

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    client.get(url, (res) => {
      if (res.statusCode === 200) {
        res
          .pipe(fs.createWriteStream(filepath))
          .on("error", reject)
          .once("close", () => resolve(filepath));
      } else {
        // Consume response data to free up memory
        res.resume();
        reject(
          new Error(`Request Failed With a Status Code: ${res.statusCode}`)
        );
      }
    });
  });
}

app.all("/", (req, res) => {
  console.log("Just got a request!");
  res.send("Yo!");
});
app.listen(process.env.PORT || 3000);
