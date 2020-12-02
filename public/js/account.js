var uids = [];
var usernames = [];

var imageFile = {}
var curProfileImageURL = "https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551";

firebase.auth().onAuthStateChanged(function (user) {
    UID = user ? user.uid : null;

    loadPage().then(() => {
        pageMounted();
        if (UID) {
            getUserList();
            loadAccountInfo();
            loadTheme();
        } else {
            location.replace("/index.html");
        }
    });
});

// ========================================== Page ========================================== \\

function Page(props) {
    var accent = " " + props.accent + " ";
    var dark = props.dark ? " inverted " : " ";

    return (
        <div className='ui main text container'>
            <div className="ui stackable two column grid">
                <div className="four wide column">
                    <div className={"ui secondary" + dark + "vertical pointing fluid menu"}>
                        <a className={accent + "item active"} data-tab="information">
                            <i className="user icon"></i>
                        Information
                    </a>

                        <a className={accent + "item"} data-tab="display">
                            <i className="desktop icon"></i>
                        Display
                    </a>

                        <a className={accent + "item"} data-tab="accessibility">
                            <i className="universal access icon"></i>
                        Accessibility
                    </a>

                        <a className={accent + "item"} data-tab="options">
                            <i className="sliders horizontal icon"></i>
                        Options
                    </a>
                    </div>
                </div>

                <div className="twelve wide stretched column">
                    <div className={"ui" + dark + "tab segment active"} data-tab="information">
                        <form className={'ui' + dark + 'form'} id='account-info'>
                            <div className='field'>
                                <label>Profile Picture</label>
                            </div>

                            <img className='ui medium bordered image' id='profile-image'
                                src="https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551" />
                            <br />

                            <label className={"ui" + dark + "basic button"} htmlFor="image-file-field">
                                <i className="file icon"></i>
                            Upload
                        </label>
                            <input type="file" accept=".png, .jpg, .jpeg" id="image-file-field" style={{ display: "none" }}
                                onChange={e => uploadImage(e)} />
                            <div className={"ui" + dark + "basic button"} onClick={removeImage}>
                                <i className="trash icon"></i>
                            Remove
                        </div>
                            <br /><br />

                            <div className='field'>
                                <label>Username</label>
                                <input type="text" id="username-field" required />
                            </div>

                            <div className='field'>
                                <label>Short Bio</label>
                                <textarea rows="2" type="text" id="bio-txt-field" onKeyUp={e => countChars(e.target)}></textarea>
                                <p id="charNum"></p>
                            </div>

                            <div className='field'>
                                <label>Email</label>
                                <div className="ui disabled input">
                                    <input type="text" placeholder="retrieving email..." id="email-field" />
                                </div>
                            </div>
                            <br />

                            <div className={'ui' + accent + 'submit button'}>Save</div>
                            <div className={'ui' + dark + 'basic button'} onClick={cancelForm}>Cancel</div>
                            <div className="ui error message"></div>
                        </form>
                    </div>

                    <div className={"ui" + dark + "tab segment"} data-tab="display">
                        Dark Mode
                        <br />
                        <div className={"ui toggle checkbox"} id="dark-value">
                            <input type="checkbox" />
                            <label></label>
                        </div>
                        <br />
                        <br />
                        Accent Color
                        <br />
                        <div className="ui selection dropdown" id="accent-value">
                            <input type="hidden" />
                            <i className="dropdown icon"></i>
                            <div className="default text">Default</div>
                            <div className="scrollhint menu">
                                <div className="item" data-value="red">
                                    <div className="ui red empty circular label"></div>
                                Red
                            </div>
                                <div className="item" data-value="orange">
                                    <div className="ui orange empty circular label"></div>
                                Orange
                            </div><div className="item" data-value="yellow">
                                    <div className="ui yellow empty circular label"></div>
                                Yellow
                            </div>
                                <div className="item" data-value="olive">
                                    <div className="ui olive empty circular label"></div>
                                Olive
                            </div><div className="item" data-value="green">
                                    <div className="ui green empty circular label"></div>
                                Green
                            </div>
                                <div className="item" data-value="teal">
                                    <div className="ui teal empty circular label"></div>
                                Teal
                            </div><div className="item" data-value="blue">
                                    <div className="ui blue empty circular label"></div>
                                Blue
                            </div>
                                <div className="item" data-value="violet">
                                    <div className="ui violet empty circular label"></div>
                                Violet
                            </div><div className="item" data-value="purple">
                                    <div className="ui purple empty circular label"></div>
                                Purple
                            </div>
                                <div className="item" data-value="pink">
                                    <div className="ui pink empty circular label"></div>
                                Pink
                            </div>
                                <div className="item" data-value="brown">
                                    <div className="ui brown empty circular label"></div>
                                Brown
                            </div>
                            </div>
                        </div>
                        <br />
                        <br />
                        <div className={'ui' + accent + 'button'} onClick={saveTheme}>Save</div>
                        <div className={'ui' + dark + 'basic button'} onClick={cancelTheme}>Cancel</div>
                    </div>

                    <div className={"ui" + dark + "tab segment"} data-tab="accessibility">
                        Enable Accessibility Features
                </div>

                    <div className={"ui" + dark + "tab segment"} data-tab="options">
                        <div class='ui red button' id='delete-button' onClick={deleteWarning}>Delete Account</div>
                        <label id="warning-text">WARNING: This action cannot be reverted. Are you sure you want to delete your account?</label>
                        <br />
                        <br />
                        <div class='ui red button' id='accept-delete' onclick={deleteAccount}>Yes</div>
                        <div class='ui button' id='deny-delete' onClick={deleteBackout}>No</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function loadPage() {
    return new Promise(resolve => {
        if (UID) {
            // Load dropdown
            db.collection("users").doc(UID).get().then(function (doc) {
                var dark = doc.data().dark;
                var accent = doc.data().accent;
                background(dark, accent);
                ReactDOM.render(<Page accent={accent} dark={dark} />, document.getElementById("page"));
                resolve();
            });
        } else {
            background(false, "violet");
            ReactDOM.render(<Page accent="violet" dark={false} />, document.getElementById("page"));
            resolve();
        }
    })
}

function getUserList() {
    db.collection('users').orderBy('username').get().then(function (querySnapshot) {
        if (!querySnapshot.empty) {
            var i = 0;
            querySnapshot.forEach(doc => {
                uids[i] = doc.id;
                usernames[i] = doc.data().username;
                i++;
            });
            i = 0;
        }
    });
}

function loadAccountInfo() {
    db.collection("users").doc(UID).get().then(function (doc) {
        // Fill out account info form with current info
        $('#username-field').val(doc.data().username)
        $('#email-field').val(doc.data().email)
        $('#bio-txt-field').val(doc.data().bioText)
        curProfileImageURL = doc.data().profileImageURL
        $('#profile-image').attr('src', curProfileImageURL);
    });

    $('#image-file-field').val('')
    imageFile = {};
}

function uploadImage(e) {
    imageFile = e.target.files[0];

    // Stage chosen image file
    var reader = new FileReader();
    reader.onload = function (e) {
        curProfileImageURL = e.target.result;
        $('#profile-image').attr('src', e.target.result);
    };
    reader.readAsDataURL(imageFile);
}

function removeImage() {
    // Stage remove image change
    curProfileImageURL = "https://firebasestorage.googleapis.com/v0/b/bitwise-a3c2d.appspot.com/o/usercontent%2Fdefault%2Fprofile.jpg?alt=media&token=f35c1c16-d557-4b94-b5f0-a1782869b551";
    $('#profile-image').attr('src', curProfileImageURL);

    $('#image-file-field').val('')
    imageFile = {};
}

function saveForm() {
    // First, remove spaces if there are any (regex won't detect them sometimes for some reason)
    let usernameField = $('#username-field').val()
    $('#username-field').val(usernameField.replace(/ /g, ''))

    // Update firestore with new field values
    db.collection("users").doc(UID).update({
        username: $('#username-field').val(),
        bioText: $('#bio-txt-field').val(),
        profileImageURL: curProfileImageURL
    }).then(() => {
        refreshHeader();
        loadAccountInfo();
    });

    if ($('#image-file-field').val().length != 0) {
        // Update storage with new image file
        var path = 'usercontent/' + UID + '/profile.jpg';

        firebase.storage().ref().child(path).put(imageFile).then(() => {
            console.log('Successfully Uploaded: ', path); // DEBUG LOG
        }).catch(err => {
            console.log('Failed to Upload: ', path); // DEBUG LOG
        });
    }

    console.log('Account Information Saved'); // DEBUG LOG
}

function cancelForm() {
    // Reset form values
    loadAccountInfo();

    $('.ui.form').form('reset');
}

function countChars(obj) {
    var maxLength = 160;
    var strLength = obj.value.length;
    if (strLength > maxLength) {
        document.getElementById("charNum").innerHTML = '<span style = "color: red;">' + strLength + '/' + maxLength + ' characters</span>';
    } else {
        document.getElementById("charNum").innerHTML = strLength + '/' + maxLength + ' characters';
    }
}

function cancelTheme() {
    // Reset theme values with original data in firestore
    loadTheme();
}

function loadTheme() {
    db.collection("users").doc(UID).get().then(doc => {
        if (doc.data().dark) {
            $('#dark-value').checkbox('check')
        } else {
            $('#dark-value').checkbox('uncheck')
        }
        $('#accent-value').dropdown('set selected', doc.data().accent)
    })
}

function saveTheme() {
    // Update firestore with new theme values
    db.collection("users").doc(UID).update({
        dark: $('#dark-value').checkbox('is checked'),
        accent: $('#accent-value').dropdown('get value')
    }).then(() => {
        window.location.reload();
    })
}

function pageMounted() {
    $("#warning-text").hide();
    $("#accept-delete").hide();
    $("#deny-delete").hide();

    // Initialize dynamic tab groups
    $('.menu .item').tab();
    // Initialize accent color dropdown menu
    $('.ui.dropdown').dropdown();

    $.fn.form.settings.rules.usernameExists = function (param) {
        return checkDuplicates(param);
    }

    // Defines the rules for validating username
    $.fn.form.settings.rules.usernameExists = function (param) {
        return checkDuplicates(param);
    }

    // Form Validation
    $('#account-info').form({
        on: 'blur',
        fields: {
            username: {
                identifier: 'username-field',
                rules: [{
                    //Regex checks for any alphanumeric (including underscore and hyphen) string of three or more characters
                    type: 'regExp[/^[A-Za-z0-9_-]{3,}$/]',
                    prompt: 'Username must be at least three characters long and not contain spaces or special characters.'
                },
                {
                    type: 'usernameExists',
                    prompt: 'This username already exists. Please choose a unique username'
                }]
            },
            bio: {
                identifier: 'bio-txt-field',
                rules: [{
                    type: 'maxLength[160]',
                    prompt: 'Your bio must not be more than {ruleValue} characters'
                }]
            }
        },
        onFailure: function () {
            console.log('Validation Failed')
            return false;
        },
        onSuccess: function (event, fields) {
            console.log('Validation Succeeded')
            saveForm();
            return false;
        }
    });
}

function checkDuplicates(param) {
    var i;
    for (i = 0; i < usernames.length; i++) {
        if ((usernames[i] == param) && (uids[i] != UID)) {
            return false;
        }
    }
    return true;
}

function deleteWarning() {
    //Show hidden warning buttons and hide the original button
    $("#delete-button").hide();
    $("#warning-text").show();
    $("#accept-delete").show();
    $("#deny-delete").show();
}

function deleteAccount() {
    //Iterate through all posts and call an async function for each.
    db.collection('posts')
        .where('authorUID', '==', UID).get().then(querySnapshot => {
            //Check to see if there were any posts made by the user
            if (!querySnapshot.empty) {
                //Count the amount of posts made by the user
                var totalPost = 0;
                querySnapshot.forEach(post => {
                    totalPost++;
                });
                var i = 0;
                //Iterate through each post and call asynchronous function to delete the post
                querySnapshot.forEach(post => {
                    i++;
                    callAsyncDeletePost(post.id, i, totalPost);
                });
            }
            else {
                //Delete the user document and the user themselves
                var user = firebase.auth().currentUser;
                //Delete the user document from the database
                db.collection('users').doc(UID).delete();

                //Officially delete user from database and redirect to index
                user.delete().then(function () {
                    // Something
                }).catch(function (error) {
                    // An error happened.
                });
            }
        });
}

async function callAsyncDeletePost(postId, numPost, totalPost) {
    var x = await deletePost(postId);
    if (numPost == totalPost) {
        //All posts have been deleted. Now, delete the user document and the user themselves
        var user = firebase.auth().currentUser;
        //Delete the user document from the database
        db.collection('users').doc(UID).delete();

        //Officially delete user from database and redirect to index
        user.delete().then(function () {
            // Something
        }).catch(function (error) {
            // An error happened.
        });
    }
}

async function deletePost(postID) {
    try {
        // ********************** DEBUG ********************** \\
        // console.log("-> Delete Post:", postID);
        // *************************************************** \\

        let doc = await db.collection("posts").doc(postID).get();

        // Remove post from any users with it in their liked list
        doc.data().likedUsers.forEach(userID => {
            db.collection('users').doc(userID).update({
                postsLiked: firebase.firestore.FieldValue.arrayRemove(postID)
            });
        });

        // Remove post from any users with it in their disliked list
        doc.data().dislikedUsers.forEach(userID => {
            db.collection('users').doc(userID).update({
                postsDisliked: firebase.firestore.FieldValue.arrayRemove(postID)
            });
        });

        // Remove post from any users with it in their saved list
        doc.data().savedUsers.forEach(userID => {
            db.collection('users').doc(userID).update({
                postsSaved: firebase.firestore.FieldValue.arrayRemove(postID)
            });
        });

        // Remove post from topic doc
        db.collection('topics').where('name', '==', doc.data().topic).get().then(qS => {
            if (!qS.empty) {
                qS.forEach(topicDoc => {
                    db.collection('topics').doc(topicDoc.id).update({
                        posts: firebase.firestore.FieldValue.arrayRemove(postID)
                    });
                });
            }
        });

        return new Promise((resolve, reject) => {
            if (doc.data().parent) {
                // ********************** DEBUG ********************** \\
                // console.log("-- Removed ",postID," as child from parent: ",doc.data().parent);
                // *************************************************** \\

                db.collection('posts').doc(doc.data().parent).update({
                    children: firebase.firestore.FieldValue.arrayRemove(postID)
                });
            }

            const promises = doc.data().children.map(childID => {
                return deletePost(childID);
            });
            resolve(Promise.all(promises));
        }).then(() => {
            // ********************** DEBUG ********************** \\
            // console.log("<- Deleted Post:", postID);
            // *************************************************** \\

            db.collection('posts').doc(postID).delete();
        });
    } catch (err) {
        return;
    }
}

function deleteBackout() {
    $("#delete-button").show();
    $("#warning-text").hide();
    $("#accept-delete").hide();
    $("#deny-delete").hide();
}
