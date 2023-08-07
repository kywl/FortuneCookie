/* global _config */
/* global AWS */
/* global AmazonCognitoIdentity */

//import fetch from "node-fetch";

var poolData = { // Cognito user pool data
    UserPoolId: _config.cognito.userPoolId,
    ClientId: _config.cognito.userPoolClientId
};
var userPool, authToken, username;
userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
AWS.config.region = _config.cognito.region;
// sign the user out and reload to homepage
function signOut() {
    userPool.getCurrentUser().signOut();
    window.location.reload()
}
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
            else { // user logged in
                resolve(session.getIdToken().getJwtToken());
            }
        });
    }
    else { // If there is no user logged in here
        resolve(null);
    }
});
// Run the above check and then:
authToken.then(function setAuthToken(token) {
    console.log("logged in as " + username);
    if (token) { // If we got a token => there is a user logged in
        setTimeout(() => { // Give the document time to load
            // change the login button to be a logout button using function changeLoginBtn
            changeLoginBtn();
            // disable the register button
            document.getElementById('signupBtn').classList.add('disabled');
            // The default is that you have to be logged in to rate the fortune
            document.getElementById('rateBtn').onclick = (event) => { event.preventDefault(); };
            document.getElementById('signupBtn').onclick = (event) => { alert('You are currently logged in \nIf you want to register another account, please log out'); };
            // on mouse hover it will say you are currently logged in
            document.getElementById('signupBtn').setAttribute("data-toggle", "tooltip");
            document.getElementById('signupBtn').setAttribute("title", "You are currently logged in!");
            // this is for the banner in the nav bar to indicate if a user is current logged in
            document.getElementById('greeting').textContent = 'Logged in as ' + username;

            // enable rating button. currently this is the only extra functionality that logged in users have
            document.getElementById('rateBtn').classList.remove('disabled');
            document.getElementById("rateBtn").addEventListener("click", displayModal);
        });
    }
}).catch(function handleTokenError(error) {
    // on error. tell the user and then redirect to login page
    alert(error);
    window.location.assign('./login.html');
});

// change the login button to a logout button. onclick it will sign user out
function changeLoginBtn() {
    var loginBtn = document.getElementById('loginBtn')
    loginBtn.textContent = 'Logout'
    var icon = document.createElement('i')
    icon.classList.add('fas', 'fa-sign-out-alt')
    loginBtn.appendChild(icon)
    loginBtn.onclick = (event) => {
        event.preventDefault();
        loginBtn.outerHTML = '<a id="loginBtn" href="./login.html">Login <i class="fas fa-sign-in-alt"></i></a>'
        signOut();
    }
}

let fortuneId = null;
let responseRecieved = false;
let typingTimeout; // Variable to store the timeout for the current typewriter effect

function generateFortuneId() {
    let random_id = Math.floor(Math.random() * (122 - 100 + 1)) + 100;
    console.log("id: " + random_id);
    getFortune(random_id);
}

// function for calling getFortune lambda through api gateway
function getFortune(id) {
    const url = _config.api.invokeUrl + '/request?id=' + id;
    // console.log("this is the url for getting the current fortune: " + url);
    // Clear the current typewriter effect and stop any ongoing typing
    clearTimeout(typingTimeout);
    // make the API request
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Getting current fortune...');
            // process response data
            console.log(data);
            // output data to textbox id = display-count
            console.log('Displaying random fortune');
            // output data to textbox id = response
            const responseText = document.getElementById("response");
            // formats response to only return fortune and not entire metadata
            const fortuneText = JSON.stringify(data.fortune);
            console.log(fortuneText);

            // Start the typewriter effect text
            responseText.value = "";
            typeWriterEffect(fortuneText, responseText);
            fortuneId = id;
            console.log('fortuneid: ' + fortuneId);
            // save successful response to pass to submitRating function. Need a fortune before you can rate it
            responseRecieved = true;
            // Increment count and display avg rating
            addCount(fortuneId);
            getRating(fortuneId);
        })
        .catch(error => {
            console.log('Could not get fortune');
            console.error(error);
        });
}

// button makes api call when the button is clicked
document.getElementById("requestButton").addEventListener("click", generateFortuneId);

// function that makes the api call to increment the count whenever a fortune is requested.
function addCount(fortuneId) {
    const payload = {
        id: fortuneId
    };

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    };
    const url = _config.api.invokeUrl + '/count';
    // make the api request
    fetch(url, requestOptions)
        .then(response => response.json())
        .then(data => {
            console.log('Incrementing count');
            console.log(data);
            getCount(fortuneId);
        })
        .catch(error => {
            console.log('Error incrementing count');
            console.log('Error: ', error);
        });
}

// function for calling getCount lambda through api gateway
function getCount(fortuneId) {
    //const params = new URLSearchParams( {id: fortuneId });
    const url = _config.api.invokeUrl + '/count?id=' + fortuneId;
    // console.log("this is the url for getting the current count: " + url);

    // make the API request
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Getting current count...');
            // process response data
            console.log(data);
            // output data to textbox id = display-count
            console.log('Displaying current count');
            const countBox = document.getElementById("count-box");
            countBox.textContent = data.count;
        })
        .catch(error => {
            console.log('Could not get count');
            console.error(error);
        });
}

// This function displays the rating modal when the rate button is clicked
function displayModal() {
    var modal;
    if (responseRecieved) { // can't rate a fortune without generating one first
        // Display modal
        modal = document.getElementById('popup-modal');
        modal.style.display = "block";

        // Various ways users can exit modal: click off window, press esc, close button, submit rating
        window.onclick = function(event) { // click off window closes the popup
            modal = document.getElementById('popup-modal');
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
        document.onkeydown = function(evt) { // press esc key closes the popup
            var modal = document.getElementById('popup-modal');
            if (event.key === "Escape") {
                modal.style.display = "none";
            }
        }
        // click close button closes the popup
        modal = document.getElementById('popup-modal');
        modal.addEventListener('click', function(event) {
            if (event.target.classList.contains('close-button')) {
                modal.style.display = "none";
            }
        });
        // Submit rating button
        document.getElementById('submitRating').onclick = function() {
            submitRating(modal, fortuneId, username);
        };
    }
    else { // Fortune hasn't been generated yet
        alert("You must generate a fortune before you can give a rating");
    }
}

// Function to make api call to submit a rating
function submitRating(modal, fortuneId, username) {
    const url = _config.api.invokeUrl + '/rating';
    //get input + check for input
    const selectedRatingElement = document.querySelector('input[name="rating"]:checked');
    if (selectedRatingElement) { // There is a rating to submit
        // selectedRating is a String -> Num
        const selectedRating = Number(selectedRatingElement.value);
        console.log('Seclected rating: ', selectedRating);

        const payload = {
            id: fortuneId,
            rating: selectedRating,
            userId: username
        };
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        };

        fetch(url, requestOptions)
            .then(response => response.json())
            .then(data => {
                //getRating(fortuneId);
                console.log(data);
                console.log('Submitted rating: ' + selectedRating);
                getRating(fortuneId);
            })
            .catch(error => {
                console.log('Could not submit rating');
                console.log('Error: ', error);
            });
    }
    else { // no rating to submit
        alert('Please select a rating');
        return;
    }
    modal.style.display = "none";
}

// function for calling getRating lambda through api gateway
function getRating(fortuneId) {
    //const params = new URLSearchParams( {id: fortuneId });
    const url = _config.api.invokeUrl + '/rating?id=' + fortuneId;
    // console.log("this is the url for getting the avg rating: " + url);

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Getting avg rating...');
            // process response data
            console.log(data);
            // output data to textbox id = rate-box
            console.log("Displaying avg rating")
            const rateBox = document.getElementById("rate-box");
            rateBox.textContent = data.rating.toFixed(2);
            displayRatingStars(data.rating);
        })
        .catch(error => {
            // handle errors
            console.log('Could not get avg rating');
            console.error(error);
        });
}

function typeWriterEffect(text, element) {
    let i = 0;
    const speed = 25; // low number = faster typing

    function typeNextLetter() {
        if (i < text.length) {
            element.value += text.charAt(i);
            i++;
            typingTimeout = setTimeout(typeNextLetter, speed);
        }
    }
    // Start typing
    typeNextLetter();
}

/* displays the rating stars based on the rating of the fortune*/
function displayRatingStars(rating) {
    const ratingDisplay = document.getElementById('ratingDisplay');
    ratingDisplay.innerHTML = '';

    const roundedRating = Math.round(rating);

    for (let i = 0; i < roundedRating; i++) {
        const star = document.createElement('span');
        star.classList.add('star', 'yellow-star');
        star.innerHTML = '&#9733;';
        ratingDisplay.appendChild(star);
    }

    const emptyStars = 5 - roundedRating;
    for (let i = 0; i < emptyStars; i++) {
        const star = document.createElement('span');
        star.classList.add('star', 'empty-star');
        star.innerHTML = '&#9733;';
        ratingDisplay.appendChild(star);
    }
}
