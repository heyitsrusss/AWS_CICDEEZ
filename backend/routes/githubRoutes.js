const express = require('express');
const githubController = require('../controllers/githubController.js');
const databaseController = require('../controllers/databaseController.js');

const router = express.Router();

// Handle GET requests to '/api/github/saveRuns' endpoint
router.get(
  '/saveRuns',
  githubController.refreshToken,
  githubController.getRunIds,
  githubController.getJobs,
  databaseController.saveJobs,
  (req, res) => {
    return res.status(200).json(res.locals.jobs);
  },
);

module.exports = router;
