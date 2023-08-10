console.log('Loading function');

import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const ddbClient = new DynamoDBClient({ region: "us-east-1" });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const tableName = 'fortune-table';

export const handler = async (event, context) => {
  try {
    // fortune id, user rating, user's username
    //const { id, rating: userRating, userId } = event.queryStringParameters;
    const { id, rating: userRating, userId } = event
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
    console.log('current item: ' + JSON.stringify(currentItem));
    
    // Check if the user has already rated the fortune
    const userRatingItem = currentItem?.ratings?.find(item => item.userId === userId);
    if (userRatingItem) {
      console.log('updating rating...');
      
      // User has already submitted a rating, update the user's existing rating
      const currentRating = currentItem.rating || 0;
      const numRatings = currentItem.num_ratings || 0;
      console.log('Current avg rating: ' + currentRating);
      console.log('Current number of ratings: ' + numRatings);
      
      // calculate new average (formula is correct)
      const totalRatingSum = currentRating * numRatings;
      const updatedRating = ( totalRatingSum - userRatingItem.rating + Number(userRating)) / numRatings;
      console.log('New avg: ' + updatedRating);
      
      // Don't update total number of rating because the average will be wrong, just update the rating attribute
      // And the rating item in the ratings array
      userRatingItem.rating = Number(userRating);
      
      // Update the item in the database with the new rating
      const updateItemParams = {
        TableName: tableName,
        Key: {
          id: id,
        },
        UpdateExpression: 'SET #rt = :rating, #ra = :ratingsAttr',
        ExpressionAttributeValues: {
          ':rating': updatedRating,
          ':ratingsAttr': currentItem.ratings,
        },
        ExpressionAttributeNames: {
          '#rt': 'rating',
          '#ra': 'ratings'
        }
      };
      await ddbClient.send(new UpdateCommand(updateItemParams));
      return {
        statusCode: 200,
        body: `Rating updated successfully. Previously ${currentRating.toFixed(2)} New average rating: ${updatedRating.toFixed(2)}`,
      };
    } else { // User is submitting a rating for the first time
      console.log("Submitting new rating...");
      const newRating = Number(userRating);
      // The current rating/number of rating is either 0 (doesn't exist) or from the current item's attribute
      const currentRating = currentItem.rating || 0;
      const numRatings = currentItem.num_ratings || 0;
      
      console.log("new: " + newRating + " " + "current: " + currentRating);    
      // Get average rating
      const updatedRating = (currentRating * numRatings + userRating) / (numRatings + 1);
      const newNumRatings = numRatings + 1; // Increment # of ratings
      
      console.log("updated avg: " + updatedRating + " " + "new # of ratings: " + newNumRatings);
      
      // Create a new ratings array with the user's rating + username (userId)
      console.log("attempting to add new element to ratings arr");
      const ratings = currentItem.ratings ? currentItem.ratings : [];
      ratings.push({
        userId: userId,
        rating: newRating
      });
      // Save the new item, ratingItem in the database
      const ratingItem = {
        id: id,
        count: currentItem.count, // Preserve the existing count
        fortune: currentItem.fortune, // Preserve the existing fortune
        rating: updatedRating,
        num_ratings: newNumRatings,
        ratings: ratings
      };
      // add the ratingItem to the db
      const putItemParams = {
        TableName: tableName,
        Item: ratingItem
      };
      await ddbDocClient.send(new PutCommand(putItemParams));
      return {
        statusCode: 200,
        body: `Rating submitted successfully. Previously ${currentRating.toFixed(2)}  New Average rating: ${updatedRating.toFixed(2)}`,
      };
    }
  } catch (error) {
    // Handle any errors that occurred during the execution
    console.log('Could not submit rating');
    console.error(error);
    return {
      statusCode: 500,
      body: `Error updating the rating: ${JSON.stringify(error)}`,
    };
  }
};