// checking logged in/anonymous user state
/* global _config */
/* global AWS */
/* global AmazonCognitoIdentity */

var poolData = { // Cognito user pool data
    UserPoolId: _config.cognito.userPoolId,
    ClientId: _config.cognito.userPoolClientId
};
var userPool, authToken, username;
userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
AWS.config.region = _config.cognito.region;

// Go check with Cognito if there is a user currently logged in here
authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
    var cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) { // if a user, get the username
        if (cognitoUser.username) {
            username = cognitoUser.username;
        }
        // get the session token
        cognitoUser.getSession(function sessionCallback(err, session) {
            if (err) { // there is some kind of error
                reject(err);
            }
            else if (!session.isValid()) { // invalid session
                resolve(null);
            }
            else {
                console.log('there is a session!');
                resolve(session.getIdToken().getJwtToken());
                console.log('got token!');
            }
        });
    }
    else { // If there is no user logged in here
        resolve(null);
    }
});
// Run the above check and then:
authToken.then(function setAuthToken(token) {
    if (token) { // If we got a token => there is a user logged in
        alert('You are already logged in! You must logout before accessing this page.')
        window.location.assign('./index.html')
    }
}).catch(function handleTokenError(error) {
    alert(error);
    window.location.assign('./index.html');
});
