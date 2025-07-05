// index.js

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { name, balance, rate, payment } = body;

    if (!name || balance == null || rate == null || payment == null) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields." }),
      };
    }

    const debtItem = {
      userId: "demo-user", // Replace with authenticated user ID in production
      debtId: uuidv4(),
      name,
      balance,
      rate,
      payment,
      createdAt: new Date().toISOString(),
    };

    await dynamo
      .put({
        TableName: "Debts",
        Item: debtItem,
      })
      .promise();

    return {
      statusCode: 201,
      body: JSON.stringify(debtItem),
    };
  } catch (err) {
    console.error("Error saving debt:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to save debt." }),
    };
  }
};