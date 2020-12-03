var topicposts;
var followState = null;
var UID = null;

// check url formatting and make sure its exactly what we want
var topicstring = window.location.href.split('/');
var topicname = null;

firebase.auth().onAuthStateChanged(function (user) {
    UID = user ? user.uid : null;

    loadTheme().then(() => {
        bg = new Background();
        refreshHeader();
        ReactDOM.render(<Page />, document.getElementById("page"), pageMounted);
    });
});

function Page() {
    return (
        <div>
            <div className="ui main text container">
                <div className={"ui" + dark + "segment"}>
                    <div className={accent + "item"}>
                        <div id="follow-button-container" style={{ display: "none" }}></div>

                        <div className={"ui" + accent + "huge header"} id="topic-name">
                            <p>loading...</p>
                        </div>

                        <div id="num-posts"></div>
                    </div>
                </div>

                <div className={"ui" + dark + "segment"} id="topic-feed-container"></div>
            </div>
            <a className={"huge circular" + accent + "ui icon button"} style={{ display: "none" }} id="create-post-button" href="/common/create_post.html">
                <i className="plus icon"></i>
            </a>
        </div>
    )
}

function pageMounted() {
    if (topicstring.length === 5 && topicstring[3] === 'topic') {
        topicname = topicstring[4];
        document.title = "#" + topicname;

        // search the database for that topic and display its posts
        loadTopicHeader();

        topicposts = new endless();
        window.addEventListener("scroll", function () {
            topicposts.trigger();
        })
        topicposts.init("#topic-feed-container", UID, [], [topicname]);

        if (UID) {
            $('#create-post-button').show();
        } else {
            $('#create-post-button').hide();
        }
    } else {
        window.location.replace('/404.html');
    }
}

function loadTopicHeader() {
    $("#topic-name").text("#" + topicname);

    db.collection('topics').where('name', '==', topicname).get().then(qS => {
        if (!qS.empty) {
            qS.forEach(topicDoc => {
                ReactDOM.render(
                    <div className="ui small grey header">
                        (
                        {topicDoc.data().posts.length + " Post"}
                        {(topicDoc.data().posts.length - 1) ? "s" : ""}
                        )
                    </div>,
                    document.querySelector('#num-posts'));
            });
        }
    });

    loadFollowButton();
}

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
                    <div className={"ui" + accent + "right floated button"} onClick={changeFollowState} onKeyDown={changeFollowState} tabIndex="0">
                        <i className="comment slash icon"></i>
                        Unfollow
                    </div>,
                    document.querySelector('#follow-button-container'));
            } else {
                followState = false;
                ReactDOM.render(
                    <div className={"ui basic" + accent + "right floated button"} onClick={changeFollowState} onKeyDown={changeFollowState} tabIndex="0">
                        <i className="comment medical icon"></i>
                        Follow
                    </div>,
                    document.querySelector('#follow-button-container'));
            }
        });
    }
}

function changeFollowState() {

    if (event.type != "click" && event.which != 13) {
        return false;
    }
    
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
