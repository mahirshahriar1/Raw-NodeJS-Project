// dependencies
const http = require("http");
const { handleReqRes } = require("./helpers/handleReqRes");
const environment = require("./helpers/environments");
const data = require("./lib/data");
// app object - module scaffolding
const app = {};

// create server
app.createServer = () => {
  const server = http.createServer(app.handleReqRes);
  server.listen(environment.port, () => {
    console.log(`Listening to port ${environment.port}`);
  });
};

// handle request response
app.handleReqRes = handleReqRes;

// start the server
app.createServer();



// {
//   "firstName": "Tamim",
//   "lastName": "Shahriar",
//   "phone": "01700000000",
//   "password": "123456",
//   "tosAgreement": true   
// }