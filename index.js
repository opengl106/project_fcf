console.log("the tool is running");

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

function getFollowers (T, screenName, interval = 5 * 62 * 1000, followers = [], cursor = -1) {
    return new Promise((resolve, reject) => {
      T.get('followers/ids', { screen_name: screenName, stringify_ids: true, cursor: cursor, count: 5000 }, (err, data, response) => {
        if (err) {
          if (err.message === 'Rate limit exceeded') {
            setTimeout(() => {
              return resolve(getFollowers(T, screenName, interval, followers, cursor))
            }, interval)
          } else {
            cursor = -1
            reject(err)
          }
        } else {
          cursor = data.next_cursor_str
          followers.push(data.ids)
          if (cursor != '0') {
            return resolve(getFollowers(T, screenName, interval, followers, cursor))
          } else {
            return resolve([].concat(...followers))
          }
        }
      })
    })
}

function ismyfriend(singleid, T){
    return new Promise((resolve, reject) => {
        T.get('friendships/lookup', { user_id: singleid },  function (err, data, response) {
          if (err) {
            reject("ERROR!")
          } else {
            if (data[0].connections.includes('following')) {
                return resolve(1);
            } else {
                return resolve(0);
            }
          }
        });
    })
}

function singleidprocess(singleid, index, friend, T, blocklist){
    console.log("index %d, processing id: %s", index, singleid);
    T.get('users/show', { user_id: singleid },  function (err, data, response) {
        var name = data.screen_name;
        console.log("user screen name: %s", name);
        if (friend == 1) {
            console.log("This user is my friend. Move on to the next one.")
        } else if (data.followers_count >= 100) {
            console.log("This user is not my friend, but appear to not be a Chinese bot. Move on to the next one.")
        } else if (data.followers_count <= 5) {
            console.log("This user is definitely a Chinese bot. Listed!")
            blocklist.push(name);
        } else {
            console.log("This user is not my friend, and it is not sure whether this user is a Chinese bot.")
        }
    })
}

function idlistprocess(idlist, blocklist, T){
    return new Promise((resolve, reject) => {
      var index = 0;
      console.log("The number of your follower is: %d", idlist.length);
      var newinterval = setInterval(() => {
        ismyfriend(idlist[index], T).then(friend => {
          singleidprocess(idlist[index], index, friend, T, blocklist);
        })
        index += 1;
        if (index >= idlist.length){
            clearInterval(newinterval);
            return resolve(1);
        }
      }, 10000)
    })
}
function blocklistprocess(blocklist, T){
  console.log("Starting to block those on the List.")
  index = 0;
  var blockinterval = setInterval(() => {
    T.post('blocks/create', { screen_name: blocklist[index] }, function (err, data, response) {
      console.log("Successfully blocked %s", data.screen_name);
    })
    index += 1;
    if (index >= blocklist.length){
        clearInterval(blockinterval);
    }
  }, 10000)
}

function main(scrid){
    var Twit = require('twit');
    var config = require('./config');
    var T = new Twit(config);
    var blocklist = [];
    getFollowers(T, scrid).then(idlist => {
        idlistprocess(idlist, blocklist, T).then((results) => {
          if(results == 1){
            blocklistprocess(blocklist, T)
          }
        })
    })
}

readline.question("Input your screen ID\n", main);
