import amqp from 'amqplib';
import yaml from 'js-yaml';
import fs from 'fs';

const main = async configFile => {
  const config = yaml.load(fs.readFileSync(configFile));
  const { host, username, password, vhost, queues } = config.listen;
  const url = `amqps://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}/${encodeURIComponent(vhost)}`;

  const conn = await amqp.connect(url);
  const chan = await conn.createChannel();

  for (const { name, bindings } of queues) {
    await chan.assertQueue(name, { autoDelete: true });
    for (const { exchange, routingKeyPattern } of bindings) {
      await chan.bindQueue(name, exchange, routingKeyPattern);
    }
    await chan.consume(name, msg => {
      console.log(msg.content.toString('utf-8'))
    }, { noAck: true });
  }
};

main(process.argv[2]).then(
  () => {},
  err => {
    console.log(err);
    process.exit(1);
  }
);
