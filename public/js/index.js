// DOM elements
const loginButton   = document.querySelector('#login-button');
const profileButton = document.querySelector('#profile-button');
const postForm      = document.querySelector('#create-post-form');
const postList      = document.querySelector('#timeline');

// navigate to user profile page when logged in
function myProfile() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      location.replace("account.html");
    }
  });
}

// create element & render cafe
function renderPost(doc){
  let li = document.createElement('li');
  let topic = document.createElement('span');
  let content = document.createElement('span');
  let author = document.createElement('span');
  let created = document.createElement('span');
  let cross = document.createElement('div');

  li.setAttribute('data-id', doc.id);
  topic.textContent = doc.data().topic;
  content.textContent = doc.data().content;
  author.textContent = doc.data().author;
  created.textContent = doc.data().created.toDate().toTimeString();
  cross.textContent = 'delete';

  postForm.topic.value = '';
  postForm.content.value = '';

  li.appendChild(topic)
  li.appendChild(content);
  li.appendChild(author);
  li.appendChild(created);
  li.appendChild(cross);

  postList.append(li);

  // deleting data
  cross.addEventListener('click', (e) => {
      e.stopPropagation();
      let id = e.target.parentElement.getAttribute('data-id');
      db.collection('posts').doc(id).delete();
  });
}

postForm.addEventListener('submit', (e) =>{
  e.preventDefault();
  //console.log(e);
  var author
  if (postForm.anonymous.value) {
    author = null;
  } else {
    author = null; // replace with UID later
  }

  postForm.content.value = '';
  postForm.topic.value = '';

  db.collection('posts').add({
    author: author,
    content: postForm.content.value,
    embed: null,
    created: new Date(),
    parent: null,
    children: [null],
    topic: postForm.topic.value,
    upvotes: [null],
    downvotes: [null]
  });
});


//okay well i dont WANT a real time listener...i want infinite scroll and not auto-updating posts
var endless = {
  /* (A) FLAGS */
  hasMore: true, // have more contents to load?
  proceed: true, // is another page currently loading?
  first: true, // is this the first loading cycle?
  prevDoc: null,
 
  /* (B) LOAD CONTENTS */
  load: function () { 
    // (B1) BLOCK MORE LOADING UNTIL THIS PAGE IS DONE
    if (endless.proceed && endless.hasMore) {
      endless.proceed = false;
 
      // pull posts
      if (endless.first) {
        // load one post to start the query offset
        // if the user isnt following anything this will need to be fixed

        db.collection('posts').orderBy('created', 'desc').limit(6)
          .get().then(function (querySnapshot) {
            if (querySnapshot.empty) {
              endless.hasMore = false;
              endless.first = false;
              // do something
              // TODO: make this display "you arent following anyone" when this returns nothing
            } else {
              querySnapshot.forEach( doc => {
                endless.prevDoc = doc;
                renderPost(doc);
                endless.proceed = true;
                endless.first = false;
              });
            }
        });

      } 

      if (!endless.first && endless.hasMore) {
        db.collection('posts').orderBy('created', 'desc')
        .startAfter(endless.prevDoc).limit(2).get().then( querySnapshot => {
          if (querySnapshot.empty) {
            // theres none left.
            endless.hasMore = false;
            // idk display something
          } else {
            querySnapshot.forEach(function(doc) {
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
  init: function(){
    // (C1) ATTACH SCROLL LISTENER
    // Credits: https://stackoverflow.com/questions/9439725/javascript-how-to-detect-if-browser-window-is-scrolled-to-bottom
    window.addEventListener("scroll", function(){
      if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight) {
        endless.load();
      }
    });

    // (C2) INITIAL LOAD CONTENTS
    endless.load();
  }
};


// setup materialize components
document.addEventListener('DOMContentLoaded', function() {
  // 
  endless.init();
});

// ------------------------------------------------------------------------------------------ \\
var UID = null;
var storage = firebase.storage();
var storageRef = storage.ref();
var docRef = null;

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    UID = user.uid;
    docRef = db.collection("users").doc(UID);

    loadMenu();

    $("#login-button").hide();
    $("#user-dropdown").show();
  } else {
    docRef = null;

    loadLogoIcon();

    $("#login-button").show();
    $("#user-dropdown").hide();
  }
});

function loadMenu() {
  loadLogoIcon();

  docRef.get().then(function(doc) {
      loadProfileIcon(doc);
      document.getElementById('account-dropdown').innerHTML = '&nbsp; ' + doc.data().username;
  });
}

function loadLogoIcon() {
  storageRef.child('assets/logo.png').getDownloadURL().then(imgURL => {
      $('#logo-icon').attr('src', imgURL);
      console.log('Successfully Downloaded Logo Icon'); // DEBUG LOG
  }).catch(err => {
      console.log('Failed to Download  Icon'); // DEBUG LOG
  });
}

function loadProfileIcon(doc) {
  if (doc.data().picFlag) {
      path = 'usercontent/' + UID + '/profile.jpg';
  } else {
      path = 'usercontent/default/profile.jpg';
  }

  storageRef.child(path).getDownloadURL().then(imgURL => {
      $('#profile-icon').attr('src', imgURL);
      console.log('Successfully Downloaded Profile Icon'); // DEBUG LOG
  }).catch(err => {
      console.log('Failed to Download Profile Icon'); // DEBUG LOG
  });
}