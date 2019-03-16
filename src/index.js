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
const {OAuth2Client} = require("google-auth-library")
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const express = require('express');
const cookieParser = require('cookie-parser')();
const cors = require('cors')({origin: true});
const app = express();

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = async (req, res, next) => {
  console.log('Check if request is authorized with Firebase ID token');

  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
      !(req.cookies && req.cookies.__session)) {
    console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
        'Make sure you authorize your request by providing the following HTTP header:',
        'Authorization: Bearer <Firebase ID Token>',
        'or by passing a "__session" cookie.');
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else if(req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send('Unauthorized');
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    console.log('ID Token correctly decoded', decodedIdToken);
    req.user = decodedIdToken;
    
    next();
    return;
  } catch (error) {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized');
    return;
  }
};

app.use(cors);
app.use(cookieParser);
//app.use(validateFirebaseIdToken);
app.post('/hello', async (req, res) => {
  var userSubject = "youyou";

  console.log("handling POST request")
  if ("id_token" in req.body) {
    console.log("response body: " + req.body["id_token"]);
  } else {
    console.log("not sure wtf this request body");
  }
  
  //var userJsonObj = JSON.parse(req.body);
  if ("id_token" in req.body) {
    var userIdToken = req.body["id_token"];
    var clientId =   "159982672511-gidtf4ujl20d8gjmhm52jecjr7uurpnj.apps.googleusercontent.com";

    const client = new OAuth2Client(clientId);
    
    async function verify() {
      const ticket = await client.verifyIdToken({
          idToken: userIdToken,
          audience: clientId  // Specify the CLIENT_ID of the app that accesses the backend
          // Or, if multiple clients access the backend:
          //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
          
      });
      const payload = ticket.getPayload();
      console.log("setting usersubject to: " + userSubject);
      // If request specified a G Suite domain:
      const hostedDomain = payload['hd'];
      const userid = payload['email'];
      console.log("sub claim: " + userid)
      if ("email" in payload) {
        userSubject = payload["email"];
        console.log("name: " + userSubject);
      }else{
        userSubject = "youyou"
      }
      console.log("user gsuite domain: " + hostedDomain)
      return payload;
    }
    var payload;
    try {
      payload = await verify();
    } catch (e) {
      console.error(e);
    }
    var hosteddomain = payload["hd"]
    var email = payload["email"];
    var jsonresponse = {responsetext: email};
    console.log("users domain was: " + hosteddomain);
    console.log("sending json: ", jsonresponse);
    res.send(jsonresponse);
  } else {
    console.log("missing tokenid data")
  }
});

// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
exports.app = functions.https.onRequest(app);
functions.https.onRequest()
