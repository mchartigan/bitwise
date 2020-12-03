var UID = null;
var dark = " ";
var accent = " violet ";

// ========================================== Header ========================================== \\

function Header() {
    return (
        <div className={"ui fixed" + accent + "inverted compact grid menu"}>
            <a className="item" href="/index.html">
                <img className="logo" alt="Bitwise Logo" src="https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/assets%2Flogo.png?alt=media&token=1498c5a1-3b43-436c-bed0-d764d91fe3e5"></img>
                    &nbsp;&nbsp;
                    <div id="site-logo-text"></div>
            </a>

            <a className="right item" id="login-button" tabIndex="0" onClick={modalToggle} onKeyDown={modalToggle}>
                <div id="login-button-text"></div>
            </a>

            <div className={"ui simple" + dark + "dropdown right item"} id="user-dropdown" style={{ display: "none" }}>
                <img id="profile-icon" alt="Profile Icon" style={{ textIndent: "-9999px" }}></img>
                    &nbsp;&nbsp;
                    <div id="account-dropdown-text"></div>

                <i className="dropdown icon"></i>
                <div className="menu">
                    <a className="item" href="/user/" id="user-own-profile">
                        <i className={accent + "user circle icon"}></i>
                            Profile
                        </a>

                    <a className="item" href="/common/account.html">
                        <i className={accent + "cogs icon"}></i>
                            Settings
                        </a>

                    <a className="item" onClick={completeSignOut} onKeyDown={completeSignOut} tabIndex="0">
                        <i className="red sign out alternate icon"></i>
                        <span className="ui small red header">
                            Sign Out
                            </span>
                    </a>
                </div>
            </div>

            <div id="login-modal"></div>
        </div>
    )
}

function refreshHeader() {
    //$('.ui.dropdown').dropdown();

    if (UID) {
        // Load dropdown
        db.collection("users").doc(UID).get().then(function (doc) {
            ReactDOM.render(<Header />, document.getElementById("header"));
            scrambleLoad($("#site-logo-text"), "Bitwise", 80, 10);
            $("#login-button").hide();
            $("#user-dropdown").show();

            $('#user-own-profile').attr('href', '/user/' + doc.data().username);
            scrambleLoad($("#account-dropdown-text"), doc.data().username, 50, 6).then(() => {
                $('#profile-icon').attr('src', doc.data().profileImageURL);
                $('#profile-icon').hide();
                $('#profile-icon').transition('swing left in', '1000ms');
            });
            // Load login modal
            ReactDOM.render(<Login key={Math.floor(Math.random() * Math.pow(10, 8))} />, document.querySelector("#login-modal"));
        });
    } else {
        ReactDOM.render(<Header />, document.getElementById("header"));
        scrambleLoad($("#site-logo-text"), "Bitwise", 80, 10);
        $("#login-button").show();
        $("#user-dropdown").hide();

        scrambleLoad($("#login-button-text"), "Log In", 80, 10);
        // Load login modal
        ReactDOM.render(<Login key={Math.floor(Math.random() * Math.pow(10, 8))} />, document.querySelector("#login-modal"));
    }
}

function loadTheme() {
    return new Promise(resolve => {
        if (UID) {
            // Load dropdown
            db.collection("users").doc(UID).get().then(function (doc) {
                dark = doc.data().dark ? " inverted " : " ";
                accent = " " + doc.data().accent + " ";
                resolve();
            });
        } else {
            dark = " ";
            accent = " violet ";
            resolve();
        }
    })
}

function scrambleLoad(el, message, delay, cycles) {
    const loadedPromise = new Promise((resolve) => {
        var codeLetters = "!&#*+%?£@§$";
        var curLength = 0;
        var fadeBuffer = [];

        for (var i = 0; i < message.length; i++) {
            fadeBuffer.push({ c: Math.floor(exponential(i, 0, 1, message.length - 1, cycles)) + 1, l: message.charAt(i) });
        }

        setTimeout(animateIn, 200);

        function generateRandomString(length) {
            var str = '';
            while (str.length < length) {
                str += codeLetters.charAt(Math.floor(Math.random() * codeLetters.length));
            }

            return str;
        }

        function animateIn() {
            if (curLength < message.length * 1.5) {
                curLength++;

                var str = generateRandomString(curLength);

                $(el).html(str);

                setTimeout(animateIn, delay);
            } else {
                animateFadeBuffer();
            }
        }

        function animateFadeBuffer() {
            var do_cycles = false;
            var str = '';

            for (var i = 0; i < fadeBuffer.length; i++) {
                var fader = fadeBuffer[i];

                if (fader.c > 0) {
                    do_cycles = true;
                    fader.c--;
                    str += codeLetters.charAt(Math.floor(Math.random() * codeLetters.length));
                } else {
                    str += fader.l;
                }
            }

            $(el).html(str);

            if (do_cycles === true) {
                setTimeout(animateFadeBuffer, delay);
            } else {
                resolve();
            }
        }

        function exponential(t, x1, y1, x2, y2) {
            var a = Math.log(y2 / y1) / (x2 - x1);
            var b = y1 / Math.pow(y2 / y1, x1 / (x2 - x1));
            return b * Math.exp(a * t);
        }
    });

    return loadedPromise;
}

// ========================================== Login/Logout ========================================== \\

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

var uiConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            // User successfully signed in.
            // Return type determines whether we continue the redirect automatically
            // or whether we leave that to developer to handle.

            UID = firebase.auth().currentUser.uid;
            $("#login-modal").modal('hide');

            db.collection("users").doc(UID).get().then(function (doc) {
                if (doc.data()) {
                    // Hide popup
                } else {
                    // Set default account information
                    db.collection("users").doc(UID).set({
                        profileImageURL: "https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551",
                        username: firebase.auth().currentUser.displayName,
                        bioText: '',
                        email: firebase.auth().currentUser.email,
                        followingTopics: [],
                        followingUsers: [],
                        postsDisliked: [],
                        postsLiked: [],
                        postsSaved: [],
                        dark: false,
                        accent: "violet"
                    }, { merge: true }).then(() => {
                        // Allow user to modify default account settings
                        location.replace("/common/account.html");
                    });
                }
            });
        },
        uiShown: function () {
            $("#google-widget-loader").hide();
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
    tosUrl: 'https://policies.google.com/terms?hl=en-US',
    // Privacy policy url.
    privacyPolicyUrl: 'https://policies.google.com/privacy?hl=en-US'
};

class Login extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="active ui tiny modal" style={{ position: 'relative', textAlign: 'center' }}>
                <div className="content">
                    <div id="firebaseui-auth-container"></div>
                    <div className="ui inline centered active slow violet double loader" id="google-widget-loader"></div>
                </div>
                <div className="actions">
                    <a className='ui fluid violet cancel button' tabIndex="0" onKeyDown={hideModal}>Continue Without Signing In</a>
                </div>
            </div>
        )
    }

    componentDidMount() {
        // The start method will wait until the DOM is loaded.
        ui.start('#firebaseui-auth-container', uiConfig);
        $('#login-modal').modal('setting', 'closable', false) //.modal('attach events', '#login-button', 'show');
    }
}

function modalToggle() {
    if (event.type != "click" && event.which != 13) {
        return false;
    }

    $('#login-modal').modal('show');
}

function hideModal() {
    if (event.type != "click" && event.which != 13) {
        return false;
    }

    $('#login-modal').modal('hide');
}

function completeSignOut() {
    if (event.type != "click" && event.which != 13) {
        return false;
    }

    firebase.auth().signOut();
    //window.location.reload();
    ReactDOM.render(<Login key={Math.floor(Math.random() * Math.pow(10, 8))} />, document.querySelector("#login-modal"));
}