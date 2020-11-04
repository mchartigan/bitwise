// DOM elements
let endlessObj = new endless();
const pagename = window.location.href.split('/')[4];
var UID = null;
var viewUID;
var storage = firebase.storage();
var storageRef = storage.ref();
var docRef = null;
var followState = null;

// function myprofile was obselete

function loadDropdown() {
    docRef.get().then(function(doc) {
        $('#user-own-profile').attr('href', '/user/'+doc.data().username);
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
        // if user is not logged in
        // or user is viewing their own page
        // do not show the follow button

        $('#follow-button').hide();
        followState = false;
    } else {
        db.collection('users').doc(UID).get().then(doc => {
            var loc = doc.data().followingUsers.indexOf(viewUID);

            if (followState == null) {
                // if this is the first time loading the page,
                // set the attribute
                $('#follow-button').attr('onclick', "changeFollowState()");
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
    if (followState) {
        // they are currently following. unfollow.
        followState = false;
        // update database
        db.collection('users').doc(UID).update({
            followingUsers: firebase.firestore.FieldValue.arrayRemove(viewUID)
        });
    } else {
        followState = true;
        db.collection('users').doc(UID).update({
            followingUsers: firebase.firestore.FieldValue.arrayUnion(viewUID)
        });
    }
    // reload the follow button to change the icon
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
    var numFollowing = userDoc.data().followingUsers.length;
    if (numFollowing == 0) {
        // Display error message
        ReactDOM.render(<div className="ui red message">No Followed Users Found!</div>, document.querySelector('#followed-users-container'));
    } else {
        var users = [];

        // Reverse loop through each user to add formatted JSX element to list
        userDoc.data().followingUsers.slice().reverse().forEach(userID => {
            db.collection('users').doc(userID).get().then(doc => {
                var usernamehere = doc.data().username;
                users.push(<div className="item" key={userID}>
                        <a className="ui small violet header" href={"/user/"+usernamehere}>{usernamehere}</a>
                        </div>);
            }).then(function() {
                // Followed users container
                // there has got to be a better way to do this than 
                // rendering it again EVERY TIME
                // but i need it to be a .then function so i can 
                // wait for the database queries to be done
                ReactDOM.render(<div className="ui relaxed divided list">
                {users}
                </div>,
                document.querySelector('#followed-users-container'));
            });
        });
        
        }
}

function loadFollowedTopics(userDoc) {
    if (userDoc.data().followingTopics.length == 0) {
        // Display error message
        ReactDOM.render(<div className="ui red message">No Followed Topics Found!</div>, document.querySelector('#followed-topics-container'));
    } else {
        var topics = [];

        // Reverse loop through each topic to add formatted JSX element to list
        userDoc.data().followingTopics.slice().reverse().forEach(topicname => {
            topics.push( <div className="item" key={topicname}>
                            <a className="ui small violet header" href={"/topic/"+topicname}>{topicname}</a>
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