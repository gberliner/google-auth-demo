/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Initializes the Demo.
function Demo() {
  document.addEventListener('DOMContentLoaded', function() {
    // Shortcuts to DOM Elements.
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://apis.google.com/js/platform.js?onload=init';
    script.onload = (e) => {
      new Promise((resolve, reject) => {
        gapi.load('auth2', () => {
          resolve()
        })
      })
      .then(() => {
          console.log('gapi: auth2 loaded', gapi.auth2)
          this.signInButton = document.getElementById('demo-sign-in-button');
          this.signOutButton = document.getElementById('demo-sign-out-button');
          this.responseContainer = document.getElementById('demo-response');
          this.responseContainerCookie = document.getElementById('demo-response-cookie');
          this.urlContainer = document.getElementById('demo-url');
          this.urlContainerCookie = document.getElementById('demo-url-cookie');
          this.helloUserUrl = window.location.href + 'hello';
          this.signedOutCard = document.getElementById('demo-signed-out-card');
          this.signedInCard = document.getElementById('demo-signed-in-card');
      
          // Bind events.
          this.signInButton.addEventListener('click', this.signIn.bind(this));
      })        
      
      // bind this to your single page app...
     
    }
    document.getElementsByTagName('head')[0].appendChild(script);
   
  }.bind(this));
}

// Initiates the sign-in flow using GoogleAuthProvider sign in in a popup.
Demo.prototype.signIn = function() {
  //firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
  gapi.auth2.authorize({
    client_id: "159982672511-gidtf4ujl20d8gjmhm52jecjr7uurpnj.apps.googleusercontent.com",
    scope: "email profile",
    response_type: "id_token permission",
    prompt: "select_account",
    include_granted_scopes: true,
  },resp => {
    if (!!resp.error) {
      console.error("Unable to get gapi authorize response");
    } else {
      this.idToken = resp.id_token;
      this.startFunctionsRequest()
      //gapi.auth2.onAuthStateChanged(this.onAuthStateChanged.bind(this));
    }
  });
};


// Does an authenticated request to a Firebase Functions endpoint using an Authorization header.
Demo.prototype.startFunctionsRequest = function() {
    const rc = this.responseContainer;
    const userUrl = this.helloUserUrl;
      const idToken = this.idToken;
      console.log('value of id token is: ' + idToken)  
      var tokenObj = {
        id_token: idToken
      };
      fetch("/hello",{
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(tokenObj)
      }).then(response => {
        return response.json();
      }).then(json => {
        rc.innerText = JSON.stringify(json);
        console.log("the response was: " + JSON.stringify(json))
      }).catch(console.error)
      .catch(error => console.error('Error:', error));;
      // req.onload = function() {
      //   this.responseContainer.innerText = req.responseText;
      // }.bind(this);
      // req.onerror = function() {
      //   this.responseContainer.innerText = 'There was an error';
      // }.bind(this);
      // req.setRequestHeader('Authorization', 'Bearer ' + token);
      // req.setRequestHeader("Content-Type","application/json")
      // req.open('POST', this.helloUserUrl, true);
      // req.send();
  }; 


// Does an authenticated request to a Firebase Functions endpoint using a __session cookie.
Demo.prototype.startFunctionsCookieRequest = function() {
  // Set the __session cookie.
  var userUrl = this.helloUserUrl;
  const rc = this.responseContainerCookie;

  firebase.auth().currentUser.getIdToken(true).then(function(token) {
    // set the __session cookie
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signIn().then(function() {
      const currentUser = auth2.currentUser.get()
      const idToken = currentUser.getAuthResponse(true).id_token
      document.cookie = '__session=' + token + ';max-age=3600';

      console.log('Sending request to', userUrl, 'with ID token in __session cookie.');
      var tokenObj = {
        id_token: idToken
      };
      console.log('value of id token is: ' + JSON.stringify(tokenObj));
      fetch("/hello",{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": 'Bearer ' + token
        },
        mode: "cors",
        body: JSON.stringify(tokenObj)
      }).then(response => {
        return response.json();
      }).then(json => {
        rc.innerText = JSON.stringify(json);
        console.log('Success:', JSON.stringify(json));
      })
      .catch(error => console.error('Error:', error));;;
    });
    // var req = new XMLHttpRequest();
    // req.onload = function() {
    //   this.responseContainerCookie.innerText = req.responseText;
    // }.bind(this);
    // req.onerror = function() {
    //   this.responseContainerCookie.innerText = 'There was an error';
    // }.bind(this);
    // req.setRequestHeader('Authorization', 'Bearer ' + token);
    // req.setRequestHeader("Content-Type","application/json")
    // req.open('POST', this.helloUserUrl, true);
    // req.send();
  }.bind(this));
}

// Load the demo.
window.demo = new Demo();
