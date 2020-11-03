// DOM elements
const loginButton = document.querySelector('#login-button');
const profile = document.querySelector('#profile-data');
const followButton = document.querySelector('#follow-button');
let endlessObj = new endless();
const pagename = window.location.href.split('/')[4];
var UID = null;
var storage = firebase.storage();
var storageRef = storage.ref();
var docRef = null;
var followState = null;

console.log("1")


// navigate to user profile page when logged in
function myProfile() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            location.replace("account.html");
        }
    });
}
  
function loadDropdown() {
    docRef.get().then(function(doc) {
        $('#profile-icon').attr('src', doc.data().profileImageURL);
        document.getElementById('account-dropdown').innerHTML = '&nbsp; ' + doc.data().username;
    });
}

function loadProfile() {
    var viewUID;
    var following;

    let tcontent = document.createElement('div');
    let uname = document.createElement('h1');
    let description = document.createElement('h2');

    db.collection('users')
    .where('username', '==', pagename)
    .get().then(querySnapshot => {
        viewUID = querySnapshot.docs[0].id;

        db.collection("users").doc(viewUID).get().then(doc => {
            $('#profile-picture').attr('src', doc.data().profileImageURL);

            tcontent.setAttribute('data-id', doc.id);
            uname.textContent = doc.data().username;
            description.textContent = doc.data().bioText;
    
            tcontent.appendChild(uname);
            tcontent.appendChild(description);
    
            profile.append(tcontent);

            following = [viewUID];
            endlessObj.init(following);
        });
    });
}

function loadFollowButton() {
    // IN PROGRESS

    $('#follow-button').attr('class','ui fluid inverted red button');

    db.collection('users').doc(UID).get().then(doc => {
        var loc = doc.followingUsers.indexOf(viewUID);
        if (loc > -1) {
            // they are currently following
            followState = true;
        } else {
            followState = false;
            followButton.show();
        }
    });
}

function changeFollowState(viewUID) {
    // check current user follow list
    db.collection('users').doc(UID).get().then(doc => {
        var loc = doc.followingUsers.indexOf(viewUID);
        if (loc > -1) {
            // they are currently following. unfollow.
            db.collection('users').doc(UID).update({
                followingUsers: firebase.firestore.FieldValue.arrayRemove(viewUID)
            });
        } else {
            db.collection('users').doc(UID).update({
                followingUsers: firebase.firestore.FieldValue.arrayUnion(viewUID)
            });
        }
    });
}


firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        UID = user.uid;
        docRef = db.collection("users").doc(UID);

        $("#login-button").hide();
        $("#user-dropdown").show();

        loadDropdown();
        loadFollowButton();
    } else {
        docRef = null;

        $("#login-button").show();
        $("#user-dropdown").hide();
    }
    loadProfile();
});

// run after page initialization
document.addEventListener('DOMContentLoaded', function () {
    // on DOM content loaded
});
