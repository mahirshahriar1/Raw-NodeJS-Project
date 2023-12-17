// module scaffolding
const environments = {};

environments.staging = {
  port: 3000,
  envName: "staging",
  secretKey: "shdfjhsdjfhsdjfh",
};

environments.production = {
  port: 5000,
  envName: "production",
  secretKey: "shdfjhsdjfhsdjfh",
};

// determine which environment was passed
const currentEnvironment =
  typeof process.env.NODE_ENV === "string"
    ? process.env.NODE_ENV.trim()
    : "staging";

// export corresponding environment object
const environmentToExport =
  typeof environments[currentEnvironment] === "object"
    ? environments[currentEnvironment]
    : environments.staging;

// export module
module.exports = environmentToExport;
