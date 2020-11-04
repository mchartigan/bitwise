var UID = null;
var topicname = null;
var storage = firebase.storage();
var storageRef = storage.ref();
var docRef = null;
var followState = null;

firebase.auth().onAuthStateChanged(function (user) {
    loadTopic();
    if (user) {
        UID = user.uid;
        docRef = db.collection("users").doc(UID);

        loadDropdown();

        $("#login-button").hide();
        $("#user-dropdown").show();

        setFollowState();
        loadFollowButton();
        loadPosts();
    } else {
        setFollowState();
        loadFollowButton();
        loadPosts();
        //location.replace("/common/login.html");
    }
});

function loadDropdown() {
    docRef.get().then(function (doc) {
        $('#profile-icon').attr('src', doc.data().profileImageURL);
        document.getElementById('account-dropdown').innerHTML = '&nbsp; ' + doc.data().username;
    });
}

// Loads all of the logged in users posts
function loadPosts() {
    db.collection('posts')
        .orderBy('created', 'desc')
        .where('topic','==',topicname)
        .get().then(function (querySnapshot) {
            if (querySnapshot.empty) {
                // Display error message
                ReactDOM.render(<div className="ui red message">No Posts Available!</div>, document.querySelector('#feed'));
            } else {
                var posts = [];

                // Loop through each post to add formatted JSX element to list
                querySnapshot.forEach(doc => {
                    // Only display parent posts (no comments)
                    if (doc.data().parent == null) {
                        const postProps = {
                            postID: doc.id,
                            type: "post"
                        };
    
                        posts.push(<Post {...postProps} key={doc.id}/>);
                    }
                });

                // Threaded post container
                ReactDOM.render(<div className="ui threaded comments">
                                    {posts}
                                </div>,
                                document.querySelector('#feed'));
            }
        });
}
function setFollowState() {
    if (UID == null) {
        followState = false;
    } else {
        db.collection('users').doc(UID).get().then(doc => {
            var loc = doc.data().followingTopics.indexOf(topicname);
            if (loc > -1) {
                followState = true;
            } else {
                followState = false;
            }
        });
    }
}

function loadFollowButton() {
    // IN PROGRESS
    if (UID == null) {
        $('#follow-button').hide();
        followState = false;
    }
    if (followState == true) {
        // they are currently following
        ReactDOM.render(<div> <i className="user minus icon"></i>
                            Unfollow
                            </div>, document.querySelector('#follow-button'));
    } else {
        ReactDOM.render(<div> <i className="user plus icon"></i>
                            Follow
                            </div>, document.querySelector('#follow-button'));
    }
}

function changeFollowState() {
    // check current user follow list
    if (followState == true) {
        // they are currently following. unfollow.
        db.collection('users').doc(UID).update({
            followingTopics: firebase.firestore.FieldValue.arrayRemove(topicname)
        });
        followState = false;
    } else {
        db.collection('users').doc(UID).update({
            followingTopics: firebase.firestore.FieldValue.arrayUnion(topicname)
        });
        followState = true;
    };
    loadFollowButton();
}

function loadTopic() {
    topicname = window.location.href.split('/')[4];
    $("#topic-name").html(topicname);
}