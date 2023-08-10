console.log('Loading function');

import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const ddbClient = new DynamoDBClient({ region: "us-east-1" });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event) => {
  // Accessing the 'id' value from the query string parameters
  const item_id = event.queryStringParameters.id;
  var num_id = parseInt(item_id);
  const tableName = 'fortune-table';

  try {
    // Get the item from the DynamoDB table
    const params = {
      TableName: tableName,
      Key: { id: num_id }
    };

    const data = await ddbDocClient.send(new GetCommand(params));

    // Check if the item was found
    if (data.Item) {
      const rating = data.Item.rating;
      console.log("rating: " + rating);
      return {
        statusCode: 200,
        body: JSON.stringify({ rating: rating }),
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow requests from any origin (), change it to your specific origin in production
          "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
          "Access-Control-Allow-Methods": "GET, OPTIONS" // Add any other allowed methods
        }
      };
    } else {
      console.log("item not found");
      return {
        statusCode: 404,
        body: 'Item not found',
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow requests from any origin (), change it to your specific origin in production
          "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
          "Access-Control-Allow-Methods": "GET, OPTIONS" // Add any other allowed methods
        }
      };
    }
} catch (error) {
    console.log(error.message);
    return {
      statusCode: 500,
      body: JSON.stringify(error.message),
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow requests from any origin (), change it to your specific origin in production
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
        "Access-Control-Allow-Methods": "GET, OPTIONS" // Add any other allowed methods
      }
    };
  }
};
