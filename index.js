const express = require('express');
const bodyParser = require('body-parser');

const ticketAPIs = require('./apis/tickets/ticket');
const teamAPIs = require('./apis/teams/team');
const userAPIs = require('./apis/users/user');

const app = express();

// Middleware
app.use(bodyParser.json());

// Use routers
app.use('/tickets', ticketAPIs);
app.use('/teams', teamAPIs);
app.use('/users', userAPIs);


app.listen(4000, (error) => {
    if (error) {
        console.log('Server Start Failed');
    } else {
        console.log('Server started at port 4000');
    }
});

