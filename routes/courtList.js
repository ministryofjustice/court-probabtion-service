const express = require('express');
const router = express.Router();
const request = require('superagent')
const config = require('../config')
const log = require('../log')

const apiUrl = config.apis.courtList.url

router.get('/', (req, res, next) => {
  request
    .get(`${apiUrl}/court/${req.query['courtName']}/list`)
    .query({ date: req.query['dateOfHearing'] })
    .set('Accept', 'application/json')
    .then(result => {
      res.render('courtList', { sessions: result.body.sessions });
    })
    .catch(error => {
      res.render('error', {error, message: "Unable to retrieve court list"})
    })

});

module.exports = router;
