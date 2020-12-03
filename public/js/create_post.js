var UID = null;
var username = '';
var authorImageURL = "https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551";

firebase.auth().onAuthStateChanged(function (user) {
    UID = user ? user.uid : null;

    loadTheme().then(() => {
        bg = new Background();
        refreshHeader();
        ReactDOM.render(<PostForm />, document.querySelector('#post-form'));
    });
});

class PostForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            title: '',
            body: '',
            topic: '',
            anon: false,
            author: 'temp',
            authorImageURL: '',
            hasImage: false,
            alt: '',
            isTitleValid: true,
            isTopicValid: true,
            retrieved: false,
            confirmDelete: false,
            errors: {
                title: 'Please enter a post title (maximum 64 characters)',
                topic: ''
            }
        }

        this.submitPost = this.submitPost.bind(this);
        this.addPost = this.addPost.bind(this);
        this.cancelPost = this.cancelPost.bind(this);
        this.previewImage = this.previewImage.bind(this);
        this.uploadImage = this.uploadImage.bind(this);
        this.removeImage = this.removeImage.bind(this);
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleBodyChange = this.handleBodyChange.bind(this);
        this.handleTopicChange = this.handleTopicChange.bind(this);
        this.handleAltChange = this.handleAltChange.bind(this);
        this.handleAnonChange = this.handleAnonChange.bind(this);
        this.validateForm = this.validateForm.bind(this);
        this.getPostStruct = this.getPostStruct.bind(this);

        this.fileInput = React.createRef();
        this.topics = [];

        // initialize variables
        this.imageFile = {};

        this.topicPromise = new Promise(resolve => {
            db.collection("topics").get().then((querySnapshot) => {
                querySnapshot.forEach(doc => {
                    this.topics.push({ title: doc.get("name"), num: doc.get("posts").length });
                })

                // sort into alphabetical order first
                this.topics.sort(function(a, b) {
                    return a.title.localeCompare(b.title);
                });
                // sort into descending number of posts
                this.topics.sort(function(a, b) {
                    if (a.num > b.num) {
                        return -1;
                    }
                    if (a.num < b.num) {
                    return 1;
                    }
                    return 0;
                });

                this.topics.forEach(topic => {
                    if (topic.num == 1) {
                        topic.num = topic.num + " post"
                    } else {
                        topic.num = topic.num + " posts"
                    }
                })

                resolve(this.topics);
            });
        });
    }

    validateForm(errors) {
        let valid = true;
        Object.values(errors).forEach(
            // if we have an error string set valid to false
            (val) => val.length > 0 && (valid = false)
        );
        this.setState({ isTitleValid: this.state.errors.title.length == 0 });
        this.setState({ isTopicValid: this.state.errors.topic.length == 0 });
        return valid;
    }

    submitPost() {
        if (event.type != "click" && event.which != 13) {
            return false;
        }

        if (this.validateForm(this.state.errors)) {
            console.info('Valid Form');
            var topic = this.state.topic;

            // check topic -- can be performed asynchronously
            if (topic != '') {
                // create topic if nonexistent in database
                db.collection('topics').where('name', '==', topic).get().then(function (query) {

                    if (!query.size) {
                        db.collection('topics').add({
                            name: topic
                        });
                    }
                });
            }

            // check username / UID
            UID = firebase.auth().currentUser.uid;
            // if user chose to post anonymously or isn't signed in, post anonymously
            if (this.state.anon || !UID) {
                this.addPost(
                    true,
                    UID,
                    this.state.title,
                    this.state.body,
                    this.state.topic,
                    this.state.alt
                );
            }
            // otherwise post with username attached
            else {
                db.collection('users').doc(UID).get().then(user => {
                    this.addPost(
                        false,
                        UID,
                        this.state.title,
                        this.state.body,
                        this.state.topic,
                        this.state.alt
                    );
                });
            }
        }
        else { console.error('Invalid Form'); }
    }

    // function to generate post s.t. posting with username agrees with promise
    addPost(anonymous, uid, title, body, subject, altText) {
        db.collection('posts').add({
            anon: anonymous,
            authorUID: uid,
            title: title,
            content: body,
            image: null,
            alt: altText,
            created: new Date(),
            parent: null,
            children: [],
            topic: subject,
            likedUsers: [],
            dislikedUsers: [],
            savedUsers: []
        }).then(reference => {
            if (reference) {
                var topicCheck = new Promise(resolve => {
                    if (subject != '') {
                        db.collection('topics').where('name', '==', subject).get().then(qS => {
                            if (!qS.empty) {
                                qS.forEach(topicDoc => {
                                    console.log('Added to topic:', subject);
                                    resolve();
                                    db.collection('topics').doc(topicDoc.id).update({
                                        posts: firebase.firestore.FieldValue.arrayUnion(reference.id)
                                    });
                                });
                            }
                        });
                    } else {
                        resolve();
                    }
                });

                var imageCheck = new Promise(resolve => {
                    if (this.fileInput.current.files.length > 0) {
                        // Update storage with new image file
                        var path = `posts/${reference.id}/1.jpg`;
                        firebase.storage().ref().child(path).put(this.imageFile).then(function (upload) {

                            // get download URL for image and attach to post
                            return upload.ref.getDownloadURL();
                        }).then(function (downloadURL) {

                            reference.set({
                                image: downloadURL
                            }, { merge: true });

                            console.log('Successfully Uploaded: ', path); // DEBUG LOG
                            resolve();
                        }).catch(err => {
                            console.log('Failed to Upload: ', path); // DEBUG LOG
                        });
                    }
                    else {
                        resolve();
                    }
                });

                Promise.all([topicCheck, imageCheck]).then(() => {
                    this.cancelPost();
                    location.replace("/index.html");
                });
            } else {
                console.log('Failed to add post!'); // DEBUG LOG
            }
        });
    }

    cancelPost() {
        if (event.type != "click" && event.which != 13) {
            return false;
        }
        this.setState({ title: '' });
        this.setState({ body: '' });
        this.setState({ topic: '' });

        this.removeImage();
    }

    previewImage() {
        if (this.fileInput.current.files.length > 0) {
            // Display chosen image file
            var reader = new FileReader();
            reader.onload = function (e) {
                document.querySelector('#post-image').src = e.target.result;
                document.querySelector('#preview-image').src = e.target.result;
            };
            reader.readAsDataURL(this.imageFile);

            $('#post-image').show();
            $('#preview-image').show();
        }
        else {
            $('#post-image').hide();
            $('#preview-image').hide();
            document.querySelector('#post-image').src = '//:0';
            document.querySelector('#preview-image').src = '//:0';

            this.setState({alt: ''});
        }
    }

    uploadImage(event) {
        event.preventDefault();
        this.imageFile = this.fileInput.current.files[0];
        this.setState({ hasImage: true });
        // Stage chosen image file
        this.previewImage();
    }

    removeImage() {
        if (event.type != "click" && event.which != 13) {
            return false;
        }
        
        // Stage remove image change
        if (this.fileInput.current.files.length > 0) {
            this.fileInput.current.value = '';
            this.imageFile = {};
            this.setState({ hasImage: false });

            this.previewImage();
        }
    }

    handleTitleChange(event) {
        this.setState({title: event.target.value});
        var length = event.target.value.length
        this.state.errors.title = 
            (length == 0 || length > 64) ? 'Please enter a post title (maximum 64 characters)' : '';
    }

    handleBodyChange(event) { this.setState({ body: event.target.value }); }

    handleTopicChange(event) {
        this.setState({ topic: event.target.value });
        this.state.errors.topic =
            RegExp(/^$|^[A-Za-z0-9_-]{3,32}$/).test(event.target.value)
                ? '' : 'Topics must be at 3 to 32 characters long and not contain spaces or special characters';
    }

    handleAltChange(event) { this.setState({alt: event.target.value}); }

    handleAnonChange(event) {
        this.setState({ anon: event.target.checked }, () => {
            if (this.state.anon) {
                this.setState({ authorImageURL: "https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551" });
                this.setState({ author: "Anonymous" });
            }
            else {
                this.setState({ authorImageURL: authorImageURL });
                this.setState({ author: username });
            }
        });
    }

    getPostStruct() {
        return (
            <div className="post">
                <div className="comment" style={{ display: (this.state.retrieved ? "" : "none") }}>
                    <a className="avatar">
                        <img src={this.state.authorImageURL} />
                    </a>

                    <div className="content">
                        <a className="author">{this.state.author}</a>

                        <div className="metadata">
                            <span className="date">less than a minute ago</span>
                            <a className={"ui" + accent + "circular label"}
                                style={{ display: (this.state.topic.length > 0 ? "" : "none") }}>{"#" + this.state.topic}
                            </a>
                        </div>

                        <span className="actions" style={{ float: "right" }}>
                            <a> <i className="expand alternate icon"></i></a>
                        </span>

                        <div className="thread">
                            <div className="text">
                                <span className={"ui" + accent + "medium header"}>{this.state.title}</span>
                                <div dangerouslySetInnerHTML={{ __html: marked(this.state.body) }} />
                                <img className="hidden ui image" src='//:0' id='preview-image' />
                            </div>

                            <div className="actions">
                                <span>
                                    <a className="like">
                                        0
                                        &nbsp;
                                        <i className="thumbs up outline icon"></i>
                                        Like
                                    </a>
                                </span>

                                <span>
                                    &nbsp;&middot;&nbsp;
                                    <a className="dislike">
                                        0
                                        &nbsp;
                                        <i className="thumbs down outline icon"></i>
                                        Dislike
                                    </a>
                                </span>

                                <span>
                                    &nbsp;&middot;&nbsp;
                                    <a className="save">
                                        <i className="bookmark outline icon"></i>
                                        Save
                                    </a>
                                </span>

                                <span>
                                    &nbsp;&middot;&nbsp;
                                    <a className="reply">
                                        <i className="reply icon"></i>
                                        Reply
                                    </a>
                                </span>

                                <span style={{ float: "right" }}>
                                    <a className="ui red label" id="delete-post-label" onClick={() => {
                                        this.cancelPost();
                                        this.setState({ confirmDelete: false });
                                    }}
                                        style={{ display: (this.state.confirmDelete ? "" : "none") }}>Delete</a>

                                    <a className="ui label" id="delete-post-label" style={{ display: (this.state.confirmDelete ? "" : "none") }}
                                        onClick={(event) => {
                                            event.target.onselectstart = function () { return false; };
                                            this.setState({ confirmDelete: false });
                                        }}>Cancel</a>

                                    <a className="delete" style={{ display: (this.state.confirmDelete ? "none" : "") }}
                                        onClick={(event) => {
                                            event.target.onselectstart = function () { return false; };
                                            this.setState({ confirmDelete: true });
                                            setTimeout(() => { this.setState({ confirmDelete: false }); }, 3000);
                                        }}>
                                        <i className="trash alternate outline icon" ></i>
                                    </a>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    render() {
        var dataStyle = {
            fontSize: '12px'
        }
        var labelStyle = {
            fontWeight: 'bold',
            fontSize: '14px'
        }

        return (
            <div className='ui main text container'>
                <h1 className={"ui" + dark + "header"}>Create a Post</h1>

                <form className={'ui' + dark + 'form'} onSubmit={this.submitPost} noValidate>
                    <div className='field'>
                        <label style={labelStyle}>Title</label>
                        <input type="text" name="title" placeholder="Title your post here"
                            value={this.state.title} onChange={this.handleTitleChange} noValidate/>
                        <label className={"ui" + dark + "text"} style={dataStyle}>
                            {this.state.title.length}/64 characters
                        </label>
                        {!this.state.isTitleValid &&
                            <div className='ui red message'>Please enter a post title (maximum 64 characters)</div>}
                    </div>

                    <div className='field'>
                        <label style={labelStyle}>Body</label>
                        <textarea rows="4" type="text" name="body" placeholder="Add a post body here"
                            value={this.state.body} onChange={this.handleBodyChange} />
                        <div className='ui grid'>
                            <div className='ui left floated left aligned six wide column'>
                                <label className={"ui" + dark + "text"} style={dataStyle}>
                                    {this.state.body.length} characters
                                </label>
                            </div>
                            <div className='ui right floated right aligned six wide column'>
                                <label className={"ui" + dark + "text"} style={dataStyle}>
                                    <i className='alternate file outline icon'/>
                                    Markdown supported
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className='field'>
                        <label style={labelStyle}>Topic</label>
                        <div className="ui search">
                            <div className="ui icon input">
                                <input className="prompt" type="text" name="topic" placeholder="Tag with a topic (optional)"
                                    value={this.state.topic} onChange={this.handleTopicChange} noValidate/>
                                <i className="search icon"></i>
                            </div>
                            <div className="results"></div>
                        </div>
                        
                        <label className={"ui" + dark + "text"} style={dataStyle}>
                            {this.state.topic.length}/32 characters
                        </label>
                        {!this.state.isTopicValid &&
                            <div className='ui red message'>
                                Topics must be 3 to 32 characters long and not contain spaces or special characters
                            </div>}
                    </div>

                    <div className='field'>
                        <label style={labelStyle}>Attach a Picture</label>
                    </div>
                    <img src='//:0' className='hidden ui small image' id='post-image' style={{
                        imageRendering: '-moz-crisp-edges',
                        imageRendering: '-webkit-crisp-edges',
                        imageRendering: 'pixelated',
                        imageRendering: 'crisp-edges'
                    }} />
                    <br /><br />
                    <label className={"ui" + accent + "basic button"} htmlFor="image-file-field" tabIndex="0">
                        <i className="file icon"></i>
                        Upload
                    </label>
                    <input type="file" name="image" accept=".png, .jpg, .jpeg" id="image-file-field"
                        style={{ display: 'none' }} ref={this.fileInput} onChange={this.uploadImage} />
                    <div className={"ui" + dark + "basic button"} onClick={() => this.removeImage()} onKeyDown={() => this.removeImage()} tabIndex="0">
                        <i className="trash icon"></i>
                        Remove
                    </div>
                    <div className="ui input" style={{width: '50%'}}>
                        {this.state.hasImage && <input
                            type="text" name="alt" placeholder="Add an image description"
                            value={this.state.alt} onChange={this.handleAltChange}/>
                        }
                    </div>
                    <br/><br/>

                    <div className='ui fluid accordion'>
                        <div className="active title">
                            <a className="ui image label" style={{fontWeight: 'bold', fontSize: '14px'}}>
                                <i className="dropdown icon"></i>
                                Post preview
                            </a>
                        </div>
                        <div className='active content'>
                            <div className={"ui" + dark + "threaded comments"}>
                                <this.getPostStruct />
                            </div>
                        </div>
                    </div>
                    <br/><br/>
                    <div className={'ui' + accent + 'submit button'} onClick={() => this.submitPost()} onKeyDown={() => this.submitPost()} tabIndex="0">Submit</div>
                    <div className={'ui' + dark + 'basic button'} onClick={() => this.cancelPost()} onKeyDown={() => this.cancelPost()} tabIndex="0">Clear</div>
                    <div className={'ui' + accent + 'toggle checkbox'}>
                        <input type='checkbox' name='anon'
                            checked={this.state.anon} onChange={this.handleAnonChange} />
                        <label>Anonymous?</label>
                    </div>
                    <div className="ui error message"></div>
                    <br /><br /><br /><br />
                </form>
            </div>
        )
    }

    componentDidMount() {
        var that = this;

        $('.ui.accordion').accordion();
        this.topicPromise.then((topics) => {
            $('.ui.search').search({
                source: topics,
                fullTextSearch: false,
                minCharacters: 0,
                maxResults: 6,
                showNoResults: false,
                fields: {
                    price: 'num'
                },
                onSelect: function(result, response) {
                    that.setState({topic: result.title});
                    return true;
                }
            });
        });

        new Promise(resolve => {

            firebase.auth().onAuthStateChanged(function (user) {
                UID = user ? user.uid : null;

                if (UID) {
                    db.collection("users").doc(UID).get().then(userDoc => {
                        username = userDoc.data().username;
                        authorImageURL = userDoc.data().profileImageURL;

                        resolve();
                    });
                } else {
                    location.replace("/index.html");
                    resolve();
                }
            });
        }).then(() => {
            this.setState({ author: username });
            this.setState({ authorImageURL: authorImageURL });
            this.setState({ retrieved: true });
        });
    }
}