const express = require("express");
const fs = require("fs");
const path = require("path");
const { body, param, validationResult } = require('express-validator');

const ticketAPIs = express.Router();
const dataFilePath = path.join(__dirname, "../../data.json");

// Utility function to read data from the file
const readData = () => {
    try {
        const data = fs.readFileSync(dataFilePath, { encoding: "utf8", flag: "r" });
        return JSON.parse(data);
    } catch (error) {
        throw new Error('Error reading data from file');
    }
};

// Utility function to write data to the file
const writeData = (data) => {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), { encoding: "utf8", flag: "w" });
    } catch (error) {
        throw new Error('Error writing data to file');
    }
};

// Validation middleware to check for required fields, non-empty strings, and prevent unexpected fields
const validateTicketData = [
    body('title').trim().notEmpty().withMessage('Title is required and cannot be empty'),
    body('description').trim().notEmpty().withMessage('Description is required and cannot be empty'),
    body('team').trim().notEmpty().withMessage('Team is required and cannot be empty'),
    body('status').trim().notEmpty().withMessage('Status is required and cannot be empty'),
    body('assignee').trim().notEmpty().withMessage('Assignee is required and cannot be empty'),
    body('reporter').trim().notEmpty().withMessage('Reporter is required and cannot be empty'),
    body().custom(body => {
        const allowedFields = ['title', 'description', 'team', 'status', 'assignee', 'reporter', 'id'];
        const invalidFields = Object.keys(body).filter(field => !allowedFields.includes(field));

        if (invalidFields.length > 0) {
            throw new Error(`Invalid fields: ${invalidFields.join(', ')}`);
        }
        return true;
    })
];

ticketAPIs.get('/', (req, res) => {
    try {
        const data = readData();
        res.json(data.tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

ticketAPIs.post('/',
    validateTicketData,
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const data = readData();
            const newTicket = req.body;
            newTicket.id = data.tickets.length ? data.tickets[data.tickets.length - 1].id + 1 : 1;
            data.tickets.push(newTicket);
            writeData(data);
            res.status(201).json(newTicket);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

ticketAPIs.put('/:ticketId',
    param('ticketId').isInt().withMessage('Ticket ID must be an integer'),
    validateTicketData,
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const data = readData();
            const ticketId = parseInt(req.params.ticketId, 10);
            const index = data.tickets.findIndex(ticket => ticket.id === ticketId);

            if (index !== -1) {
                data.tickets[index] = { ...data.tickets[index], ...req.body };
                writeData(data);
                res.json(data.tickets[index]);
            } else {
                res.status(404).json({ message: "Ticket not found" });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

ticketAPIs.delete('/:ticketId',
    param('ticketId').isInt().withMessage('Ticket ID must be an integer'),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const data = readData();
            const ticketId = parseInt(req.params.ticketId, 10);
            const index = data.tickets.findIndex(ticket => ticket.id === ticketId);

            if (index !== -1) {
                const deletedTicket = data.tickets.splice(index, 1);
                writeData(data);
                res.json(deletedTicket[0]);
            } else {
                res.status(404).json({ message: "Ticket not found" });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

module.exports = ticketAPIs;
