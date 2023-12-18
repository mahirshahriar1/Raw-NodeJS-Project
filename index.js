// dependencies
const server = require('./lib/server');
const workers = require('./lib/worker');

// app object - module scaffolding
const app = {};

app.init = () => {
    // start the server
    server.init();

    // start the workers
    workers.init();
};

app.init();

module.exports = app;


// {
//   "firstName": "Tamim",
//   "lastName": "Shahriar",
//   "phone": "01700000000",
//   "password": "123456",
//   "tosAgreement": true   
// }