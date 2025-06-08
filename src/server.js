const Hapi = require('@hapi/hapi');
const routes = require('./routes');

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT || 9000,
        host: '0.0.0.0',
        routes: {
            cors: {
                origin: process.env.NODE_ENV === 'production'
                    ? ['https://arah-api1.vercel.app']  // Replace with your Vercel deployment URL
                    : ['http://localhost:8080']
            }
        }
    });

    server.route(routes);

    await server.start();
    console.log('Server berjalan di %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();
