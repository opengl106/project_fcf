//Project F. C. F. (Fuck Chinese Followers) first work, version 1.0.0.
//Copyright LabMikazu (毅航实验室), Shizuki Kagurazaka (Ziyue Ji), 2020.8.6.

console.log("the tool is running");

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

//function getFollowers
//arguments: the authentification T, the screenName, time interval, already listed followers, cursor
//return: a Promise either to be resolve(list) or reject(err), where list is the listed followers.
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

//function getFriends
//arguments: the authentification T, the screenName, time interval, already listed friends, cursor
//return: a Promise either to be resolve(list) or reject(err), where list is the listed friends.
function getFriends (T, screenName, interval = 5 * 62 * 1000, friends = [], cursor = -1) {
  return new Promise((resolve, reject) => {
    T.get('friends/ids', { screen_name: screenName, stringify_ids: true, cursor: cursor, count: 5000 }, (err, data, response) => {
      if (err) {
        if (err.message === 'Rate limit exceeded') {
          console.log("Rate limit reached. Wait for 300 seconds. No.2")
          setTimeout(() => {
            return resolve(getFriends(T, screenName, interval, friends, cursor))
          }, interval)
        } else {
          cursor = -1
          reject(err)
        }
      } else {
        cursor = data.next_cursor_str
        friends.push(data.ids)
        if (cursor != '0') {
          return resolve(getFriends(T, screenName, interval, friends, cursor))
        } else {
          return resolve([].concat(...friends))
        }
      }
    })
  })
}

//function listtruefollowers
//arguments: idlist, friendslist
//return: a new list contains all that appeared in idlist but not in friendslist
function listtruefollowers(idlist, friendslist){
  var newlist = [];
  idlist.forEach((item) => {
    if (!(friendslist.includes(item))){
      newlist.push(item);
    }
  });
  return newlist;
}

//function judge
//arguments: a user object
//return: 1 if judged Chinese bot and 0 if not so.
function judge_A(_, _){
  return 1;
}
function judge_B(user, _){
  if (user.protected){
    return 1;
  } return 0;
}
function judge_C(user, ratio){
  if (parseFloat(user.followers_count) / parseFloat(user.friends_count) <= parseFloat(ratio)){
    return 1;
  } return 0;
}
function judge_D(user, lowest){
  if (user.followers_count <= parseFloat(lowest)){
    return 1;
  } return 0;
}

//function listprocess
//arguments: an id list, the authentication T, time interval, already listed blockers, cursor
//return: a Promise either to be reject(err) or resolve(list), where list is the list of blockers.
function listprocess (list, mode, param_CD, T, interval = 5 * 62 * 1000, blockers = [], cursor = 0) {
  if (mode == "A") {
    var judge = judge_A;
  } else if (mode == "C") {
    var judge = judge_C;
  } else if (mode == "D") {
    var judge = judge_D;
  } else {
    var judge = judge_B;
  }
  return new Promise((resolve, reject) => {
    T.get('users/lookup', { user_id: list.slice(cursor, cursor + 100 >= list.length ? list.length : cursor + 100) }, (err, data, response) => {
      if (err) {
        if (err.message === 'Rate limit exceeded') {
          console.log("Rate limit reached. Wait for 300 seconds. No.3")
          setTimeout(() => {
            return resolve(listprocess(list, mode, param_CD, T, interval, blockers, cursor))
          }, interval)
        } else {
          reject(err)
        }
      } else {
        cursor = cursor + 100
        data.forEach((item) => {
          if(judge(item, param_CD)){
            blockers.push(item.screen_name);
          }
        })
        console.log("Scanned: %d, Detected Chinese bots: %d", cursor >= list.length ? list.length : cursor , blockers.length);
        if (cursor < list.length) {
          return resolve(listprocess(list, mode, param_CD, T, interval, blockers, cursor))
        } else {
          return resolve([].concat(...blockers))
        }
      }
    })
  })
}

//function blocksingle
//arguments: screen name, the authentication T, cursor
//return: a Promise either to be resolve(1), resolve("RATE LIMIT EXCEEDED") or reject(err).
function blocksingle(name, T, cursor){
  return new Promise((resolve, reject) => {
    T.post('blocks/create', { screen_name: name }, function (err, data, response) {
      if(err){
        if (err.message === 'Rate limit exceeded') {
          console.log("Rate limit reached. Wait for 300 seconds. No.4")
          resolve("RATE LIMIT EXCEEDED")
        } else {
          reject("ERROR!")
        }
      }else{
        console.log("Successfully blocked the %d Chinese bot: %s", cursor + 1, data.screen_name);
        resolve(1);
      }
    });
  })
}

//function unblocksingle
//arguments: screen name, the authentication T, cursor
//return: a Promise either to be resolve(1), resolve("RATE LIMIT EXCEEDED") or reject(err).
function unblocksingle(name, T, cursor){
  return new Promise((resolve, reject) => {
    T.post('blocks/destroy', { screen_name: name }, function (err, data, response) {
      if(err){
        if (err.message === 'Rate limit exceeded') {
          console.log("Rate limit reached. Wait for 300 seconds. No.5")
          resolve("RATE LIMIT EXCEEDED")
        } else {
          reject("ERROR!")
        }
      }else{
        console.log("Successfully unblocked the %d Chinese bot: %s", cursor + 1, data.screen_name);
        resolve(1);
      }
    });
  })
}

//function blockprocess
//arguments: a list, the authentication T, time interval, cursor
//return: a Promise either to be resolve(1) or reject(err).
function blockprocess(list, T, interval = 5 * 62 * 1000, cursor = 0){
  return new Promise((resolve, reject) => {
    var blockinterval = setInterval(() => {
      blocksingle(list[cursor], T, cursor).then((result) => {
        if(result == 1){
          unblocksingle(list[cursor], T, cursor).then((result) => {
            if(result == 1){
              cursor += 1;
              if (cursor >= list.length){
                clearInterval(blockinterval);
              }
            }else if(result === "RATE LIMIT EXCEEDED"){
              clearInterval(blockinterval);
            }else{
              reject("ERROR!")
            }
          })
        }else if(result === "RATE LIMIT EXCEEDED"){
          clearInterval(blockinterval);
        }else{
          reject("ERROR!")
        }
      })
    }, 4000);
    if (cursor >= list.length){
      return resolve(1);
    } else {
      setTimeout(() => {
        return resolve(blockprocess(list, T, interval, cursor));
      }, interval);
    }
  })
}


//function main
//arguments: scrid
//return: none
function main(scrid, mode, param_CD){
  var Twit = require('twit');
  var config = require('./config');
  var T = new Twit(config);
  var blocklist = [];
  getFollowers(T, scrid).then(idlist => {
    console.log("Your followers number is: %d", idlist.length);
    getFriends(T, scrid).then(friendslist => {
      console.log("Your friends number is: %d", friendslist.length);
      var truelist = listtruefollowers(idlist, friendslist);
      console.log("Your non-friend followers count: %d", truelist.length);
      listprocess(truelist, mode, param_CD, T).then(blocklist => {
        console.log("The total number of Chinese bots detected: %d", blocklist.length);
        console.log("This is a list of the first 100 in them.")
        console.log(blocklist.slice(0, 100));
        blockprocess(blocklist, T).then(result =>{
          if(result == 1){
            console.log("The tool succeeded in fucking Chinese followers.");
          }else{
            throw new Error("ERROR!")
          }
        })
      })
    })
  })
}

readline.question("Input your screen ID\n", (scrid) => {
  readline.question("Please input your mode (input A/B/C).\n Mode A:\
    Block all non-friend followers;\n Mode B (default):\
    Block all locked accounts in non-friend followers;\n Mode C:\
    Block all followers with a particular follower/following ratio;\n Mode D:\
    Block all followers with a particular follower number.\n", (mode) => {
      readline.question("Please input the parameter.\n For mode A or B:\ This is non-necessary.\n For mode C:\
        Please input a minimum follower/following ratio.\n For mode D:\
        Please input a minimum follower number.\n", (param_CD) => {
        main(scrid, mode, param_CD)
      });
  });
});
