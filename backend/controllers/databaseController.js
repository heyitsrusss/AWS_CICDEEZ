const { User } = require('../models/userModel');

const databaseController = {};

// Save user data to mongodb (create a user profile for our db)
databaseController.registerUser = async (req, res, next) => {
  console.log('* Registering a new user to mongodb...'); // CL*

  // Grab user data passed from prior middleware
  const username = res.locals.apiResponseData.login;
  const accessToken = res.locals.authResponseData.access_token;
  const refreshToken = res.locals.authResponseData.refresh_token;
  console.log('  - username pulled from res.locals: ', username);
  console.log('  - Access Token pulled from res.locals: ', accessToken);
  console.log('  - Refresh Token pulled from res.locals: ', refreshToken);

  // Handle existing profile
  const profileExists = await User.findOne({ username: username });
  if (profileExists) {
    console.log(
      '  - user already has a profile in mongodb, updating Access Token w/ Refresh Token',
    ); // CL*
    const updatedProfile = await User.findOneAndUpdate(
      { username: username },
      { refresh_token: refreshToken },
      { new: true },
    );
    // console.log(' - updated user profile: ', updatedProfile); // CL*

    return next();
  }

  // Handle creating a new profile for user
  const user = await User.create({
    username,
    refreshToken,
    runs: [],
  });
  console.log('  - new user profile added to mongodb'); // CL*

  // Pass on user profile object
  res.locals.user = user;
  return next();
};

// ---------------------------------------------------------------------------------------------------------------------

// Save all the jobs data associated w/ each workflow run in mongodb
databaseController.saveJobs = async (req, res, next) => {
  console.log('* Saving all the jobs data associated w/ each workflow run to mongodb...'); // CL*

  // Grab owner and repo from the request
  // const { owner, repo } = req.body;
  const owner = 'ptri-13-cat-snake'; // HARDCODE
  const repo = 'unit-12-testing-gha'; // HARDCODE
  console.log('  - Owner pulled from request object: ', owner);
  console.log('  - Repo pulled from request object: ', repo);

  // Grab jobs data array passed from prior middleware
  const jobsData = res.locals.jobsData;
  // console.log('  - Jobs data pulled from res.locals: ', jobsData); // CL*

  // Grab Username from cookies
  const username = req.cookies.username;
  console.log('  - Username read from cookies: ', username); // CL*

  // Iterate through jobsData and save each job obj to mongodb
  // NOTE: jobsData is an array of subarrays, where each subarray represents one workflow run.  Each workflow run subarray contains 1+ job objs (depending on how many jobs you have defined for the workflow)
  for (const runArr of jobsData) {
    for (const jobObj of runArr) {
      const {
        run_id,
        workflow_name,
        head_branch,
        run_attempt,
        status,
        conclusion,
        created_at,
        started_at,
        completed_at,
        name,
        steps,
        run_url,
        node_id,
        head_sha,
        url,
        html_url,
        check_run_url,
        labels,
        runner_id,
        runner_name,
        runner_group_id,
        runner_group_name,
      } = jobObj;

      const runData = {
        repo_owner: owner,
        repo: repo,
        run_id: run_id,
        workflow_name: workflow_name,
        head_branch: head_branch,
        run_attempt: run_attempt,
        status: status,
        conclusion: conclusion,
        created_at: created_at,
        started_at: started_at,
        completed_at: completed_at,
        name: name,
        steps: steps,
        run_url: run_url,
        node_id: node_id,
        head_sha: head_sha,
        url: url,
        html_url: html_url,
        check_run_url: check_run_url,
        labels: labels,
        runner_id: runner_id,
        runner_name: runner_name,
        runner_group_id: runner_group_id,
        runner_group_name: runner_group_name,
      };

      const existingUser = await User.findOne({
        username: username,
      });

      // Check if user exists in database
      if (existingUser) {
        console.log('  - User exists in database!');

        let runExists = false;

        for (const run of existingUser.runs) {
          // If the run.run_id = passed in run.run_id
          if (run.run_id === run_id) {
            runExists = true;
            console.log('  - Run exists in User runs array');
          }
        }

        if (!runExists) {
          await User.findOneAndUpdate(
            { username: req.cookies.username },
            { $addToSet: { runs: runData } },
          );
          console.log('  - User runs array updated!');
        }
      }
    }
  }

  return next();
};

module.exports = databaseController;
