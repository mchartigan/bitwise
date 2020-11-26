const topicname = window.location.href.split('/')[4];
document.title = "#" + topicname;
var followState = null;

firebase.auth().onAuthStateChanged(function (user) {
    UID = user ? user.uid : null;

    $("#topic-name").text("#" + topicname);
    loadFollowButton();

    loadPosts();

    if (UID) {
        $('#create-post-button').transition('zoom');
    } else {
        $('#create-post-button').hide();
    }
});

function loadFollowButton() {
    if (UID == null) {
        // hide follow button if guest
        $('#follow-button-container').hide();
        followState = false;
    } else {
        $('#follow-button-container').show();
        db.collection('users').doc(UID).get().then(doc => {
            if (doc.data().followingTopics.includes(topicname)) {
                // they are currently following
                followState = true;
                ReactDOM.render(
                    <div className="ui violet right floated button" onClick={changeFollowState}>
                        <i className="comment slash icon"></i>
                        Unfollow
                    </div>,
                    document.querySelector('#follow-button-container'));
            } else {
                followState = false;
                ReactDOM.render(
                    <div className="ui basic violet right floated button" onClick={changeFollowState}>
                        <i className="comment medical icon"></i>
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
                followingTopics: firebase.firestore.FieldValue.arrayRemove(topicname)
            }).then(resolve);
        } else {
            followState = true;
            db.collection('users').doc(UID).update({
                followingTopics: firebase.firestore.FieldValue.arrayUnion(topicname)
            }).then(resolve);
        }
    }).then(() => {
        // reload the follow button to change the icon
        loadFollowButton();
    });
}

// Loads all of the logged in users posts
function loadPosts() {
    db.collection('posts')
        .orderBy('created', 'desc')
        .where('topic', '==', topicname)
        .get().then(function (querySnapshot) {
            if (querySnapshot.empty) {
                // Display error message
                ReactDOM.render(<div className="ui red message">No Posts Available!</div>, document.querySelector('#topic-feed-container'));
            } else {
                var posts = [];

                // Loop through each post to add formatted JSX element to list
                let index = 0;
                querySnapshot.forEach(doc => {
                    // Only display parent posts (no comments)
                    if (doc.data().parent == null) {
                        var postProps = {
                            postID: doc.id,
                            instance: Math.floor(Math.random() * Math.pow(10, 8)),
                            type: "post",
                            topDivider: false,
                            botDivider: (index != (querySnapshot.size - 1))
                        };

                        posts.push(<Post {...postProps} key={doc.id} />);
                    }

                    index++;
                });

                // Threaded post container
                ReactDOM.render(
                    <div className="ui threaded comments">
                        {posts}
                    </div>,
                    document.querySelector('#topic-feed-container'));
            }
        });
}