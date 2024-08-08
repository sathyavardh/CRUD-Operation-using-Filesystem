const express = require("express");
const fs = require("fs");
const path = require("path");
const { body, param, validationResult } = require('express-validator');

const userAPIs = express.Router();
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

// Middleware to enforce allowed fields only
const enforceAllowedFields = (allowedFields) => (req, res, next) => {
    const providedFields = Object.keys(req.body);
    const invalidFields = providedFields.filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
        return res.status(400).json({ message: `Invalid fields provided: ${invalidFields.join(', ')}` });
    }

    next();
};

// GET all users
userAPIs.get('/', (req, res) => {
    try {
        const data = readData();
        res.json(data.users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST new user
userAPIs.post('/',
    enforceAllowedFields(['firstName', 'lastName', 'emailId', 'phno', 'employeeId', 'designation', 'teamId']),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('emailId').trim().isEmail().withMessage('Invalid email format')
        .matches(/@gmail\.com$/).withMessage('Email must be a Gmail address')
        .custom(value => {
            const data = readData();
            const isDuplicate = data.users.some(user => user.emailId === value);
            if (isDuplicate) {
                throw new Error('Email ID already exists');
            }
            return true;
        }),
    body('phno').trim().isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits')
        .isNumeric().withMessage('Phone number must contain only digits')
        .custom(value => {
            const data = readData();
            const isDuplicate = data.users.some(user => user.phno === value);
            if (isDuplicate) {
                throw new Error('Phone number already exists');
            }
            return true;
        }),
    body('employeeId').isInt().withMessage('Employee ID must be an integer')
        .custom(value => {
            const data = readData();
            const isDuplicate = data.users.some(user => user.employeeId === value);
            if (isDuplicate) {
                throw new Error('Employee ID already exists');
            }
            return true;
        }),
    body('designation').trim().notEmpty().withMessage('Designation is required'),
    body('teamId').isInt().withMessage('Team ID must be an integer'),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const data = readData();
            const newUser = req.body;
            newUser.id = data.users.length ? data.users[data.users.length - 1].id + 1 : 1;
            data.users.push(newUser);
            writeData(data);
            res.status(201).json(newUser);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

// PUT update user
userAPIs.put('/:userId',
    param('userId').isInt().withMessage('User ID must be an integer'),
    enforceAllowedFields(['firstName', 'lastName', 'emailId', 'phno', 'employeeId', 'designation', 'teamId']),
    body('firstName').optional().trim().notEmpty().withMessage('First name is required if provided'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name is required if provided'),
    body('emailId').optional().trim().isEmail().withMessage('Invalid email format')
        .matches(/@gmail\.com$/).withMessage('Email must be a Gmail address')
        .custom(value => {
            const data = readData();
            const isDuplicate = data.users.some(user => user.emailId === value);
            if (isDuplicate) {
                throw new Error('Email ID already exists');
            }
            return true;
        }),
    body('phno').optional().trim().isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits')
        .isNumeric().withMessage('Phone number must contain only digits')
        .custom(value => {
            const data = readData();
            const isDuplicate = data.users.some(user => user.phno === value);
            if (isDuplicate) {
                throw new Error('Phone number already exists');
            }
            return true;
        }),
    body('employeeId').optional().isInt().withMessage('Employee ID must be an integer')
        .custom(value => {
            const data = readData();
            const isDuplicate = data.users.some(user => user.employeeId === value);
            if (isDuplicate) {
                throw new Error('Employee ID already exists');
            }
            return true;
        }),
    body('designation').optional().trim().notEmpty().withMessage('Designation is required if provided'),
    body('teamId').optional().isInt().withMessage('Team ID must be an integer'),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const data = readData();
            const userId = parseInt(req.params.userId, 10);
            const index = data.users.findIndex(user => user.id === userId);

            if (index !== -1) {
                data.users[index] = { ...data.users[index], ...req.body };
                writeData(data);
                res.json(data.users[index]);
            } else {
                res.status(404).json({ message: "User not found" });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

// DELETE user
userAPIs.delete('/:userId',
    param('userId').isInt().withMessage('User ID must be an integer'),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const data = readData();
            const userId = parseInt(req.params.userId, 10);
            const index = data.users.findIndex(user => user.id === userId);

            if (index !== -1) {
                const deletedUser = data.users.splice(index, 1);
                writeData(data);
                res.json(deletedUser[0]);
            } else {
                res.status(404).json({ message: "User not found" });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

module.exports = userAPIs;
