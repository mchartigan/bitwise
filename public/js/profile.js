// DOM elements
const loginButton = document.querySelector('#login-button');
const profile = document.querySelector('#profile-data');
const followButton = document.querySelector('#follow-button');
let endlessObj = new endless();
const pagename = window.location.href.split('/')[4];
var UID = null;
var viewUID;
var storage = firebase.storage();
var storageRef = storage.ref();
var docRef = null;
var followState = null;


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
            loadFollowButton();

            following = [viewUID];
            endlessObj.init(following);
        });
    });
}

function loadFollowButton() {
    // IN PROGRESS

    if (UID == viewUID) {
        $('#follow-button').hide()
    } else {
        $('#follow-button').attr('class','ui fluid inverted red button');

        db.collection('users').doc(UID).get().then(doc => {
            var loc = doc.data().followingUsers.indexOf(viewUID);
            if (loc > -1) {
                // they are currently following
                followState = true;
                $('#follow-button').text("Unfollow")
            } else {
                followState = false;
                $('#follow-button').text("Follow")
            }
            $('#follow-button').show();
            //$('#follow-button').attr("onClick", changeFollowState());
        });
    }
}

function changeFollowState() {
    // check current user follow list
    console.log("changing state");
    db.collection('users').doc(UID).get().then(doc => {
        var loc = doc.data().followingUsers.indexOf(viewUID);
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

    loadFollowButton();
}


firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        UID = user.uid;
        docRef = db.collection("users").doc(UID);

        $("#login-button").hide();
        $("#user-dropdown").show();

        loadDropdown();
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
