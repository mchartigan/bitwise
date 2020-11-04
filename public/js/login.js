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
          $("#login-modal").modal('hide');
        } else {
          // Force new user to fill out username
          return db.collection("users").doc(UID).set({
            profileImageURL: "https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551",
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

const inlineStyle = {
  modal : {
    position: 'relative',
    textAlign: 'center',
  }
};

class Login extends React.Component {
  render() {
    return (
      <div className="active ui tiny modal" style={inlineStyle.modal}>
        <div className="content">
          <div id="firebaseui-auth-container"></div>
          <div id="loader">Loading Google Authentication Widget...</div>
        </div>
        <div className="actions">
          <a className='ui fluid violet cancel button'>Continue Without Signing In</a>
        </div>
      </div>
    )
  }

  componentDidMount() {
    console.log('mounted');
    // The start method will wait until the DOM is loaded.
    ui.start('#firebaseui-auth-container', uiConfig);
    $('#login-modal').modal({
      onVisible: function () {
        console.log('visible');
      },
      onApprove: function () {
        console.log('approved');
      }
    }).modal('attach events', '#login-button', 'show');
  }
}

function completeSignOut() {
  firebase.auth().signOut();
  window.location.reload();
}

console.log('trying to load');
ReactDOM.render(<Login/>, document.querySelector("#login-modal"));