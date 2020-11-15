const topicname = window.location.href.split('/')[4];
var followState = null;

firebase.auth().onAuthStateChanged(function (user) {
    $("#topic-name").html(topicname);
    loadFollowButton();

    loadPosts();

    if (user) {
        $('#create-post-button').transition('zoom');
    } else {
        $('#create-post-button').hide();
    }
});

function loadFollowButton() {
    if (UID == null) {
        // hide follow button if guest
        $('#follow-button').hide();
        followState = false;
    } else {
        db.collection('users').doc(UID).get().then(doc => {
            var loc = doc.data().followingTopics.indexOf(topicname);

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
            followingTopics: firebase.firestore.FieldValue.arrayRemove(topicname)
        });
    } else {
        followState = true;
        db.collection('users').doc(UID).update({
            followingTopics: firebase.firestore.FieldValue.arrayUnion(topicname)
        });
    }
    // reload the follow button to change the icon
    loadFollowButton();
}

// Loads all of the logged in users posts
function loadPosts() {
    db.collection('posts')
        .orderBy('created', 'desc')
        .where('topic', '==', topicname)
        .get().then(function (querySnapshot) {
            if (querySnapshot.empty) {
                // Display error message
                ReactDOM.render(<div className="ui red message">No Posts Available!</div>, document.querySelector('#feed'));
            } else {
                var posts = [];

                // Loop through each post to add formatted JSX element to list
                let index = 0;
                querySnapshot.forEach(doc => {
                    // Only display parent posts (no comments)
                    if (doc.data().parent == null) {
                        var postProps = {
                            postID: doc.id,
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
                    document.querySelector('#feed'));
            }
        });
}