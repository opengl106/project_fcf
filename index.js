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
            console.log("Rate limit reached. Wait for 300 seconds. No.1")
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
            if (err.message === 'Rate limit exceeded') {
              console.log("Rate limit reached. Wait for 300 seconds. No.2")
              return resolve("RATE LIMIT EXCEEDED");
            } else {
              reject("ERROR!")
            }
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
  return new Promise((resolve, reject) => {
    console.log("index %d, processing id: %s", index, singleid);
    T.get('users/show', { user_id: singleid },  function (err, data, response) {
      if(err){
        if (err.message === 'Rate limit exceeded') {
          console.log("Rate limit reached. Wait for 300 seconds. No.3")
          return resolve("RATE LIMIT EXCEEDED")
        } else {
          reject("ERROR!")
        }
      }else {
        var name = data.screen_name;
        console.log("user screen name: %s", name);
        if (friend == 1) {
            console.log("This user is my friend. Move on to the next one.")
            return resolve(1);
        } else if (data.followers_count >= 100) {
            console.log("This user is not my friend, but appear to not be a Chinese bot. Move on to the next one.")
            return resolve(1);
        } else if (data.followers_count <= 5) {
            console.log("This user is definitely a Chinese bot. Listed!")
            blocklist.push(name);
            return resolve(1);
        } else {
            console.log("This user is not my friend, and it is not sure whether this user is a Chinese bot.")
            return resolve(1);
        }
      }
    })
  })
    
}

function idlistprocess(idlist, blocklist, T, index){
    return new Promise((resolve, reject) => {
      console.log("The number of your follower is: %d", idlist.length);
      var processinterval = setInterval(() =>{
        ismyfriend(idlist[index], T).then(function(friend){
          return new Promise((resolve, reject) =>{
              if (friend === "RATE LIMIT EXCEEDED"){
                return resolve("RATE LIMIT EXCEEDED");
              }else{
                singleidprocess(idlist[index], index, friend, T, blocklist).then(results => {
                  if(results){
                    return resolve(1);
                  }else{
                    return reject("ERROR!")
                  }
                });
              }
          })
        }).then(result => {
          console.log("the result of singleidprocess is %d", result);
          if (result == 1){
            index += 1;
            if (index >= idlist.length){
              clearInterval(processinterval);
            }
          } else if (result === "RATE LIMIT EXCEEDED"){
            console.log("Rate limit reached. Wait for 300 seconds. No.4")
            clearInterval(processinterval);
          } else {
            throw new Error("ERROR!")
          }
        })
      }, 5000);
      if(index >= idlist.length){
        return resolve(1);
      }else {
        setTimeout(() => {
          return resolve(idlistprocess(idlist, blocklist, T, index))
        }, 5 * 62 * 1000)
      }
    })
}
function blocklistprocess(blocklist, T, index){
  return new Promise((resolve, reject) => {
    console.log("Starting to block those on the List.")
    var blockinterval = setInterval (() => {
      {
        T.post('blocks/create', { screen_name: blocklist[index] }, function (err, data, response) {
          if(err){
            if (err.message === 'Rate limit exceeded') {
              console.log("Rate limit reached. Wait for 300 seconds. No.5")
              clearInterval(blockinterval);
            } else {
              reject("ERROR!")
            }
          }else{
            console.log("Successfully blocked %s", data.screen_name);
            index += 1;
            if(index >= blocklist.length){
              clearInterval(blockinterval);
            }
          }
        })
      }
    }, 5000);
    if (index >= blocklist.length) {
      return resolve(1);
    }else{
      setTimeout(() => {
        return resolve(blocklistprocess(blocklist, T, index))
      }, 5 * 62 * 1000)
    }
  })
}

function main(scrid){
    var Twit = require('twit');
    var config = require('./config');
    var T = new Twit(config);
    var blocklist = [];
    getFollowers(T, scrid).then(idlist => {
        idlistprocess(idlist, blocklist, T, 0).then((results) => {
          if(results == 1){
            blocklistprocess(blocklist, T, 0).then((results) => {
              if(results == 1){
                console.log("The tool successfully in fucking Chinese followers.")
              } else {
                throw new Error("ERROR!")
              }
            })
          } else {
            throw new Error("ERROR!")
          }
        })
    })
}

readline.question("Input your screen ID\n", main);
