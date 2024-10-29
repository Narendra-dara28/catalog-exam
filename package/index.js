const express = require("express");
const bodyParser = require("body-parser");
const bigInt = require("big-integer");
const morgan = require("morgan");

const server = express();
const SERVER_PORT = 3000;

server.use(bodyParser.json());
server.use(morgan("dev"));


function convertBaseToDecimal(inputBase, encodedString) {
    return encodedString.split('').reverse().reduce((total, digit, position) => {
        return total.add(
            bigInt(digit, 10).multiply(
                bigInt(inputBase).pow(position)
            )
        );
    }, bigInt(0));
}


function calculatePolynomialConstant(coordinates) {
    const numPoints = coordinates.length;
    let result = bigInt(0);

    for (let i = 0; i < numPoints; i++) {
        let currentX = coordinates[i][0];
        let currentY = coordinates[i][1];
        
        let coefficient = bigInt(1);
        
        for (let j = 0; j < numPoints; j++) {
            if (i !== j) {
                coefficient = coefficient
                    .multiply(bigInt(0).subtract(bigInt(coordinates[j][0])))
                    .divide(bigInt(currentX).subtract(bigInt(coordinates[j][0])));
            }
        }
        
        result = result.add(coefficient.multiply(currentY));
    }
    
    return result;
}


server.post("/computeSecret", (req, res) => {
    try {
        const { threshold, ...pointData } = req.body;
        const { n, k } = threshold;

        const coordinates = [];
        
        for (const pointKey in pointData) {
            const { base, value } = pointData[pointKey];
            const xCoord = parseInt(pointKey);
            const yCoord = convertBaseToDecimal(parseInt(base), value);
            coordinates.push([xCoord, yCoord]);
        }

        const secretValue = calculatePolynomialConstant(
            coordinates.slice(0, k)
        );

        res.json({
            secret: Math.abs(secretValue).toString()
        }).status(200);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

server.get("/", (req, res) => {
    res.status(200).send("Secret Sharing API");
});

server.listen(SERVER_PORT, () => {
    console.log(`Server running at http://localhost:${SERVER_PORT}`);
});