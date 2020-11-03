// ******** ENDLESS SCROLL CLASS ****** //
// use this file when you have posts that need to 
// be displayed endlessly
// (obvi)

class endless {
    constructor() {
        this.hasMore = true; // have more contents to load?
        this.proceed = true; // is another page currently loading?
        this.first = true; // is this the first loading cycle?
        this.prevDoc = null;
        this.following = null;
        this.query = null;
        this.posts = [];
    }
    
    init(filters, isTopic=false) {
        this.filters = filters;
        this.query = [];

        var numQueries = Math.ceil(filters.length / 10);

        for (var i = 0; i < numQueries; i++) {
            if (!isTopic) {
                this.query[i] = db.collection('posts')
                .where('authorUID', 'in', filters.slice(i*10, (i+1)*10))
                .orderBy('created', 'desc');
            } else {
                this.query[i] = db.collection('posts')
                .where('topic', 'in', filters.slice(i*10, (i+1)*10))
                .orderBy('created', 'desc');
            }
            
        }

        //window.addEventListener("scroll", function () {});
        window.addEventListener("scroll", function () {
            var screen = window.innerHeight + document.body.scrollTop;
            var scroll = document.body.scrollHeight - 100;
            //console.log(screen + " " + scroll);
            if (screen >= scroll) {
                endlessObj.loadPosts();
            }
        })
        // INITIAL LOAD CONTENTS
        this.loadPosts();
    }

    processQuery(querySnapshot) {
        if (this.first && querySnapshot.empty) {
            // Display error message
            ReactDOM.render(<div className="ui red message">No Posts Available!</div>, document.querySelector('#feed'));
            // theres no more posts
            this.hasMore = false;
            this.first = false;
        } else {
            // Loop through each post to add formatted JSX element to list
            querySnapshot.forEach(doc => {
                // Only display parent posts (no comments)
                if (doc.data().parent == null) {

                    if (!doc.data().anon || doc.data().authorUID == UID) {
                        const postProps = {
                            postID: doc.id,
                            type: "post"
                        };
    
                        this.posts.push(<Post {...postProps} key={doc.id}/>);
                        this.prevDoc = doc;
                        this.proceed = true;
                        this.first = false;
                    }
                }
            });
            // Threaded post container
            ReactDOM.render(<div className="ui threaded comments">
                                {this.posts}
                            </div>,
                            document.querySelector('#feed'));

            
        }
    }

    loadPosts() {
        // BLOCK MORE LOADING UNTIL THIS PAGE IS DONE
        if (this.proceed && this.hasMore) {
            this.proceed = false;

            // pull posts
            if (this.first) {
                // load some posts to start the query offset
                this.query.forEach(q => {
                    q.limit(8)
                    .get().then(querySnapshot => this.processQuery(querySnapshot));
                })
            }


            if (!this.first && this.hasMore) {
                this.query.forEach(q => {
                    q.startAfter(this.prevDoc).limit(2)
                    .get().then(querySnapshot => this.processQuery(querySnapshot));
                })
            }
        }
    }
};