const fastify = require('fastify')({ logger: true }),
	io = require('socket.io')({pingInterval: 2000, pingTimeout: 5000});

const sockets = {};

io.on('connection', (client) => {
	sockets[client.id] = client;
	console.log(`${client.id}: new connection`);
	client.on('disconnect', () => {
		delete sockets[client.id];
		console.log(`${client.id}: disconnected`);
	});
});

const handler = async (req, res) => {
	const { id } = req.params;
	const path = req.url.replace(`/${id}`, '');
	if(sockets[id]){
		const result = await new Promise((resolve, reject) => {
			sockets[id].once('reply', resolve);
			sockets[id].once('error', reject);
			sockets[id].emit('request', { path, method: req.method, body: req.body, headers: req.headers });
			setTimeout(() => reject({ err: 'timeout' }), 10000);
		});
		res.status(result.status).headers(result.headers).send(result.body);
	}else
		return { err: 'no client found' };
};

fastify.all('/:id', handler);                                                      
fastify.all('/:id/*', handler);                                                      

const start = async () => {
  try {
		await fastify.listen(5000);
		io.listen(5001);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();