const AWS = require('aws-sdk'); // No path, just 'aws-sdk'
const dynamo = new AWS.DynamoDB.DocumentClient();


exports.handler = async (event) => {
  try {
    const userId = event.queryStringParameters?.userId || "demo-user"; // TEMP: Replace after auth

    const result = await dynamo.query({
      TableName: "Debts",
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": userId
      }
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items)
    };
  } catch (err) {
    console.error("Error fetching debts:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch debts." })
    };
  }
};