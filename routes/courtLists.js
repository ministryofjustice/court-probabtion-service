const express = require('express');
const router = express.Router();
const request = require('superagent')
const config = require('../config')
const log = require('../log')

const apiUrl = config.apis.courtList.url
const longLivedToken = config.apis.courtList.longLivedToken

router.get('/', (req, res, next) => {
  request
    .get(`${apiUrl}/court/list`)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${longLivedToken}`)
    .then(result => {
      res.render('courtLists', { courtDates: toCourtsByDate(result.body.sessions) });
    })
    .catch(error => {
      res.render('error', {error, message: "Unable to retrieve court lists"})
    })

});

const toCourtsByDate = sessions => {
  return toUniqueList(sessions.map(session => ({
    courtName: session.courtName,
    dateOfHearing: session.dateOfHearing
  })))
}

const toUniqueList = sessions => {
  return  sessions.reduce((unique, o) => {
    if(!unique.some(obj => obj.courtName === o.courtName && obj.dateOfHearing === o.dateOfHearing)) {
      unique.push(o);
    }
    return unique;
  },[]);
}
module.exports = router;
