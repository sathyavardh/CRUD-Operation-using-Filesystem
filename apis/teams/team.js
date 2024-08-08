const express = require("express");
const fs = require("fs");
const path = require("path");
const { body, param, validationResult } = require('express-validator');

const teamAPIs = express.Router();
const dataFilePath = path.join(__dirname, "../../data.json");

// Utility function to read data from the file
const readData = () => {
    const data = fs.readFileSync(dataFilePath, { encoding: "utf8", flag: "r" });
    return JSON.parse(data);
};

// Utility function to write data to the file
const writeData = (data) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), { encoding: "utf8", flag: "w" });
};

// Middleware to validate team uniqueness, team member constraints, and disallow unexpected fields
const validateTeamData = [
    body('name').trim().notEmpty().withMessage('Team name is required')
        .custom(value => {
            const data = readData();
            const isDuplicate = data.teams.some(team => team.name === value);
            if (isDuplicate) {
                throw new Error('Team name already exists');
            }
            return true;
        }),
    body('members').isArray().withMessage('Members should be an array')
        .custom(members => {
            const data = readData();
            const allMembers = data.teams.flatMap(team => team.members);
            const duplicateMembers = members.filter(member => allMembers.includes(member));

            if (duplicateMembers.length > 0) {
                throw new Error(`Members ${duplicateMembers.join(', ')} are already in other teams`);
            }

            const invalidMembers = members.filter(member => !member.trim());
            if (invalidMembers.length > 0) {
                throw new Error('All members must be non-empty strings');
            }

            return true;
        }),
    body().custom(body => {
        const allowedFields = ['name', 'members', 'id'];
        const invalidFields = Object.keys(body).filter(field => !allowedFields.includes(field));

        if (invalidFields.length > 0) {
            throw new Error(`Invalid fields: ${invalidFields.join(', ')}`);
        }
        return true;
    })
];

teamAPIs.get('/', (req, res) => {
    const data = readData();
    res.json(data.teams);
});

teamAPIs.post('/',
    validateTeamData,
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const data = readData();
        const newTeam = req.body;
        newTeam.id = data.teams.length ? data.teams[data.teams.length - 1].id + 1 : 1; // Generate a simple unique ID
        data.teams.push(newTeam);
        writeData(data);
        res.status(201).json(newTeam);
    }
);

teamAPIs.put('/:teamId',
    param('teamId').isInt().withMessage('Team ID must be an integer'),
    body('name').optional().notEmpty().withMessage('Team name is required if provided')
        .custom(value => {
            const data = readData();
            const isDuplicate = data.teams.some(team => team.name === value);
            if (isDuplicate) {
                throw new Error('Team name already exists');
            }
            return true;
        }),
    body('members').optional().isArray().withMessage('Members should be an array')
        .custom(members => {
            const data = readData();
            const allMembers = data.teams.flatMap(team => team.members);
            const duplicateMembers = members.filter(member => allMembers.includes(member));
            if (duplicateMembers.length > 0) {
                throw new Error(`Members ${duplicateMembers.join(', ')} are already in other teams`);
            }

            const invalidMembers = members.filter(member => !member.trim());
            if (invalidMembers.length > 0) {
                throw new Error('All members must be non-empty strings');
            }

            return true;
        }),
    body().custom(body => {
        const allowedFields = ['name', 'members', 'id'];
        const invalidFields = Object.keys(body).filter(field => !allowedFields.includes(field));

        if (invalidFields.length > 0) {
            throw new Error(`Invalid fields: ${invalidFields.join(', ')}`);
        }
        return true;
    }),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const data = readData();
        const teamId = parseInt(req.params.teamId, 10);
        const index = data.teams.findIndex(team => team.id === teamId);

        if (index !== -1) {
            data.teams[index] = { ...data.teams[index], ...req.body };
            writeData(data);
            res.json(data.teams[index]);
        } else {
            res.status(404).json({ message: "Team not found" });
        }
    }
);

teamAPIs.delete('/:teamId',
    param('teamId').isInt().withMessage('Team ID must be an integer'),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const data = readData();
        const teamId = parseInt(req.params.teamId, 10);
        const index = data.teams.findIndex(team => team.id === teamId);

        if (index !== -1) {
            const deletedTeam = data.teams.splice(index, 1);
            writeData(data);
            res.json(deletedTeam[0]);
        } else {
            res.status(404).json({ message: "Team not found" });
        }
    }
);

module.exports = teamAPIs;
