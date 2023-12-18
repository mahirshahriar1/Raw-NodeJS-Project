// dependencies
const data = require("./data");
const http = require("http");
const https = require("https");
const { parseJSON } = require("../helpers/utilities");
const url = require("url");
const { sendTwilioSms } = require("../helpers/notifications");

// worker object - module scaffolding
const worker = {};

// lookup all the checks
worker.gatherAllChecks = () => {
  // get all the checks
  data.list("checks", (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.forEach((check) => {
        // read the check data
        data.read("checks", check, (err1, originalCheckData) => {
          if (!err1 && originalCheckData) {
            // pass the check data to the check validator
            worker.validateCheckData(parseJSON(originalCheckData));
          } else {
            console.log("Error: reading one of the check's data!");
          }
        });
      });
    } else {
      console.log("Error: Could not find any checks to process!");
    }
  });
};

// validate individual check data
worker.validateCheckData = (originalCheckData) => {
  let originalData = originalCheckData;
  if (originalCheckData && originalCheckData.id) {
    originalData.state =
      typeof originalCheckData.state === "string" &&
      ["up", "down"].indexOf(originalCheckData.state) > -1
        ? originalCheckData.state
        : "down";

    originalData.lastChecked =
      typeof originalCheckData.lastChecked === "number" &&
      originalCheckData.lastChecked > 0
        ? originalCheckData.lastChecked
        : false;

    // pass the data to the next process
    worker.performCheck(originalData);
  } else {
    console.log("Error: check was invalid or not properly formatted!");
  }
};

// perform the check
worker.performCheck = (originalCheckData) => {
  // prepare the initial check outcome
  let checkOutcome = {
    error: false,
    responseCode: false,
  };
  // mark that the outcome has not been sent yet
  let outcomeSent = false;

  // parse the hostname and the full url from the original check data
  const parsedUrl = url.parse(
    `${originalCheckData.protocol}://${originalCheckData.url}`,
    true
  );
  const hostName = parsedUrl.hostname;
  const path = parsedUrl.path; // using path and not "pathname" because we want the query string

  // construct the request
  const requestDetails = {
    protocol: `${originalCheckData.protocol}:`,
    hostname: hostName,
    method: originalCheckData.method.toUpperCase(),
    path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  };

  const methodToUse = originalCheckData.protocol === "http" ? http : https;

  let req = methodToUse.request(requestDetails, (res) => {
    // grab the status of the sent request
    const status = res.statusCode;
    // console.log(status);

    // update the check outcome and pass to the next process
    checkOutcome.responseCode = status;
    // console.log(checkOutcome);
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on("error", (e) => {
    checkOutcome = {
      error: true,
      value: e,
    };
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on("timeout", () => {
    checkOutcome = {
      error: true,
      value: "timeout",
    };
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.end();
};

// process the check outcome and update the check data as needed and trigger an alert to the user if needed
worker.processCheckOutcome = (originalCheckData, checkOutcome) => {
  // decide if the check is up or down
  let state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1
      ? "up"
      : "down";
  // console.log( state);

  // decide whether an alert is needed or not
  let alertWanted =
    originalCheckData.lastChecked && originalCheckData.state !== state
      ? true
      : false;

  // update the check data
  let newCheckData = originalCheckData;

  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  // update the check data to the disk
  data.update("checks", newCheckData.id, newCheckData, (err) => {
    if (!err) {
      // send the new check data to the next phase
      if (alertWanted) {
        worker.alertUserToStatusChange(newCheckData);
      } else {
        console.log("Check outcome has not changed, no alert needed!");
      }
    } else {
      console.log("Error: trying to save updates to one of the checks!");
    }
  });
};

// alert the user as to a change in their check status
worker.alertUserToStatusChange = (newCheckData) => {
  let msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${
    newCheckData.protocol
  }://${newCheckData.url} is currently ${newCheckData.state}`;
  console.log(msg);

  // sendTwilioSms(newCheckData.userPhone, msg, (err) => {
  //     if(!err) {
  //         console.log(`Success: User was alerted to a status change in their check, via sms: ${msg}`);
  //     } else {
  //         console.log('Error: could not send sms alert to user who had a state change in their check!');
  //     }
  // });
};

// timer to execute the worker-process once per minute
worker.loop = () => {
  setInterval(() => {
    worker.gatherAllChecks();
  }, 5000);
};

// start the workers
worker.init = () => {
  // execute all the checks
  worker.gatherAllChecks();

  // call the loop so that the checks will execute later on
  worker.loop();
};

// export module
module.exports = worker;
