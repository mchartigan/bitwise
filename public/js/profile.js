// DOM elements
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

function loadProfile(userDoc) {
    $('#profile-picture').attr('src', userDoc.data().profileImageURL);

    $('#profile-username').html(userDoc.data().username);
    $('#profile-bio').html(userDoc.data().bioText);

    var following = [viewUID];
    endlessObj.init(following);
}

function loadFollowButton() {
    if (UID == null || UID == viewUID) {
        $('#follow-button').hide();
        followState = false;
    } else {
        //  onclick="changeFollowState()"
        db.collection('users').doc(UID).get().then(doc => {
            var loc = doc.data().followingUsers.indexOf(viewUID);

            if (followState == null) {
                $('#follow-button').attr('onclick', "changeFollowState()");
                $('#follow-button').show();
            }

            if (loc > -1) {
                // they are currently following
                followState = true;
                ReactDOM.render(<div><i className="user minus icon"></i>Unfollow</div>, document.querySelector('#follow-button'));
            } else {
                followState = false;
                ReactDOM.render(<div><i className="user plus icon"></i>Follow</div>, document.querySelector('#follow-button'));
            }
        });
    }
}

function changeFollowState() {
    // check current user follow list
    console.log("changing state");
    if (followState) {
        // they are currently following. unfollow.
        followState = false;
        db.collection('users').doc(UID).update({
            followingUsers: firebase.firestore.FieldValue.arrayRemove(viewUID)
        });
    } else {
        followState = true;
        db.collection('users').doc(UID).update({
            followingUsers: firebase.firestore.FieldValue.arrayUnion(viewUID)
        });
    }
    loadFollowButton();
}


// Initialize dynamic tab groups
$('.menu .item').tab();

firebase.auth().onAuthStateChanged(function (user) {
    db.collection('users')
        .where('username', '==', pagename)
        .get().then(querySnapshot => {
            let userDoc = querySnapshot.docs[0];

            viewUID = userDoc.id;

            loadProfile(userDoc);

            if (user) {
                UID = user.uid;
                docRef = db.collection("users").doc(UID);
        
                $("#login-button").hide();
                $("#user-dropdown").show();
        
                loadDropdown();
        
                $("#following-tab").show();
                $("#interactions-tab").show();
                $('#refresh-tab').show();

                loadFollowedUsers(userDoc);
                loadFollowedTopics(userDoc);
                loadSavedPosts(userDoc);
                loadLikedPosts(userDoc);
                loadDislikedPosts(userDoc);
            } else {
                docRef = null;
        
                $("#login-button").show();
                $("#user-dropdown").hide();
        
                $("#following-tab").hide();
                $("#interactions-tab").hide();
                $('#refresh-tab').hide();
            }

            loadFollowButton();
        });
});

function refreshTabs() {
    $('#refresh-button').hide();
    $('#refresh-loader').show();

    db.collection('users').doc(viewUID).get().then((userDoc) => {
        loadFollowedUsers(userDoc);
        loadFollowedTopics(userDoc);
        loadSavedPosts(userDoc);
        loadLikedPosts(userDoc);
        loadDislikedPosts(userDoc);

        $('#refresh-button').show();
        $('#refresh-loader').hide();
    });
}

function loadFollowedUsers(userDoc) {
    if (userDoc.data().followingUsers.length == 0) {
        // Display error message
        ReactDOM.render(<div className="ui red message">No Followed Users Found!</div>, document.querySelector('#followed-users-container'));
    } else {
        var users = [];

        // Reverse loop through each user to add formatted JSX element to list
        userDoc.data().followingUsers.slice().reverse().forEach(userID => {
            users.push( <div className="item" key={userID}>
                            <a className="ui small violet header">{userID}</a>
                        </div>);
        });

        // Followed users container
        ReactDOM.render(<div className="ui relaxed divided list">
                            {users}
                        </div>,
                        document.querySelector('#followed-users-container'));
    }
}

function loadFollowedTopics(userDoc) {
    if (userDoc.data().followingTopics.length == 0) {
        // Display error message
        ReactDOM.render(<div className="ui red message">No Followed Topics Found!</div>, document.querySelector('#followed-topics-container'));
    } else {
        var topics = [];

        // Reverse loop through each topic to add formatted JSX element to list
        userDoc.data().followingTopics.slice().reverse().forEach(userID => {
            topics.push( <div className="item" key={userID}>
                            <a className="ui small violet header">{userID}</a>
                        </div>);
        });

        // Followed topics container
        ReactDOM.render(<div className="ui relaxed divided list">
                            {topics}
                        </div>,
                        document.querySelector('#followed-topics-container'));
    }
}

function loadSavedPosts(userDoc) {
    if (userDoc.data().postsSaved.length == 0) {
        // Display error message
        ReactDOM.render(<div className="ui red message">No Saved Posts Found!</div>, document.querySelector('#saved-posts-container'));
    } else {
        var posts = [];
        var first = true;

        // Reverse loop through each post to add formatted JSX element to list
        userDoc.data().postsSaved.slice().reverse().forEach(postID => {
            const postProps = {
                postID: postID,
                type: "post",
                divider: !first
            };

            posts.push(<Post {...postProps} key={Math.random()}/>);

            first = false;
        });

        // Saved posts container
        ReactDOM.render(<div className="ui threaded comments">
                            {posts}
                        </div>,
                        document.querySelector('#saved-posts-container'));
    }
}

function loadLikedPosts(userDoc) {
    if (userDoc.data().postsLiked.length == 0) {
        // Display error message
        ReactDOM.render(<div className="ui red message">No Liked Posts Found!</div>, document.querySelector('#liked-posts-container'));
    } else {
        var posts = [];
        var first = true;

        // Reverse loop through each post to add formatted JSX element to list
        userDoc.data().postsLiked.slice().reverse().forEach(postID => {
            const postProps = {
                postID: postID,
                type: "post",
                divider: !first
            };

            posts.push(<Post {...postProps} key={Math.random()}/>);

            first = false;
        });

        // Liked posts container
        ReactDOM.render(<div className="ui threaded comments">
                            {posts}
                        </div>,
                        document.querySelector('#liked-posts-container'));
    }
}

function loadDislikedPosts(userDoc) {
    if (userDoc.data().postsDisliked.length == 0) {
        // Display error message
        ReactDOM.render(<div className="ui red message">No Disliked Posts Found!</div>, document.querySelector('#disliked-posts-container'));
    } else {
        var posts = [];
        var first = true;

        // Reverse loop through each post to add formatted JSX element to list
        userDoc.data().postsDisliked.slice().reverse().forEach(postID => {
            const postProps = {
                postID: postID,
                type: "post",
                divider: !first
            };

            posts.push(<Post {...postProps} key={Math.random()}/>);

            first = false;
        });

        // Disliked posts container
        ReactDOM.render(<div className="ui threaded comments">
                            {posts}
                        </div>,
                        document.querySelector('#disliked-posts-container'));
    }
}