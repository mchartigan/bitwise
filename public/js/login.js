var UID = null;
var storage = firebase.storage();
var storageRef = storage.ref();

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

var uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      // User successfully signed in.
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.

      UID = firebase.auth().currentUser.uid;
      
      db.collection("users").doc(UID).get().then(function(doc) {
        if (doc.data()) {
          // Redirect to homepage
          location.replace("/index.html");
        } else {
          // Force new user to fill out username
          return db.collection("users").doc(UID).set({
            username: firebase.auth().currentUser.displayName,
            bioText: '',
            email: firebase.auth().currentUser.email
          },{merge: true}).then(() => {
            location.replace("/common/account.html");
          });
        }
      });
    },
    uiShown: function() {
      // The widget is rendered.
      // Hide the loader.
      document.getElementById('loader').style.display = 'none';
    }
  },
  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
  signInFlow: 'popup',
  signInSuccessUrl: '/index.html',
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    firebase.auth.GoogleAuthProvider.PROVIDER_ID
  ],
  // Terms of service url.
  tosUrl: '<your-tos-url>',
  // Privacy policy url.
  privacyPolicyUrl: '<your-privacy-policy-url>'
};

// The start method will wait until the DOM is loaded.
ui.start('#firebaseui-auth-container', uiConfig);

function anonymousLogin() { location.replace('/index.html')}