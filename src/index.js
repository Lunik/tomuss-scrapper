/**
 * Created by lunik on 26/06/2017.
 */

import request from 'request'
import { parseString } from 'xml2js'
import sms from 'free-mobile-sms-api'

const MY_ID = process.env.MY_ID
const MY_PRIVATE_KEY = process.env.MY_PRIVATE_KEY

if (MY_ID && MY_PRIVATE_KEY) {
  const enableSMS = true
  sms.account(
    MY_ID,
    MY_PRIVATE_KEY
  )
} else {
  const enableSMS = false
}

function checkArgument () {
  if (process.argv.length <= 2) {
    if (typeof process.argv[2] === 'undefined') {
      throw `Missing rss url. \nUsage: node dist/index.js <RSS_URL>\n`
    }
  }
}

function getRssUrl () {
  return process.argv[2]
}

function scrapeRSS (url, cb) {
  request({
    method: 'GET',
    url: url
  }, (err, res, body) => {
    if (err) {
      throw err
    }
    try {
      cb(body)
    } catch (e) {
      console.error(e)
    }
  })
}

function parseRSS (string, cb) {
  parseString(string, (err, result) => {
    if (err) {
      throw err
    }
    cb(result.rss.channel[0])
  })
}

var LastBuild = new Date('1/1/1900')
var knownItems = []
function findNewEntry (rss, cb) {
  const currentBuild = new Date(rss.lastBuildDate[0])
  if (currentBuild.getTime() > LastBuild.getTime()) {
    LastBuild = currentBuild

    for (let i = 0; i < rss.item.length; i++) {
      let item = rss.item[i]
      if (knownItems.indexOf(item.guid[0]._) === -1) {
        knownItems.push(item.guid[0]._)
        cb(item)
      }
    }
  }
}

function onNewEntry (item) {
  console.log(item)
  if(enableSMS){
    delete item.link
    delete item.guid
    delete item.author
    delete item.pubDate
    sms.send(encodeURIComponent(JSON.stringify(item)))
  }
}

checkArgument()
const RSS = getRssUrl()

setInterval(() => {
  scrapeRSS(RSS, (body) =>
    parseRSS(body, (rssObj) =>
      findNewEntry(rssObj, (item) => onNewEntry(item))))
}, 30000)
