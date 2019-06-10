const express = require('express')
const router = express.Router()
const logger = require('../log.js')
const config = require('../config')
const request = require('superagent')
const hbs = require('hbs')

const apiUrl = config.apis.courtList.url
const offenderApiUrl = config.apis.offender.url

const fakeOffenderId = '2500333160'

// Spike to show how we could add an contact in Delius
router.get('/requestOMUpdate', function(req, res, next) {
  const dateOfHearing = req.query.dateOfHearing;
  const courtName = req.query.courtName;
  const caseNumber = req.query.caseNumber;

  request
    .get(`${apiUrl}/court/${courtName}/list`)
    .query({ date: dateOfHearing })
    .set('Accept', 'application/json')
    .then(result => {
      const selectedCase = findCase(result.body.sessions, caseNumber)
      const selectedSession = findSession(result.body.sessions, caseNumber)

      request
        .post(`${offenderApiUrl}/api/logon`)
        .set('Content-Type', 'text/plain;charset=utf-8')
        .send('NationalUser')
        .accept('text/plain;charset=utf-8')
        .then(result => {
          const token = result.text
          const note = noteForCase(selectedCase, selectedSession)
          request
            .post(`${offenderApiUrl}/api/courtAppearanceNotification`)
            .type('json')
            .set('Authorization', `Bearer ${token}`)
            .send({
              distinguishedName: 'andy.marke', // hardcoded to a user in SR2
              offenderId: fakeOffenderId, // hardcoded to an offender in SR2
              convictionId: '2500287317', // hardcoded to an active event for the above offender in SR2
              note
            })
            .then(result => {
              logger.info(`Notification sent with id ${result.body}`)
              res.status(201);
              res.send({note, id :result.body});
            })
            .catch(error => {
              logger.error(error)
              res.status(500);
              res.send(error);
            })
        })
        .catch(error => {
          logger.error(error)
          res.status(500);
          res.send(error);
        })
    })
    .catch(error => {
      logger.error(error)
      res.status(500);
      res.send(error);
    })

});

router.get('/getOMUpdate', function(req, res, next) {
  const id = req.query.id;

  request
    .post(`${offenderApiUrl}/api/logon`)
    .set('Content-Type', 'text/plain;charset=utf-8')
    .send('NationalUser')
    .accept('text/plain;charset=utf-8')
    .then(result => {
      const token = result.text
      request
        .get(`${offenderApiUrl}/api/offenders/offenderId/${fakeOffenderId}/courtAppearanceNotification/${id}`)
        .type('json')
        .set('Authorization', `Bearer ${token}`)
        .then(result => {
          logger.info(`Update received ${result}`)
          res.status(200);
          res.send(latestUpdate(result.body.note));
        })
        .catch(error => {
          logger.error(error)
          res.status(500);
          res.send(error);
        })
    })
    .catch(error => {
      logger.error(error)
      res.status(500);
      res.send(error);
    })
});

const latestUpdate = note => {
  const updates = note.split('----------------------------');
  if (updates.length === 1) {
    return ''
  }
  return updates[updates.length - 1]
}

const findCase = (sessions, caseNumber) => {
  const allCases = [];

  sessions.forEach(session => {
    session.blocks.forEach(block => {
      allCases.push(...block.cases)
    })
  })

  return allCases.find(selectedCase => selectedCase.caseNumber === caseNumber)
}

const findSession = (sessions, caseNumber) => {
  const hasCaseInSession = session => session.blocks.find(block => hasCaseInBlock(block))
  const hasCaseInBlock = block => block.cases.find(aCase =>  !(aCase.caseNumber === caseNumber))

  return sessions.find(session => hasCaseInSession(session))
}

const noteForCase = (selectedCase, selectedSession) => {
  const template = hbs.compile('Person {{name}} is due to appear at {{{courtName}}} on {{dateOfHearing}} for offences of {{offences}}. Please can this information be returned by 9.30 am on the day of the Court appearance in order to advise the Court of the offender\'s progress and potentially assist in imposing a new sentence at the same hearing. Please update this entry with your responses to the below:　\n' +
    'Details of:\n' +
    '1. Number of appointments offered/attended: (please include both overall appts and specific RAR days completed)\n' +
    '2. General compliance: (General engagement level with appts/ Sentence plan and other Services i.e. substance misuse, mental health, UPW etc? Have they completed any programmes/ SDPs – if so feedback?; Are there further sentence plan targets/ RAR interventions outstanding and dates when these may begin/ be completed? Any additional/ specific issues known to OM at present?)\n' +
    '3. Does the new offence(s) result in potential Recall action (if applicable) and has a discussion with SPO/TM/ACO occurred? If so, outcome?\n' +
    '4. Risk information: (Inc. level of risk and who to? Any specific risk issues? Does the new offence result in potential risk escalation?)\n' +
    '5. Sentencing ideas: Please make a suggestion towards a potential proposal i.e. RAR, DRR, ATR, UPW, Curfew, adjournment for Mental Health Assessment etc. Please also provide clear information on any requirements which are NOT suitable and reasons for this.\n' +
    '\n' +
    '\n')
  return template({
    name: selectedCase.defendant.name,
    courtName: selectedSession.courtName,
    dateOfHearing: selectedSession.dateOfHearing,
    offences: selectedCase.offences.map(offence => offence.title).join(', ')
  })

}

module.exports = router;
