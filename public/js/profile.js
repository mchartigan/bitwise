// DOM elements
const loginButton = document.querySelector('#login-button');
const profileButton = document.querySelector('#profile-button');
const postForm = document.querySelector('#create-post-form');
const postList = document.querySelector('#timeline');
const profile = document.querySelector('#profile-data');


// navigate to user profile page when logged in
function myProfile() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            location.replace("account.html");
        }
    });
}

// create element & render cafe
function renderPost(doc){
    let li = document.createElement('li');
    let title = document.createElement('span');
    let topic = document.createElement('span');
    let content = document.createElement('span');
    let author = document.createElement('span');
    let created = document.createElement('span');
    let img = document.createElement('img');
    let cross = document.createElement('div');
  
    li.setAttribute('data-id', doc.id);
    if (doc.data().topic != '') {
      topic.textContent = "topic: " + doc.data().topic;
    } 
    title.textContent = doc.data().title;
    content.textContent = doc.data().content;
    if (doc.data().author != null) {
      author.textContent = "author: " + doc.data().author;
    } else {
      author.textContent = "[anonymous]"
    }
    created.textContent = doc.data().created.toDate();
    img.setAttribute('src', doc.data().image);
    cross.textContent = 'delete';
  
    li.appendChild(topic);
    li.appendChild(title);
    li.appendChild(content);
    li.appendChild(author);
    li.appendChild(created);
    if (doc.data().image != null) {
      li.appendChild(img);
    }
    li.appendChild(cross);

    postList.append(li);

    // deleting data
    cross.addEventListener('click', (e) => {
        e.stopPropagation();
        let id = e.target.parentElement.getAttribute('data-id');
        db.collection('posts').doc(id).delete();
        // trigger firebase function for cleaning up images
    });
}


//okay well i dont WANT a real time listener...i want infinite scroll and not auto-updating posts
var endless = {
    /* (A) FLAGS */
    hasMore: true, // have more contents to load?
    proceed: true, // is another page currently loading?
    first: true, // is this the first loading cycle?
    prevDoc: null,
    following: null,

    /* (B) LOAD CONTENTS */
    load: function () {
        // (B1) BLOCK MORE LOADING UNTIL THIS PAGE IS DONE
        if (endless.proceed && endless.hasMore) {
            endless.proceed = false;

            // pull posts
            if (endless.first) {
                // load one post to start the query offset
                // if the user isnt following anything this will need to be fixed

                db.collection('posts')
                    .where('authoruid', 'in', following)
                    .orderBy('created', 'desc')
                    .limit(20)
                    .get().then(function (querySnapshot) {
                        if (querySnapshot.empty) {
                            endless.hasMore = false;
                            endless.first = false;
                            // do something
                            // TODO: make this display "you arent following anyone" when this returns nothing
                        } else {
                            querySnapshot.forEach(doc => {
                                endless.prevDoc = doc;
                                renderPost(doc);
                                endless.proceed = true;
                                endless.first = false;
                            });
                        }
                    });

            }

            if (!endless.first && endless.hasMore) {
                    // ============================================================================================================
                    // -------------------------TODO: SHOW ANONYMOUS POSTS IF THE LOGGED IN USER POSTED IT-------------------------
                    // ============================================================================================================
                    db.collection('posts')
                    .where('authoruid', 'in', following)
                    .orderBy('created', 'desc')
                    .startAfter(endless.prevDoc).limit(2).get().then(querySnapshot => {
                        if (querySnapshot.empty) {
                            // theres none left.
                            endless.hasMore = false;
                            // idk display something
                        } else {
                            querySnapshot.forEach(function (doc) {
                                endless.prevDoc = doc;
                                renderPost(doc);
                                endless.proceed = true;
                                endless.hasMore = true;
                            });
                        }
                    });
            }
        }
    },

    /* (C) INIT */
    init: function (following) {
        endless.following = following;
        // (C1) ATTACH SCROLL LISTENER
        // Credits: https://stackoverflow.com/questions/9439725/javascript-how-to-detect-if-browser-window-is-scrolled-to-bottom
        window.addEventListener("scroll", function () {
            if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight) {
                endless.load();
            }
        });

        // (C2) INITIAL LOAD CONTENTS
        endless.load();
    }
};

// -----------------------zach g's user stuff---------------------------------------------- \\
  
function loadDropdown() {
    db.collection("users").doc(UID).get().then(function(doc) {
        $('#profile-icon').attr('src', doc.data().profileImageURL);
        document.getElementById('account-dropdown').innerHTML = '&nbsp; ' + doc.data().username;
    });
}

// load the profile data
var UID = null;
var storage = firebase.storage();
var storageRef = storage.ref();
var docRef = null;

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        UID = user.uid;
        docRef = db.collection("users").doc(UID);

        $("#login-button").hide();
        $("#user-dropdown").show();

        loadDropdown();

        // load the user's profile information into the top
        docRef.get().then(function(doc) {
            $('#profile-picture').attr('src', doc.data().profileImageURL);
        });

        let tcontent = document.createElement('div');
        let uname = document.createElement('h1');
        let description = document.createElement('h2');

        docRef.get().then(function(doc) {
            tcontent.setAttribute('data-id', doc.id);
            uname.textContent = doc.data().username;
            description.textContent = doc.data().bioText;

            tcontent.appendChild(uname);
            tcontent.appendChild(description);
        
            profile.append(tcontent);
        });

        // get a list of users whose posts we want to see
        // as this is the users own page, its just the user

        following = [UID];
        endless.init(following);

    } else {
        docRef = null;

        $("#login-button").show();
        $("#user-dropdown").hide();
    }
});

// run after page initialization
document.addEventListener('DOMContentLoaded', function () {
    // on DOM content loaded
});