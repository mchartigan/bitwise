firebase.auth().onAuthStateChanged(function (user) {
    UID = user ? user.uid : null;

    loadTheme().then(() => {
        background();
        refreshHeader();
        ReactDOM.render(<Page />, document.getElementById("page"), pageMounted);
    });

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

function pageMounted() {
    // Initialize dynamic tab groups
    $('.menu .item').tab();
}

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
                            botDivider: true
                        };

                        posts.push(<Post {...postProps} key={doc.id} />);
                    }
                });

                // Threaded post container
                ReactDOM.render(
                    <div className={"ui" + dark + "threaded comments"}>
                        {posts}
                    </div>,
                    document.querySelector('#all-posts-container'));
            }
        })
}

function Page() {
    return (
        <div>
            <div className="ui main text container">
                <div className={"ui" + dark + "top attached tabular menu"}>
                    <a className={accent + "item active"} data-tab="all-posts">All Posts</a>
                    <a className={accent + "item"} data-tab="timeline" id="timeline-tab">My Timeline</a>
                </div>

                <div className={"ui" + dark + "bottom attached tab segment active"} data-tab="all-posts" id="all-posts-container">
                    <div className={"ui inline centered active slow" + accent + "double loader"}></div>
                </div>

                <div className={"ui" + dark + "bottom attached tab segment"} data-tab="timeline" id="timeline-container">
                    <div className={"ui inline centered active slow" + accent + "double loader"}></div>
                </div>
            </div>
            <a className={"huge circular" + accent + "ui icon button"} id="create-post-button" href="/common/create_post.html">
            <i className="plus icon"></i>
            </a>
        </div>
    )
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
                        <div className={"ui" + dark + "threaded comments"}>
                        {posts}
                        </div>,
                        document.querySelector('#timeline-container'));
                }
            });
    });
}
