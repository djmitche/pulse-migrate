const yaml = require('js-yaml');
const fs = require('fs');
const got = require('got');

const fetchDefs = async ({ host, username, password }) => {
  const res = await got(`https://${host}/api/definitions`, { username, password, responseType: 'json' });
  return res.body;
};

const transformDefs = ({ users, vhosts, permissions, parameters, policies, queues, exchanges, bindings }, transform) => {
  const res = {};
  const allowedUsers = new Set(transform.users);
  const allowedVhosts = new Set(transform.vhosts);

  // users
  // -- copy all users
  res.users = users;

  // vhosts
  // -- drop vhosts other than those in allow list
  res.vhosts = vhosts.filter(({ name }) => allowedVhosts.has(name));

  // permissions
  res.permissions = permissions.filter(({ vhost }) => allowedVhosts.has(vhost));

  // parameters

  // policies
  // -- all policies are created by CloudAMQP / RabbitMQ and need not be transferred
  res.policies = [];

  // queues
  res.queues = queues.filter(({ vhost }) => allowedVhosts.has(vhost));

  // exchanges
  res.exchanges = exchanges.filter(({ vhost }) => allowedVhosts.has(vhost));

  // bindings
  res.bindings = bindings.filter(({ vhost }) => allowedVhosts.has(vhost));

  return res;
};

const main = async configFile => {
  const config = yaml.load(fs.readFileSync(configFile));

  const sourceDefs = await fetchDefs(config.source);
  const destDefs = transformDefs(sourceDefs, config.transform);
  console.log(destDefs);
};

main(process.argv[2]).then(
  () => process.exit(0),
  err => {
    console.log(err);
    process.exit(1);
  }
);
