# Project FCF (Fuck Chinese Followers - 操死拆腻子逼)
## 介绍
今天上午玩砍口垒之余，在昨天晚上的0.01-demo版本的经验上，改进了API的使用方式，制作出了有实用价值的FCF工具。\
代码可读性也提升到了正常人的水平。
## 原理
### 检测
该工具利用follower的数目检测一位你未关注的关注者是不是拆腻子视奸畜生或它们所制作的bot。\
逻辑如下：
1. 若该用户的follower数目大于100，则判断其不是拆腻子逼。
2. 否则，若该用户的follower数目小于5，则判断其为拆腻子逼。
3. 否则，若该用户的follower数目小于50，且follower/following数目之比小于0.05，则判断其为拆腻子逼。
4. 否则，说明没有根据判断该用户的类型，暂时判断该用户不是拆腻子逼。
### 移除
软件将拆腻子逼从你的粉丝中移除的方法如下：先block，再解block，过五秒（以免请求过于频繁被twitter官方橄榄）后开始处理下一位拆腻子逼。\
解block的操作只是为了不伤及无辜的善良twitter用户；如果您没有锁推，建议将解block的操作去掉，以防被移除的拆腻子逼卷土重来。
## 使用
需要安装node.js，同时需要获得twitter developer帐号。\
获得twitter developer帐号后，将config.js中的“待填写”改为你的twitter帐号的相应信息。\
然后在空文件夹下，依次运行npm init，npm install twit，npm install readline，再把index.js与config.js复制进去。\
最后运行node index.js即可。
## 待填坑的部分
其实有了Twitter API，我们可以写一些更多的内容，比如用户名里有拆腻子旗emoji或“孙笑川”等字符串、地点为China、简介中有“Chinese”等关键词的用户全部屏蔽（笑），或者ID为乱码的屏蔽。但是我懒，不想写了。
