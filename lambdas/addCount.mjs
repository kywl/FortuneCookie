console.log('Loading function');
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const ddbClient = new DynamoDBClient({ region: "us-east-1" });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const tableName = 'fortune-table';

export const handler = async (event, context) => {
  try {
    const { id } = event;
    console.log("id: " + id);
    // Get the current item from the database using id
    const getItemParams = {
      TableName: tableName,
      Key: {
        id: id
      }
    };
    const getItemResult = await ddbDocClient.send(new GetCommand(getItemParams));
    // ignore metadata, only want the item/object
    const currentItem = getItemResult.Item;
    console.log("current Item: " + JSON.stringify(currentItem));
    
    const currentCount = currentItem.count || 0;
    console.log('current: ' + currentCount);
    const newCount = currentCount + 1;
    console.log("new: " + newCount);
    
    // Update the item in the database with the new rating
    const updateItemParams = {
      TableName: tableName,
      Key: {
        id: id,
      },
      UpdateExpression: 'SET #ct = :count',
      ExpressionAttributeValues: {
        ':count': newCount,
      },
      ExpressionAttributeNames: {
        '#ct': 'count',
      },
      ReturnValues: 'UPDATED_NEW' 
    };
    const updateResult = await ddbClient.send(new UpdateCommand(updateItemParams));
    const updatedCount = updateResult.Attributes['count'];

    return {
      statusCode: 200,
      body: `Count updated successfully. New current count: ${updatedCount}`,
    };
  } catch (error) {
    // Handle any errors that occurred during the execution
    console.error(error);
    return {
      statusCode: 500,
      body: `Error updating the count: ${JSON.stringify(error)}`,
    };
  }
};