// DOM elements
let endlessObj = new endless();
const pagename = window.location.href.split('/')[4];
var viewUID = null;
var followState = null;
var following = null;

firebase.auth().onAuthStateChanged(function (user) {
    UID = user ? user.uid : null;

    db.collection('users')
        .where('username', '==', pagename)
        .get().then(querySnapshot => {
            let userDoc = querySnapshot.docs[0];
            viewUID = userDoc.id;

            loadProfile(userDoc);
            loadFollowButton();

            //following = [viewUID];
            //endlessObj.init(following);

            loadUserPosts(viewUID);
            loadUserReplies(viewUID);
            loadFollowedUsers(userDoc);
            loadFollowedTopics(userDoc);
            loadLikedPosts(userDoc);
            loadDislikedPosts(userDoc);

            if (UID) {
                if (UID == viewUID) {
                    loadSavedPosts(userDoc);
                    $("#saved-tab").show();
                } else {
                    $("#saved-tab").hide();
                }

                $('#create-post-button').transition('zoom');
            } else {
                $('#create-post-button').hide();
                $("#saved-tab").hide();
            }
        });
});

// Initialize dynamic tab groups
$('.menu .item').tab();

function loadProfile(userDoc) {
    $('#profile-picture').attr('src', userDoc.data().profileImageURL);

    $('#profile-username').html(userDoc.data().username);
    $('#profile-bio').html(userDoc.data().bioText);
}

function loadFollowButton() {
    if (UID == null || UID == viewUID) {
        // hide follow button if guest or logged in user
        $('#follow-button').hide();
        followState = false;
    } else {
        $('#follow-button').show();
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

function refreshTab(tabName) {
    db.collection('users').doc(viewUID).get().then((userDoc) => {
        switch (tabName) {
            case "overview":
                loadUserPosts(viewUID);
                loadUserReplies(viewUID);
                break;
            case "posts":
                loadUserPosts(viewUID);
                break;
            case "replies":
                loadUserReplies(viewUID);
                break;
            case "following":
                loadFollowedUsers(userDoc);
                loadFollowedTopics(userDoc);
                break;
            case "users":
                loadFollowedUsers(userDoc);
                break;
            case "topics":
                loadFollowedTopics(userDoc);
                break;
            case "interactions":
                loadLikedPosts(userDoc);
                loadDislikedPosts(userDoc);
                loadSavedPosts(userDoc);
                break;
            case "liked":
                loadLikedPosts(userDoc);
                break;
            case "disliked":
                loadDislikedPosts(userDoc);
                break;
            case "saved":
                loadSavedPosts(userDoc);
                break;
            default:
                console.log("Error - Attempting to refresh unknown tab");
        }
    });
}

function loadUserPosts(viewUID) {
    db.collection('posts')
        .where('authorUID', '==', viewUID)
        .orderBy('created', 'desc').get().then(querySnapshot => {
            if (querySnapshot.empty) {
                // Display error message
                ReactDOM.render(<div className="ui red message">No Posts Available!</div>, document.querySelector('#posts-container'));
            } else {
                var posts = [];

                // Loop through each post to add formatted JSX element to list
                querySnapshot.forEach(doc => {
                    // Only display parent posts (no replies)
                    if (doc.data().parent == null) {

                        if (!doc.data().anon || doc.data().authorUID == UID) {
                            var postProps = {
                                postID: doc.id,
                                instance: Math.floor(Math.random() * Math.pow(10, 8)),
                                type: "post",
                                topDivider: false,
                                botDivider: true
                            };

                            posts.push(<Post {...postProps} key={doc.id} />);
                        }
                    }
                });

                // Threaded post container
                ReactDOM.render(
                    <div className="ui threaded comments">
                        {posts}
                        <div className="ui inline centered active slow violet double loader"></div>
                    </div>,
                    document.querySelector('#posts-container'));
            }
        })
}

function loadUserReplies(viewUID) {
    db.collection('posts')
        .where('authorUID', '==', viewUID)
        .orderBy('created', 'desc').get().then(querySnapshot => {
            if (querySnapshot.empty) {
                // Display error message
                ReactDOM.render(<div className="ui red message">No Posts Available!</div>, document.querySelector('#replies-container'));
            } else {
                var posts = [];

                // Loop through each post to add formatted JSX element to list
                querySnapshot.forEach(doc => {
                    // Only display reply posts (no parent)
                    if (doc.data().parent != null) {
                        if (!doc.data().anon || doc.data().authorUID == UID) {
                            var postProps = {
                                postID: doc.id,
                                instance: Math.floor(Math.random() * Math.pow(10, 8)),
                                type: "post",
                                topDivider: false,
                                botDivider: true
                            };

                            posts.push(<Post {...postProps} key={doc.id} />);
                        }
                    }
                });

                // Threaded post container
                ReactDOM.render(
                    <div className="ui threaded comments">
                        {posts}
                        <div className="ui inline centered active slow violet double loader"></div>
                    </div>,
                    document.querySelector('#replies-container'));
            }
        })
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
                users.push(
                    <div className="item" key={userID}>
                        <a className="ui small violet header" href={"/user/" + usernamehere}>{usernamehere}</a>
                    </div>
                );
            }).then(function () {
                // Followed users container
                // there has got to be a better way to do this than 
                // rendering it again EVERY TIME
                // but i need it to be a .then function so i can 
                // wait for the database queries to be done
                ReactDOM.render(
                    <div className="ui relaxed divided list">
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
            topics.push(
                <div className="item" key={topicname}>
                    <a className="ui small violet header" href={"/topic/" + topicname}>{topicname}</a>
                </div>
            );
        });
        // Followed topics container
        ReactDOM.render(
            <div className="ui relaxed divided list">
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

        // Reverse loop through each post to add formatted JSX element to list
        userDoc.data().postsSaved.slice().reverse().forEach((postID, index, array) => {
            const postProps = {
                postID: postID,
                instance: Math.floor(Math.random() * Math.pow(10, 8)),
                type: "post",
                topDivider: false,
                botDivider: (index != (array.length - 1))
            };

            posts.push(<Post {...postProps} key={postID} />);
        });

        // Saved posts container
        ReactDOM.render(
            <div className="ui threaded comments">
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

        // Reverse loop through each post to add formatted JSX element to list
        userDoc.data().postsLiked.slice().reverse().forEach((postID, index, array) => {
            const postProps = {
                postID: postID,
                instance: Math.floor(Math.random() * Math.pow(10, 8)),
                type: "post",
                topDivider: false,
                botDivider: (index != (array.length - 1))
            };

            posts.push(<Post {...postProps} key={postID} />);
        });

        // Liked posts container
        ReactDOM.render(
            <div className="ui threaded comments">
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

        // Reverse loop through each post to add formatted JSX element to list
        userDoc.data().postsDisliked.slice().reverse().forEach((postID, index, array) => {
            const postProps = {
                postID: postID,
                instance: Math.floor(Math.random() * Math.pow(10, 8)),
                type: "post",
                topDivider: false,
                botDivider: (index != (array.length - 1))
            };

            posts.push(<Post {...postProps} key={postID} />);
        });

        // Disliked posts container
        ReactDOM.render(
            <div className="ui threaded comments">
                {posts}
            </div>,
            document.querySelector('#disliked-posts-container'));
    }
}