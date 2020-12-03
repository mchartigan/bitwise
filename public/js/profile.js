// DOM elements
var viewUID = null;
var followState = null;
var following = null;

// check url formatting and make sure its exactly what we want
var urlstring = window.location.href.split('/');
var viewname = null;

function pageMounted() {
    if (urlstring.length === 5 && urlstring[3] === 'user') {
        viewname = urlstring[4];
        // search the database for that username
        if (viewname === "null") {
            window.location.replace('/404.html');
        } else {
            db.collection('users')
                .where('username', '==', viewname).get()
                .then(querySnapshot => {
                    if (querySnapshot.empty) {
                        // user not found
                        window.location.replace('/404.html');

                    } else {
                        // continue along loading the page
                        viewUID = querySnapshot.docs[0].id;
                        loadPage();
                    }
                });
        }
    } else {
        window.location.replace('/404.html');
    }

    document.title = viewname;

    // Initialize dynamic tab groups
    $('.menu .item').tab();
}

function loadPage() {
    if (viewUID != null) {
        db.collection('users').doc(viewUID)
            .get().then(doc => {
                let userDoc = doc;

                loadProfile(userDoc);
                loadFollowButton();
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
    }
}

firebase.auth().onAuthStateChanged(function (user) {
    UID = user ? user.uid : null;

    loadTheme().then(() => {
        background();
        refreshHeader();
        ReactDOM.render(<Page />, document.getElementById("page"), pageMounted);
    });
});

function Page() {
    return (
        <div>
            <div className="ui main text container">
                <div className={"ui" + dark + "segment"}>
                    <div className="ui stackable two column grid">
                        <div className="four wide column">
                            <img className="ui small image" id="profile-picture"
                                src="https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551"></img>
                        </div>

                        <div className="twelve wide column">
                            <div className={"ui" + dark + "items"}>
                                <div className="item">
                                    <div className="top aligned content">
                                        <div id="follow-button-container" style={{ display: "none" }}></div>

                                        <div className="ui huge header" id="profile-username">
                                            <p>loading...</p>
                                        </div>

                                        <div className="meta">
                                            <span>Bio:</span>
                                        </div>

                                        <div className="bio" id="profile-bio">
                                            <p>loading...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={"ui" + dark + "top attached tabular menu"}>
                    <a className={accent + dark + "item active"} data-tab="overview">Overview</a>
                    <a className={accent + dark + "item"} data-tab="following">Following</a>
                    <a className={accent + dark + "item"} data-tab="interactions">Interactions</a>
                </div>

                <div className={"ui" + dark + "bottom attached tab segment active"} data-tab="overview">
                    <div className={"ui secondary" + dark + "pointing tabular menu"}>
                        <a className={accent + dark + "item active"} data-tab="posts">Posts</a>
                        <a className={accent + dark + "item"} data-tab="replies">Replies</a>
                    </div>

                    <div className={"ui" + dark + "bottom attached tab active"} data-tab="posts" id="posts-container">
                        <div className={"ui inline centered active slow" + accent + "double loader"}></div>
                    </div>

                    <div className={"ui" + dark + "bottom attached tab"} data-tab="replies" id="replies-container">
                        <div className={"ui inline centered active slow" + accent + "double loader"}></div>
                    </div>
                </div>

                <div className={"ui" + dark + "bottom attached tab segment"} data-tab="following">
                    <div className={"ui secondary" + dark + "pointing tabular menu"}>
                        <a className={accent + dark + "item active"} data-tab="users">Users</a>
                        <a className={accent + dark + "item"} data-tab="topics">Topics</a>
                    </div>

                    <div className={"ui" + dark + "bottom attached tab active"} data-tab="users" id="followed-users-container">
                        <div className={"ui inline centered active slow" + accent + "double loader"}></div>
                    </div>

                    <div className={"ui" + dark + "bottom attached tab"} data-tab="topics" id="followed-topics-container">
                        <div className={"ui inline centered active slow" + accent + "double loader"}></div>
                    </div>
                </div>

                <div className={"ui" + dark + "bottom attached tab segment"} data-tab="interactions">
                    <div className={"ui secondary" + dark + "pointing tabular menu"}>
                        <a className="green item active" data-tab="liked">Liked</a>
                        <a className="red item" data-tab="disliked">Disliked</a>
                        <a className={accent + dark + "item"} id="saved-tab" data-tab="saved" style={{ display: "none" }}>Saved</a>
                    </div>

                    <div className={"ui" + dark + "bottom attached tab active"} data-tab="liked" id="liked-posts-container">
                        <div className={"ui inline centered active slow" + accent + "double loader"}></div>
                    </div>

                    <div className={"ui" + dark + "bottom attached tab"} data-tab="disliked" id="disliked-posts-container">
                        <div className={"ui inline centered active slow" + accent + "double loader"}></div>
                    </div>

                    <div className={"ui" + dark + "bottom attached tab"} data-tab="saved" id="saved-posts-container">
                        <div className={"ui inline centered active slow" + accent + "double loader"}></div>
                    </div>
                </div>
                <br />
            </div>
            <a className={"huge circular" + accent + "ui icon button"} id="create-post-button" href="/common/create_post.html">
                <i className="plus icon"></i>
            </a>
        </div>
    )
}

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
                    <div className={"ui" + accent + "right floated button"} onClick={changeFollowState}>
                        <i className="user minus icon"></i>
                        Unfollow
                    </div>,
                    document.querySelector('#follow-button-container'));
            } else {
                followState = false;
                ReactDOM.render(
                    <div className={"ui basic" + accent + "right floated button"} onClick={changeFollowState}>
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
                    <div className={"ui" + dark + "threaded comments"}>
                        {posts}
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
                    <div className={"ui" + dark + "threaded comments"}>
                        {posts}
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
                            <span className={"ui compact basic" + accent + "right floated button"} style={{ display: (UID == viewUID ? "" : "none") }}
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

                            <a className={"ui basic" + dark + "image medium label"} href={"/user/" + usernamehere}>
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
                <div className={"ui relaxed" + dark + "divided list"}>
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
                    <span className={"ui compact basic" + accent + "right floated button"} style={{ display: (UID == viewUID ? "" : "none") }}
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

                    <a className={"ui" + accent + "circular label"} href={"/topic/" + topicname} style={{ margin: "0.25em 0" }}>
                        {'#' + topicname}
                    </a>
                </div>
            );
        });

        // Followed topics container
        ReactDOM.render(
            <div className={"ui relaxed" + dark + "divided list"}>
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
            <div className={"ui" + dark + "threaded comments"}>
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
            <div className={"ui" + dark + "threaded comments"}>
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
            <div className={"ui" + dark + "threaded comments"}>
                {posts}
            </div>,
            document.querySelector('#disliked-posts-container'));
    }
}