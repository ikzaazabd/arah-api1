const handlers = require('./handlers');

module.exports = [
    {
        method: 'GET',
        path: '/api/data',
        handler: handlers.getAll
    },
    {
        method: 'GET',
        path: '/api/data/{id}',
        handler: handlers.getById
    },
    {
        method: 'POST',
        path: '/api/data',
        handler: handlers.create
    },
    {
        method: 'PUT',
        path: '/api/data/{id}',
        handler: handlers.update
    },
    {
        method: 'DELETE',
        path: '/api/data/{id}',
        handler: handlers.delete
    }
];