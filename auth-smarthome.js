"use strict";

const express = require("express");
const util = require("util");

function registerAuthEndpoints(expressApp) {
    expressApp.use('/login', express.static('./web/login.html'));
    expressApp.post('/login',async (req, res) => {
        console.log("post login");
        console.log(req.body);
        const { username, password ,uid } = req.body;
        console.log('/login ', username, password);
        // Here, you should validate the user account.

        let user = await Db.user.getById(1);
        console.log('logging in ');
        console.log(user);
        if (!user) {
          console.log('not a user', user);
          return res.redirect(util.format(
              '%s?client_id=%s&redirect_uri=%s&state=%s&response_type=code',
              '/frontend', req.body.client_id,
              encodeURIComponent(req.body.redirect_uri), req.body.state));
        }

        let creden = await Db.credential.getByUserId(1);
        
        req.session.user = user;

        // Successful logins should send the user back to /oauth/.
        let path = decodeURIComponent(req.body.redirect) || '/frontend';

        console.log('login successful ', user.email);
        let authCode = creden.token;

        if (creden) {
          console.log('authCode successful ', authCode);
          return res.redirect(util.format('%s?code=%s&state=%s',
            decodeURIComponent(req.body.redirect_uri), authCode, req.body.state));
        } else {
          console.log('authCode failed');
          return res.redirect(util.format(
              '%s?client_id=%s&redirect_uri=%s&state=%s&response_type=code',
              path, req.body.client_id, encodeURIComponent(req.body.redirect_uri),
              req.body.state));
        }
    });
    expressApp.get('/fakeauth',async (req, res) =>  {
        console.log("fakeauth");
        console.log(req);
        // const responseurl = util.format('%s?code=%s&state=%s', 
        //     decodeURIComponent(req.query.redirect_uri), 'xxxxxx', req.query.state);
        // console.log(responseurl);
        // return res.redirect(responseurl);

        let clientId = req.query.client_id;
        let redirectUri = req.query.redirect_uri;
        let state = req.query.state;
        let responseType = req.query.response_type;
        let authCode = req.query.code;
        console.log("authCode");
        console.log(authCode);
        if ('code' != responseType) {
          return res.status(500)
            .send('response_type ' + responseType + ' must equal "code"');
        }

        // if (!authstore.clients[clientId]) {
        //   return res.status(500).send('client_id ' + clientId + ' invalid');
        // }

        // // if you have an authcode use that
        if (authCode) {
          return res.redirect(util.format('%s?code=%s&state=%s',
            redirectUri, authCode, state
          ));
        }

        let user = req.session ? req.session.user : null;
        console.log("user");
        console.log(user);
        // Redirect anonymous users to login page.
        if (!user) {
          return res.redirect(util.format(
              '/frontend/login.html?client_id=%s&redirect_uri=%s&redirect=%s&state=%s',
              clientId, encodeURIComponent(redirectUri), req.path, state));
        }

        console.log('login successful ', user.name);
        //authCode = yield generateAuthCode(user.uid, clientId);

        if (authCode) {
          console.log('authCode successful ', authCode);
          return res.redirect(util.format('%s?code=%s&state=%s',
            redirectUri, authCode, state));
        }

        return res.status(400).send('something went wrong');
    });
    expressApp.all('/faketoken',async (req, res) => {
        console.log("faketoken");
        console.log(req.body);
        const grantType = req.query.grant_type
            ? req.query.grant_type : req.body.grant_type;
        const secondsInDay = 86400; // 60 * 60 * 24
        const HTTP_STATUS_OK = 200;
        console.log(`Grant type ${grantType}`);
        if (grantType === 'authorization_code') {
            return handleAuthCode(req, res);
            // return req.body.code;
        }
        else if (grantType === 'refresh_token') {
            return handleRefreshToken(req, res);
        }else {
          console.error('grant_type ' + grantType + ' is not supported');
          return res.status(400)
              .send('grant_type ' + grantType + ' is not supported');
        }
        // console.log('/token query', req.query);
        // console.log('/token body', req.body);
        // let clientId = getClientValue('client_id', req);
        // let clientSecret = getClientValue('client_secret', req);
        // let grantType = req.query.grant_type
        //     ? req.query.grant_type : req.body.grant_type;

        // if (!clientId || !clientSecret) {
        //   console.error('missing required parameter');
        //   return res.status(400).send('missing required parameter');
        // }

        // let client = SmartHomeModel.getClient(clientId, clientSecret);
        // console.log('client', client);
        // if (!client) {
        //   console.error('incorrect client data');
        //   return res.status(400).send('incorrect client data');
        // }

        // if ('authorization_code' == grantType) {
        //   return handleAuthCode(req, res);
        // } else if ('refresh_token' == grantType) {
        //   return handleRefreshToken(req, res);
        // } else {
        //   console.error('grant_type ' + grantType + ' is not supported');
        //   return res.status(400)
        //       .send('grant_type ' + grantType + ' is not supported');
        // }
    });
}
exports.registerAuthEndpoints = registerAuthEndpoints;

async function getUser(headers) {
	const authorization = headers.authorization;
    const accessToken = "authorization_test";
    return accessToken;

}
exports.getUser = getUser;

// function registerAuthEndpoints(expressApp) {
//     return __awaiter(this, void 0, void 0, function* () {
//         expressApp.use('/login', express.static('./frontend/login.html'));
//         expressApp.post('/login', (req, res) => __awaiter(this, void 0, void 0, function* () {
//             console.log("post login");
//             console.log(req.body);
//             const { username, password ,uid } = req.body;
//             console.log('/login ', username, password);
//             // Here, you should validate the user account.
//             // In this sample, we do not do that.
//             // return res.redirect(util.format('%s?client_id=%s&redirect_uri=%s&state=%s&response_type=code', 
//             //     '/frontend', req.body.client_id, encodeURIComponent(req.body.redirect_uri), req.body.state));
//             // console.log('/login ', req.body);
//             let user = yield Firestore.getUserById(req.body.uid);
//             console.log('logging in ');
//             console.log(user);
//             if (!user) {
//               console.log('not a user', user);
//               return res.redirect(util.format(
//                   '%s?client_id=%s&redirect_uri=%s&state=%s&response_type=code',
//                   '/frontend', req.body.client_id,
//                   encodeURIComponent(req.body.redirect_uri), req.body.state));
//             }

            
//             req.session.user = user;

//             // Successful logins should send the user back to /oauth/.
//             let path = decodeURIComponent(req.body.redirect) || '/frontend';

//             console.log('login successful ', user.username);
//             let authCode = yield generateAuthCode(req.body.uid,
//                 req.body.client_id);

//             if (authCode) {
//               console.log('authCode successful ', authCode);
//               return res.redirect(util.format('%s?code=%s&state=%s',
//                 decodeURIComponent(req.body.redirect_uri), authCode, req.body.state));
//             } else {
//               console.log('authCode failed');
//               return res.redirect(util.format(
//                   '%s?client_id=%s&redirect_uri=%s&state=%s&response_type=code',
//                   path, req.body.client_id, encodeURIComponent(req.body.redirect_uri),
//                   req.body.state));
//             }
//         }));
//         expressApp.get('/fakeauth', (req, res) => __awaiter(this, void 0, void 0, function* () {
//             console.log("fakeauth");
            
//             // const responseurl = util.format('%s?code=%s&state=%s', 
//             //     decodeURIComponent(req.query.redirect_uri), 'xxxxxx', req.query.state);
//             // console.log(responseurl);
//             // return res.redirect(responseurl);

//             let clientId = req.query.client_id;
//             let redirectUri = req.query.redirect_uri;
//             let state = req.query.state;
//             let responseType = req.query.response_type;
//             let authCode = req.query.code;
//             console.log("authCode");
//             console.log(authCode);
//             if ('code' != responseType) {
//               return res.status(500)
//                 .send('response_type ' + responseType + ' must equal "code"');
//             }

//             // if (!authstore.clients[clientId]) {
//             //   return res.status(500).send('client_id ' + clientId + ' invalid');
//             // }

//             // // if you have an authcode use that
//             if (authCode) {
//               return res.redirect(util.format('%s?code=%s&state=%s',
//                 redirectUri, authCode, state
//               ));
//             }

//             let user = req.session ? req.session.user : null;
//             console.log("user");
//             console.log(user);
//             // Redirect anonymous users to login page.
//             if (!user) {
//               return res.redirect(util.format(
//                   '/frontend/login.html?client_id=%s&redirect_uri=%s&redirect=%s&state=%s',
//                   clientId, encodeURIComponent(redirectUri), req.path, state));
//             }

//             console.log('login successful ', user.name);
//             //authCode = yield generateAuthCode(user.uid, clientId);

//             if (authCode) {
//               console.log('authCode successful ', authCode);
//               return res.redirect(util.format('%s?code=%s&state=%s',
//                 redirectUri, authCode, state));
//             }

//             return res.status(400).send('something went wrong');
//         }));
//         expressApp.all('/faketoken', (req, res) => __awaiter(this, void 0, void 0, function* () {
//             console.log("faketoken");
//             console.log(req.body);
//             const grantType = req.query.grant_type
//                 ? req.query.grant_type : req.body.grant_type;
//             const secondsInDay = 86400; // 60 * 60 * 24
//             const HTTP_STATUS_OK = 200;
//             console.log(`Grant type ${grantType}`);
//             if (grantType === 'authorization_code') {
//                 return handleAuthCode(req, res);
//                 // return req.body.code;
//             }
//             else if (grantType === 'refresh_token') {
//                 return handleRefreshToken(req, res);
//             }else {
//               console.error('grant_type ' + grantType + ' is not supported');
//               return res.status(400)
//                   .send('grant_type ' + grantType + ' is not supported');
//             }
//             // console.log('/token query', req.query);
//             // console.log('/token body', req.body);
//             // let clientId = getClientValue('client_id', req);
//             // let clientSecret = getClientValue('client_secret', req);
//             // let grantType = req.query.grant_type
//             //     ? req.query.grant_type : req.body.grant_type;

//             // if (!clientId || !clientSecret) {
//             //   console.error('missing required parameter');
//             //   return res.status(400).send('missing required parameter');
//             // }

//             // let client = SmartHomeModel.getClient(clientId, clientSecret);
//             // console.log('client', client);
//             // if (!client) {
//             //   console.error('incorrect client data');
//             //   return res.status(400).send('incorrect client data');
//             // }

//             // if ('authorization_code' == grantType) {
//             //   return handleAuthCode(req, res);
//             // } else if ('refresh_token' == grantType) {
//             //   return handleRefreshToken(req, res);
//             // } else {
//             //   console.error('grant_type ' + grantType + ' is not supported');
//             //   return res.status(400)
//             //       .send('grant_type ' + grantType + ' is not supported');
//             // }
//         }));
//     });
// }
// exports.registerAuthEndpoints = registerAuthEndpoints;
// //# sourceMappingURL=auth-provider.js.map

// function genRandomString() {
//   return Math.floor(Math.random() *
//       10000000000000000000000000000000000000000).toString(36);
// }
// exports.genRandomString = genRandomString;
// function generateAuthCode(uid, clientId) {
//     return __awaiter(this, void 0, void 0, function* () {
//       let authCode = genRandomString();
//       yield Firestore.updateAuthCode(uid,authCode);
//       return authCode;
//   });
// };

// function handleAuthCode(req, res) {
//     return __awaiter(this, void 0, void 0, function* () {
//       console.log('handleAuthCode', req.query);
//       // let clientId = getClientValue('client_id', req);
//       // let clientSecret = getClientValue('client_secret', req);
//       let code = req.query.code ? req.query.code : req.body.code;

//       // let client = SmartHomeModel.getClient(clientId, clientSecret);

//       if (!code) {
//         console.error('missing required parameter');
//         return res.status(400).send('missing required parameter');
//       }
//       // if (!client) {
//       //   console.error('invalid client id or secret %s, %s',
//       //       clientId, clientSecret);
//       //   return res.status(400).send('invalid client id or secret');
//       // }

//       let authCode = yield Firestore.getAuthCode();
//       if (!authCode) {
//         console.error('invalid code');
//         return res.status(400).send('invalid code');
//       }
      
//       // if (new Date(authCode.expiresAt) < Date.now()) {
//       //   console.error('expired code');
//       //   return res.status(400).send('expired code');
//       // }
//       // if (authCode.clientId != clientId) {
//       //   console.error('invalid code - wrong client', authCode);
//       //   return res.status(400).send('invalid code - wrong client');
//       // }

//       let token = authCode;
//       if (!token) {
//         console.error('unable to generate a token', token);
//         return res.status(400).send('unable to generate a token');
//       }

//       console.log('respond success', code);
//       return res.status(200).json({
//         access_token: code,
//       });
//   });
// }

// /**
//  * @return {{}}
//  * {
//  *   token_type: "bearer",
//  *   access_token: "ACCESS_TOKEN",
//  * }
//  */
// function handleRefreshToken(req, res) {
//   let clientId = getClientValue('client_id', req);
//   let clientSecret = getClientValue('client_secret', req);
//   let refreshToken = req.query.refresh_token
//       ? req.query.refresh_token : req.body.refresh_token;

//   let client = SmartHomeModel.getClient(clientId, clientSecret);
//   if (!client) {
//     console.error('invalid client id or secret %s, %s',
//         clientId, clientSecret);
//     return res.status(500).send('invalid client id or secret');
//   }

//   if (!refreshToken) {
//     console.error('missing required parameter');
//     return res.status(500).send('missing required parameter');
//   }

//   res.status(200).json({
//     token_type: 'bearer',
//     access_token: refreshToken,
//   });
// }