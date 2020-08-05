# Project FCF (Fuck Chinese Followers - 操死拆腻子逼)
## 介绍
今天晚上玩了砍口垒之后没事干写了个屏蔽拆腻子视奸号的小脚本。当然代码可读性是我一贯的风格。
## 使用
需要安装node.js，同时需要获得twitter developer帐号。\
获得twitter developer帐号后，将config.js中的“待填写”改为你的twitter帐号的相应信息。\
然后在空文件夹下，依次运行npm init，npm install twit，npm install readline，再把index.js与config.js复制进去。\
最后运行node index.js即可。
## 待填坑的部分
其实有了Twitter API，我们可以写一些更多的内容，比如用户名里有拆腻子旗emoji或“孙笑川”等字符串、地点为China、简介中有“Chinese”等关键词的用户全部屏蔽（笑），或者ID为乱码的屏蔽。但是我懒，不想写了。
