// ******** ENDLESS SCROLL CLASS ****** //
// use this file when you have posts that need to 
// be displayed endlessly
// (obvi)

class endless {
    constructor() {
        this.allPosts = false;
        this.repliesOnly = false;
        this.users = [];
        this.topics = [];
        this.first = true;
        this.loaded = false;
        this.done = false;
        this.prevDoc = null;
        this.posts = [];
    }

    init(containerName, UID, users, topics, repliesOnly=false) {
        // if both are empty, then this will display a timeline
        // if either has any values, then it will only show those posts
        if (users.length == 0 && topics.length == 0) {
            this.allPosts = true;
        } else {
            this.users = users;
            this.topics = topics;
        }

        this.containerName = containerName;
        this.UID = UID;
        this.repliesOnly = repliesOnly;

        this.qu = db.collection('posts')
            .orderBy('created', 'desc').limit(15);

        this.loadPosts();
    }

    trigger() {
        var screen = window.innerHeight + document.body.scrollTop;
        var scroll = document.body.scrollHeight - 100;
        if (screen >= scroll) {
            if (this.loaded) {
                this.loadPosts();
            }
        }
    }

    loadPosts() {
        var query;
        this.loaded = false;
        if (this.first) {
            // load posts with no offset
            query = this.qu;

        } else {
            // load posts with a specific offset
            query = this.qu.startAfter(this.prevDoc);
        }

        var tLength = this.topics.length;
        var uLength = this.users.length;

        if ((uLength == 0) && (tLength > 0 && tLength < 10)) {
            query = query.where('topic', 'in', this.topics);
        }

        if ((tLength == 0) && (uLength > 0 && uLength < 10)) {
            query = query.where('authorUID', 'in', this.users);
        }

        

        if (!this.done) {
            query.get().then(querySnapshot => {
                if (querySnapshot.empty) {
                    if (this.first) {
                        ReactDOM.render(<div className="ui red message">No Posts Available!</div>, document.querySelector(this.containerName));
                    }
                    this.done = true;
                    ReactDOM.render(
                            <div className={"ui" + dark + "threaded comments"}>
                                {this.posts.slice(0)}
                                <div className={"ui" + accent + "message"}>
                                    No more posts!
                                </div>
                            </div>,
                        document.querySelector(this.containerName));
                } else {
                    var newposts = [];
                    var lastdoc;

                    querySnapshot.forEach(doc => {
                        // Display only followed users or topics
                        var topic = doc.data().topic;
                        var author = doc.data().authorUID;
                        var anon = doc.data().anon;
                        lastdoc = doc;

                        if (this.allPosts
                            || this.topics.includes(topic)
                            || (this.users.includes(author) && !anon)
                            || author == this.UID) {

                            // Only display parent posts (no comments)
                            if (!this.repliesOnly) {
                                if (doc.data().parent == null) {
                                    var postProps = {
                                        postID: doc.id,
                                        instance: Math.floor(Math.random() * Math.pow(10, 8)),
                                        type: "post",
                                        topDivider: false,
                                        botDivider: true,
                                        key: doc.id
                                    };
                                    this.posts.push(<Post {...postProps} key={doc.id} />);
                                }
                            } else {
                                if (doc.data().parent != null) {
                                    if (!doc.data().anon || doc.data().authorUID == UID) {
                                        var postProps = {
                                            postID: doc.id,
                                            instance: Math.floor(Math.random() * Math.pow(10, 8)),
                                            type: "post",
                                            topDivider: false,
                                            botDivider: true,
                                            key: doc.id
                                        };
            
                                        this.posts.push(<Post {...postProps} key={doc.id} />);
                                    }
                                }
                            }
                            
                        }
                    });

                    this.prevDoc = lastdoc;
                    ReactDOM.render(
                        <div className={"ui" + dark + "threaded comments"}>
                            {this.posts.slice(0)}
                            <div className={"ui inline centered active slow" + accent + "double loader"}></div>
                        </div>,
                        document.querySelector(this.containerName));
                    
                    // clean up the loading spinner if theres
                    // no more posts on that first load
                    if (this.first) {
                        this.first = false;
                        this.loadPosts();
                    }
                }
                this.loaded = true;
            })
        }
    }
};