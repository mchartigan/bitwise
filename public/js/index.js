firebase.auth().onAuthStateChanged(function (user) {
    UID = user ? user.uid : null;

    loadAllPosts();

    if (UID) {
        $('#create-post-button').transition('zoom');
        $("#timeline-tab").show();

        loadMyTimeline(UID);
    } else {
        $('#create-post-button').hide();
        $("#timeline-tab").hide();
    }
});

// Initialize dynamic tab groups
$('.menu .item').tab();

function loadAllPosts() {
    db.collection('posts')
        .orderBy('created', 'desc').get().then(querySnapshot => {
            if (querySnapshot.empty) {
                // Display error message
                ReactDOM.render(<div className="ui red message">No Posts Available!</div>, document.querySelector('#all-posts-container'));
            } else {
                var posts = [];

                // Loop through each post to add formatted JSX element to list
                querySnapshot.forEach(doc => {
                    // Only display parent posts (no comments)
                    if (doc.data().parent == null) {
                        var postProps = {
                            postID: doc.id,
                            instance: Math.floor(Math.random() * Math.pow(10, 8)),
                            type: "post",
                            topDivider: false,
                            botDivider: true,
                        };

                        posts.push(<Post {...postProps} key={doc.id} />);
                    }
                });

                // Threaded post container
                ReactDOM.render(
                    <div className="ui threaded comments">
                        {posts}
                        <div className="ui inline centered active slow violet double loader"></div>
                    </div>,
                    document.querySelector('#all-posts-container'));
            }
        })
}

function loadMyTimeline(myUID) {
    db.collection('users').doc(myUID).get().then(userDoc => {

        let followingUsers = userDoc.data().followingUsers,
            followingTopics = userDoc.data().followingTopics;
        followingUsers.push(myUID);

        db.collection('posts')
            .orderBy('created', 'desc').get().then(querySnapshot => {
                if (querySnapshot.empty) {
                    // Display error message
                    ReactDOM.render(<div className="ui red message">No Posts Available!</div>, document.querySelector('#timeline-container'));
                } else {
                    var posts = [];

                    // Loop through each post to add formatted JSX element to list
                    querySnapshot.forEach(doc => {
                        // Display only followed users or topics
                        if ((followingUsers.includes(doc.data().authorUID) && (!doc.data().anon || (doc.data().authorUID == myUID))) || followingTopics.includes(doc.data().topic)) {
                            // Only display parent posts (no comments)
                            if (doc.data().parent == null) {
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
                        document.querySelector('#timeline-container'));
                }
            });
    });
}