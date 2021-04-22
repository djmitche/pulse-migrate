import yaml from 'js-yaml';
import fs from 'fs';
import got from 'got';
import PQueue from 'p-queue';

const fetchConnections = async ({ host, username, password }) => {
  const res = await got(`https://${host}/api/connections`, { username, password, responseType: 'json' });
  return res.body;
};

const disconnectConnections = async ({ host, username, password }, conns) => {
  for (const conn of conns) {
    if (conn.type === 'direct') {
      // ignore direct (shovel) connections
      continue;
    }

    console.log(`disconnecting ${conn.name} (${conn.user})`);
    await got.delete(`https://${host}/api/connections/${encodeURIComponent(conn.name)}`, { username, password });
  }
}

const fetchQueues = async ({ host, username, password }) => {
  const res = await got(`https://${host}/api/queues`, { username, password, responseType: 'json' });
  return res.body;
};

const deleteQueues = async ({ host, username, password }, queues) => {
  const pq = new PQueue({ concurrency: 16 });
  await Promise.all(queues
    // don't delete the logstream!
    .filter(({ name }) => name !== 'logstream')
    .map(queue => pq.add(async () => {
      console.log(`deleting queue ${queue.name} in vhost ${queue.vhost}`);
      await got.delete(`https://${host}/api/queues/${encodeURIComponent(queue.vhost)}/${encodeURIComponent(queue.name)}`, { username, password });
    })));
};

const fetchExchanges = async ({ host, username, password }) => {
  const res = await got(`https://${host}/api/exchanges`, { username, password, responseType: 'json' });
  return res.body;
};

const deleteExchanges = async ({ host, username, password }, exchanges) => {
  const pq = new PQueue({ concurrency: 16 });
  await Promise.all(exchanges
    // don't delete the built-in exchanges
    .filter(({ name }) => name.length > 0 && !name.startsWith('amq.'))
    // or the 'web' exchange that seems to be associated with the admin user
    .filter(({ name }) => name !== 'web')
    .map(exchange => pq.add(async () => {
      console.log(`deleting exchange ${exchange.name} in vhost ${exchange.vhost}`);
      await got.delete(`https://${host}/api/exchanges/${encodeURIComponent(exchange.vhost)}/${encodeURIComponent(exchange.name)}`, { username, password });
    })));
};

const fetchUsers = async ({ host, username, password }) => {
  const res = await got(`https://${host}/api/users`, { username, password, responseType: 'json' });
  return res.body;
};

const deleteUsers = async ({ host, username, password }, users) => {
  const pq = new PQueue({ concurrency: 16 });
  await Promise.all(users
    // don't delete the admin user
    .filter(({ name }) => name !== username)
    .map(user => pq.add(async () => {
      console.log(`deleting user ${user.name}`);
      await got.delete(`https://${host}/api/users/${encodeURIComponent(user.name)}`, { username, password });
    })));
};

const fetchVhosts = async ({ host, username, password }) => {
  const res = await got(`https://${host}/api/vhosts`, { username, password, responseType: 'json' });
  return res.body;
};

const deleteVhosts = async ({ host, username, password }, vhosts) => {
  const pq = new PQueue({ concurrency: 16 });
  await Promise.all(vhosts
    // don't delete the / vhost
    .filter(({ name }) => name !== '/')
    // don't delete the admin vhost
    .filter(({ name }) => name !== username)
    .map(vhost => pq.add(async () => {
      console.log(`deleting vhost ${vhost.name}`);
      await got.delete(`https://${host}/api/vhosts/${encodeURIComponent(vhost.name)}`, { username, password });
    })));
};

const main = async configFile => {
  const config = yaml.load(fs.readFileSync(configFile));
  delete config.source; // just to be sure this isn't accidentally modified!

  // first disconnect everyone
  const conns = await fetchConnections(config.destination);
  await disconnectConnections(config.destination, conns);

  // then delete everything, in dependency order
  const queues = await fetchQueues(config.destination);
  await deleteQueues(config.destination, queues);

  const exchanges = await fetchExchanges(config.destination);
  await deleteExchanges(config.destination, exchanges);

  const users = await fetchUsers(config.destination);
  await deleteUsers(config.destination, users);

  const vhosts = await fetchVhosts(config.destination);
  await deleteVhosts(config.destination, vhosts);
};

await main(process.argv[2]);
