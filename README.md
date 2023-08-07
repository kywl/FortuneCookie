# Fortune Cookie Generator

This is the code for my 2023 Solutions Architect internship at AWS. An AWS-hosted, full stack, serverless web application with user and session management.

The virtual fortune cookie experience – producing fortunes without the cookie

**Project Description**\
As part of developing customer hands-on exercizes for Immersion Days and 
Workshops, create a fun and interactive platform that showcases several core 
AWS services.  We will be building a virtual fortune cookie platform.  Users will 
be able to interact with a fortune application that provides them with fortunes 
and then allows them to rate them.  The platform will highlight AWS data 
capabilities along with severless capabilities


## Services Used
- Amazon DynamoDb
- Amazon Cognito
- AWS Lambda
- Amazon API Gateway
- AWS Amplify


### Amazon DynamoDb
**Schema**\
Name: fortune-table\
Partion key: id\
Attributes: id*, count, fortune, num_ratings, rating, ratings**\
count, num_ratings, rating will all be initialized to 0 upon table creation\
*The fortune id's have values of [100, 122] if you want to add more fortunes or change the id format, be sure to modify the getRandomFortuneLambda\
**ratings attribute is an array that keeps track of users and the numerical rating they submitted for that fortune. The addRating Lambda will create this attribute if it does not exist/the fortune has not been rated yet

Example JSON Item (DynamoDb JSON Format)
```json
{
 "id": {
  "N": "100"
 },
 "count": {
  "N": "30"
 },
 "fortune": {
  "S": "The rocks are listening."
 },
 "num_ratings": {
  "N": "1"
 },
 "rating": {
  "N": "5"
 },
 "ratings": {
  "L": [
   {
    "M": {
     "rating": {
      "N": "5"
     },
     "userId": {
      "S": "kylow@amazon.com"
     }
    }
   }
  ]
 }
}
```

**Fortunes Used**
1. The rocks are listening.
2. Life is short, smile while you still have teeth.
3. The fortune you seek is in another cookie.
4. You will find money in an old jacket pocket. Unfortunately, it will be in a currency that no longer exists.
5. Beware of the garden gnomes. They are skilled in espionage.
6. A talking squirrel will offer you investment advice. Consider it carefully, but remember that nuts aren't a reliable currency.
7. You will discover the true meaning of life while searching for the TV remote. It was under the couch all along.
8. Your mid-life crisis is just around the corner.
9. Your parallel parking skills will reach legendary status.
10. You will develop a sudden fascination with talking plants. Prepare for philsophical conversations with the sidewalk dandelions.
11. An exciting opportunity awaits you in the form of a tedious, long meeting that could've been an email.
12. A mysterious package will arrive at your doorstep. Inside, you will find the missing socks that have been vanishing from your laundry for years.
13. Your lunch will mysteriously disappear from the office fridge.
14. Help! I am being held prisoner in a fortune cookie factory.
15. Prepare for an epic dance battle against the sock-stealing goblin that lives in your attic.
16. The fortune you seek is in another cookie.
17. You will be hungry again in one hour.
18. A golden egg of opportunity falls into your lap this month.
19. You will hit every red light tomorrow.
20. What’s that in your eye? Oh…it’s a sparkle.
21. I see a burger king crown in your future. You deserve it.
22. If you dress as a tangerine for an entire week something good will come your way (trust)
23. lucky numbers 13 76 54 23

### Amazon Cognito
Cognito user pool sign-in options: User name\
Any password requirements
No MFA
Enabled self account recovery and self registration

**Cognito-assisted verification and confirmation**\
Enabled: Send email message, verify email address\
Two Options
1. Your account will need to be [pulled out of the Amazon SES sandbox](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html) 
to send a verification code via Amazon SES to all users.
2. [Pre Sign-up Trigger](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html#aws-lambda-triggers-pre-registration-example-2)
Auto-confirm and auto-verify all users\
<mark>This project uses option #2</mark>
 

Configure Message delivery with Amazon SES (First verify an email with Amazon SES)\
User pool name: FortuneCookie\
Did not use the Cognito Hosted UI\
App type:
- Public Client
- Name: FortuneCookieWebApp
- Don't generate a client secret


### AWS Lambda
5 Main Lambdas + 1 bonus
1. **getFortune**: gets a fortune from the database, the random part is handled on the front end code
2. **addCount**: every time a fortune is successfully requested and displayed, it increments the total count
3. **getCount**: pulls current count (number of time the fortune has been requested) and displays to user
4. **addRating**: takes user's rating and calculates a new average. If this is the user's first time rating the fortune, their username + rating is added to an array (ratings), else their rating is updates in the existing index
5. **getRating**: pulls the average rating for that fortune and displays to user
6. **autoVerifyConfirm**: (OPTIONAL) pre sign-up trigger mentioned earlier

Test payloads for the GET methods
```json
{
  "httpMethod:": "GET",
  "queryStringParameters": {
    "id": 120
  }
}
```

Test payload for addCount
```json
{
  "id": 1
}
```

Test payload for addRating
```json
{
  "id": 100,
  "rating": 5,
  "userId": "kylow@amazon.com"
}
```


**AWS IAM**
Role I attached to all the lambdas (very general)
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1428341300017",
            "Action": [
                "dynamodb:DeleteItem",
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:UpdateItem"
            ],
            "Effect": "Allow",
            "Resource": "*"
        },
        {
            "Sid": "",
            "Resource": "*",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Effect": "Allow"
        }
    ]
}
```

### Amazon API Gateway
REST API\
3 Resources
- /count: **GET** getCount, **POST** addCount
- /rating: **GET** getRating, **POST** addRating
- /request: **GET** getFortune

For the GET methods: 
- under Integration Request > check box for Use Lambda Proxy integration
- To test: id={number} in the queryStringParameters

For the POST methods:
- Test as you would the lambdas (json payload) in the request body


### AWS Amplify
Clone the repository and connect to Amplify to host the web app


### Resources
- [Build a Serverless Web Application](https://aws.amazon.com/getting-started/hands-on/build-serverless-web-app-lambda-apigateway-s3-dynamodb-cognito/)
- [Developing a Serverless Web Application with Session & User Management on AWS](https://medium.com/swlh/developing-a-serverless-web-application-with-session-user-management-on-aws-f2d124baf0d8)