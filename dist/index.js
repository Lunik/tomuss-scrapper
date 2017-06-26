'use strict';

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _xml2js = require('xml2js');

var _freeMobileSmsApi = require('free-mobile-sms-api');

var _freeMobileSmsApi2 = _interopRequireDefault(_freeMobileSmsApi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MY_ID = process.env.MY_ID; /**
                                * Created by lunik on 26/06/2017.
                                */

var MY_PRIVATE_KEY = process.env.MY_PRIVATE_KEY;

if (MY_ID && MY_PRIVATE_KEY) {
  var _enableSMS = true;
  _freeMobileSmsApi2.default.account(MY_ID, MY_PRIVATE_KEY);
} else {
  var _enableSMS2 = false;
}

function checkArgument() {
  if (process.argv.length <= 2) {
    if (typeof process.argv[2] === 'undefined') {
      throw 'Missing rss url. \nUsage: node dist/index.js <RSS_URL>\n';
    }
  }
}

function getRssUrl() {
  return process.argv[2];
}

function scrapeRSS(url, cb) {
  (0, _request2.default)({
    method: 'GET',
    url: url
  }, function (err, res, body) {
    if (err) {
      throw err;
    }
    try {
      cb(body);
    } catch (e) {
      console.error(e);
    }
  });
}

function parseRSS(string, cb) {
  (0, _xml2js.parseString)(string, function (err, result) {
    if (err) {
      throw err;
    }
    cb(result.rss.channel[0]);
  });
}

var LastBuild = new Date('1/1/1900');
var knownItems = [];
function findNewEntry(rss, cb) {
  var currentBuild = new Date(rss.lastBuildDate[0]);
  if (currentBuild.getTime() > LastBuild.getTime()) {
    LastBuild = currentBuild;

    for (var i = 0; i < rss.item.length; i++) {
      var item = rss.item[i];
      if (knownItems.indexOf(item.guid[0]._) === -1) {
        knownItems.push(item.guid[0]._);
        cb(item);
      }
    }
  }
}

function onNewEntry(item) {
  console.log(item);
  if (enableSMS) {
    delete item.link;
    delete item.guid;
    delete item.author;
    delete item.pubDate;
    _freeMobileSmsApi2.default.send(encodeURIComponent(JSON.stringify(item)));
  }
}

checkArgument();
var RSS = getRssUrl();

setInterval(function () {
  scrapeRSS(RSS, function (body) {
    return parseRSS(body, function (rssObj) {
      return findNewEntry(rssObj, function (item) {
        return onNewEntry(item);
      });
    });
  });
}, 30000);