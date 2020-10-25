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

const handler = async (req, _res) => {
	const { id } = req.params;
	const path = req.url.replace(`/${id}`, '');
	if(sockets[id]){
		return new Promise((resolve, reject) => {
			sockets[id].once('reply', (data) => resolve(data));
			sockets[id].emit('request', { path });
			setTimeout(() => reject({ err: 'timeout' }), 5000);
		});
	}else
		return { err: 'no client found' };
};

fastify.get('/:id', handler);                                                      
fastify.get('/:id/*', handler);                                                      

const start = async () => {
  try {
		await fastify.listen(3000);
		io.listen(3001);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();