![2018-06-06-MicrosoftGithub.jpg](https://github.com/heartsuit/heartsuit.github.io/raw/master/pictures/2018-06-06-MicrosoftGithub.jpg)


> Github被Microsoft收购，Node也要倒过来了Deno... 最近新鲜事儿着实不少。。

### 背景

知乎上有个问题[Python 里itchat 模块能实现什么有趣的东西？](https://www.zhihu.com/question/59524525)

从中看到 [wxImage
](https://github.com/gzm1997/wxImage) 这个项目。基于Python下大名鼎鼎的`itchat`实现。

让我想到了Node 下的Wechaty，之前曾用其做消息转发，这次随手拿来玩一玩，此处采用Node来实现好友头像拼接这一效果。

PS: 虽然拼接好友头像后并没什么意义，然而这个想法很有意思，自己玩一玩还是不错的，顺便可以了解下node的生态。

### 效果展示

- 先上结果图

![2018-06-06-FriendsRefined](https://github.com/heartsuit/heartsuit.github.io/raw/master/pictures/2018-06-06-FriendsRefined.jpg)

![2018-06-06-FriendsRefined1](https://github.com/heartsuit/heartsuit.github.io/raw/master/pictures/2018-06-06-FriendsRefined1.jpg)

- 再来一波动图

![2018-06-06-FriendsAvatar](https://github.com/heartsuit/heartsuit.github.io/raw/master/pictures/2018-06-06-FriendsAvatar.gif)

### 站在巨人的肩膀上
- 用到的轮子
1. [wechaty](https://github.com/Chatie/wechaty)
2. [sharp](https://github.com/lovell/sharp)
3. `uuid`

通过以上npm 包，可实现这一功能。

目前还是使用wechaty内置浏览器的方式显示、扫描二维码，效果比较直观；也可采用`qrcode-terminal`，将二维码显示在终端，方便操作。

### 代码解析

这里通过两种设计方式实现了小图片拼接为大图片：

- 采用类似于[wxImage
](https://github.com/gzm1997/wxImage)的方式布局最后生成的合成图片，思路：底部背景固定大小，动态计算每个小头像的大小。

Note：由于限定背景大小，同时采用了开方加取整操作，导致因好友数量不同而出现以下问题：
1. 右侧多出一部分背景；———这可以通过裁减图片解决
2. 最后一行头像显示不全；———这是设计方式、计算方法的问题（向下取整导致背景不足以容纳所有的头像）

``` javascript
 /* Fixed Total Size
 take advantage of the Mathematics theory: Same area
                 size  
          —————————————————
         |__|n             | 
         | n               | 
    size |                 |      Area: size^2 = n^2 * numberOfImages 
         |                 |            
         |                 |
         |                 | 
          —————————————————
 */

 stitchFixedTotalSize: (dir) => {
        return new Promise((resolve, reject) => {
            try {
                // 1. get avatar list
                dir = dir.endsWith('/') ? dir : dir + '/';
                let files = fs.readdirSync(dir);
                files = files.filter((item) => {
                    return fs.statSync(dir + item).size != 0; // remove empty image
                }).map((item) => {
                    return item = dir + item;
                })

                const result = dir + 'friends.jpg';
                const refined = dir + 'friends-refined.jpg';

                // 2. compute sizes
                /* Fixed Total Size
                take advantage of the Mathematics theory: Same area
                                size  
                         —————————————————
                        |__|n             | 
                        | n               | 
                   size |                 |      Area: size^2 = n^2 * numberOfImages 
                        |                 |            (here, n is eachsize)
                        |                 |
                        |                 | 
                         —————————————————
                */
                let eachsize = Math.floor(Math.sqrt((size * size) / (files.length)));
                let columns = Math.floor(size / eachsize);
                let x = 0;
                let y = 0;

                // 3. prepare for composite
                const options = {
                    raw: {
                        width: size,
                        height: size,
                        channels: 4
                    }
                };
                const base = sharp({
                    create: {
                        width: size,
                        height: size,
                        channels: 4,
                        background: { r: 0, g: 0, b: 0, alpha: 128 }
                    }
                }).raw().toBuffer();

                // 4. do images composite
                const composite = files.reduce(function (input, overlay) {
                    return input.then(async function (data) {
                        let temp = sharp(data, options).overlayWith(await sharp(overlay).resize(eachsize, eachsize).toBuffer(), { top: eachsize * y, left: eachsize * x }).raw().toBuffer();
                        x += 1;
                        if (x == columns) {
                            x = 0;
                            y += 1;
                        }
                        return temp;
                    });
                }, base);

                // data contains the multi-composited image as raw pixel data
                composite.then(function (data) {
                    sharp(data, {
                        raw: {
                            width: size,
                            height: size,
                            channels: 4
                        }
                    }).toFile(result, function (err, output) {
                        if (err) {
                            console.log(err);
                        }
                        console.log(output);

                        // 5. cut, extract a region of the input image, saving in the same format.
                        sharp(result)
                            .extract({ left: 0, top: 0, width: eachsize * columns, height: eachsize * columns })
                            .toFile(refined, function (err, output) {
                                if (err) {
                                    console.log(err);
                                }
                                console.log(output);
                                resolve('friends-refined.jpg');
                            });
                    });
                });
            } catch (err) {
                reject(err);
            }
        })
    },
```

后来分析发现，在固定背景图大小的情况下，如果换一种方式，可保证所有头像都被包含进来，即采用向上取整，具体代码见`merge.js`里的`stitchFixedTotalSizeCeil`方法。

缺点：合成后的图片可能需要裁减，这是因为限定了背景图大小，不可避免。

- 采用固定每张小头像的尺寸的方法，这里设为64px，动态计算并设置背景图的宽、高。

相比上一种算法的优点是：动态设置背景图大小，无需再做裁减。代码此处省略，见源码。

`merge.js`里的方法：

1. `stitchFixedEachSize`：每行放的头像数向下取整，下方动态补齐高度

``` javascript
 /* Fixed eachsize: Floor
                width  
          —————————————————
         |__|64            | 
         |64               | 
  height |                 |     
         |                 |
         |                 |
         |                 | 
          —————————————————
         |_________________| 
 */
```

2. `stitchFixedEachSizeCeil`：每行放的头像数向上取整，下方动态减掉高度

``` javascript
/* Fixed eachsize: Ceil
               width  
         —————————————————
        |__|64            | 
        |64               | 
 height |                 |     
        |                 |
        |                 |
       -|-----------------|- 
         —————————————————
*/
```

### 自由发挥
可以发布一个站点到云服务器，扫一扫后就可以获得拼接后的好友头像。
关于web微信的接口，可玩的有不少，有时候自己就是想不到，这时就要借鉴其他人了，参考上面的知乎链接。

还是那句话：

> When you have an idea, make it happen.

### Reference
[wxImage
](https://github.com/gzm1997/wxImage)
[Blog](https://blog.csdn.net/u013810234/article/details/80600115)

### Source Code: [Microsoft Github](https://github.com/heartsuit/wechat-avatar)