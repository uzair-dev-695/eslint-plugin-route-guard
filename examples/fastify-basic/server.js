const fastify = require('fastify')();

// Valid: unique routes
fastify.get('/users', async (request, reply) => {
  return { users: [] };
});

fastify.post('/users', async (request, reply) => {
  return { id: 1 };
});

// ERROR: Duplicate GET /users route
fastify.get('/users', async (request, reply) => {
  return { duplicate: true };
});

fastify.listen({ port: 3000 });
