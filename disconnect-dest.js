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

const main = async configFile => {
  const config = yaml.load(fs.readFileSync(configFile));

  // disconnect everyone
  const conns = await fetchConnections(config.destination);
  await disconnectConnections(config.destination, conns);
};

await main(process.argv[2]);
