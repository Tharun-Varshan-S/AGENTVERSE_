const { MongoMemoryServer } = require('mongodb-memory-server');

async function start() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  console.log(uri);
}
start();
