var allposts;
var timeline;

firebase.auth().onAuthStateChanged(function (user) {
    UID = user ? user.uid : null;

    loadTheme().then(() => {
        bg = new Background();
        refreshHeader();
        ReactDOM.render(<Page />, document.getElementById("page"), pageMounted);
    });
});

function pageMounted() {
    // Initialize dynamic tab groups
    $('.menu .item').tab();

    allposts = new endless();
    window.addEventListener("scroll", function () {
        allposts.trigger();
    })
    allposts.init("#all-posts-container", UID, [], []);

    if (UID) {
        db.collection('users').doc(UID).get().then(userDoc => {

            var followingUsers = userDoc.data().followingUsers;
            var followingTopics = userDoc.data().followingTopics;

            timeline = new endless();
            window.addEventListener("scroll", function () {
                timeline.trigger();
            })
            timeline.init("#timeline-container", UID, followingUsers, followingTopics);

        });

        $("#timeline-tab").show();
        $('#create-post-button').show();
    } else {
        $('#create-post-button').hide();
        $("#timeline-tab").hide();
    }
}

function Page() {
    return (
        <div>
            <div className="ui main text container">
                <div className={"ui" + dark + "top attached tabular menu"}>
                    <a className={accent + "item active"} data-tab="all-posts" tabIndex="0">All Posts</a>
                    <a className={accent + "item"} data-tab="timeline" id="timeline-tab" style={{ display: "none" }} tabIndex="0">My Timeline</a>
                </div>

                <div className={"ui" + dark + "bottom attached tab segment active"} data-tab="all-posts" id="all-posts-container">
                    <div className={"ui inline centered active slow" + accent + "double loader"}></div>
                </div>

                <div className={"ui" + dark + "bottom attached tab segment"} data-tab="timeline" id="timeline-container">
                    <div className={"ui inline centered active slow" + accent + "double loader"}></div>
                </div>
            </div>
            <a className={"huge circular" + accent + "ui icon button"} style={{ display: "none" }} id="create-post-button" href="/common/create_post.html">
                <i className="plus icon"></i>
            </a>
        </div>
    )
}

