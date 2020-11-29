// DOM elements
let endlessObj = new endless();
const pagename = window.location.href.split('/')[4];
document.title = pagename;
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
        $('#follow-button-container').hide();
        followState = false;
    } else {
        $('#follow-button-container').show();
        db.collection('users').doc(UID).get().then(doc => {
            if (doc.data().followingUsers.includes(viewUID)) {
                // they are currently following
                followState = true;
                ReactDOM.render(
                    <div className="ui violet right floated button" onClick={changeFollowState}>
                        <i className="user minus icon"></i>
                        Unfollow
                    </div>,
                    document.querySelector('#follow-button-container'));
            } else {
                followState = false;
                ReactDOM.render(
                    <div className="ui basic violet right floated button" onClick={changeFollowState}>
                        <i className="user plus icon"></i>
                        Follow
                    </div>,
                    document.querySelector('#follow-button-container'));
            }
        });
    }
}

function changeFollowState() {
    new Promise((resolve) => {
        if (followState) {
            // they are currently following. unfollow.
            followState = false;
            // update database
            db.collection('users').doc(UID).update({
                followingUsers: firebase.firestore.FieldValue.arrayRemove(viewUID)
            }).then(resolve);
        } else {
            followState = true;
            db.collection('users').doc(UID).update({
                followingUsers: firebase.firestore.FieldValue.arrayUnion(viewUID)
            }).then(resolve);
        }
    }).then(() => {
        // reload the follow button to change the icon
        loadFollowButton();
    });
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
        var promises = [];

        // Reverse loop through each user to add formatted JSX element to list
        userDoc.data().followingUsers.slice().reverse().forEach(userID => {
            promises.push(new Promise(resolve => {
                db.collection('users').doc(userID).get().then(doc => {
                    var usernamehere = doc.data().username;
                    var profileImageURL = doc.data().profileImageURL;

                    users.push(
                        <div className="item" key={userID}>
                            <span className="ui compact basic violet right floated button" style={{ display: (UID == viewUID ? "" : "none") }}
                                onClick={() => {
                                    if (UID == viewUID) {
                                        db.collection('users').doc(UID).update({
                                            followingUsers: firebase.firestore.FieldValue.arrayRemove(userID)
                                        }).then(() => {
                                            refreshTab("users");
                                        });
                                    }
                                }}>
                                <i className="user minus icon"></i>
                                Unfollow
                            </span>

                            <a className="ui basic image medium label" href={"/user/" + usernamehere}>
                                <img src={profileImageURL}></img>
                                {usernamehere}
                            </a>
                        </div>
                    );

                    resolve();
                });
            }));
        });

        Promise.all(promises).then(() => {
            ReactDOM.render(
                <div className="ui relaxed divided list">
                    {users}
                </div>,
                document.querySelector('#followed-users-container'));
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
                    <span className="ui compact basic violet right floated button" style={{ display: (UID == viewUID ? "" : "none") }}
                        onClick={() => {
                            if (UID == viewUID) {
                                db.collection('users').doc(UID).update({
                                    followingTopics: firebase.firestore.FieldValue.arrayRemove(topicname)
                                }).then(() => {
                                    refreshTab("topics");
                                });
                            }
                        }}>
                        <i className="comment slash icon"></i>
                        Unfollow
                    </span>

                    <a className="ui violet circular label" href={"/topic/" + topicname} style={{ margin: "0.25em 0" }}>
                        {'#' + topicname}
                    </a>
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