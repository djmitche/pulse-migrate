import yaml from 'js-yaml';
import fs from 'fs';
import got from 'got';

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
  res.users = users
  .map(user => ({ ...user, hashing_algorithm: 'rabbit_password_hashing_md5' }));

  // vhosts
  // -- drop vhosts other than those in allow list
  res.vhosts = vhosts.filter(({ name }) => allowedVhosts.has(name));

  // permissions
  res.permissions = permissions.filter(({ vhost }) => allowedVhosts.has(vhost));

  // parameters
  // -- parameters are output-only

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

const importDefs = async (defs, { host, username, password }) => {
  await got.post(`https://${host}/api/definitions`, { username, password, json: defs });
};

const main = async configFile => {
  const config = yaml.load(fs.readFileSync(configFile));

  const sourceDefs = await fetchDefs(config.source);
  const destDefs = transformDefs(sourceDefs, config.transform);
  await importDefs(destDefs, config.destination);
};

main(process.argv[2]).then(
  () => process.exit(0),
  err => {
    console.log(err);
    process.exit(1);
  }
);
