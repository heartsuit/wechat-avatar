/**
 * Author: Heartsuit
 * Date: 2018-06-05
 * Email: nxq0108@126.com 
 * Blog: https://blog.csdn.net/u013810234，https://heartsuit.github.io/
 */
const fs = require('fs');
const sharp = require('sharp');

module.exports = {
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
                /* Fixed Total Size: Floor
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
                const size = 640;
                let eachsize = Math.floor(Math.sqrt((size * size) / (files.length)));
                let columns = Math.floor(size / eachsize);
                let x = 0;
                let y = 0;
                console.log(eachsize, columns, files.length, x, y);
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

    stitchFixedTotalSizeCeil: (dir) => {
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
                /* Fixed Total Size: Ceil
                                size  
                         —————————————————
                        |__|n             | 
                        | n               | 
                   size |                 |
                        |                 |
                        |                 |
                        |                 | 
                         —————————————————
                */
                const size = 640;
                let columns = Math.ceil(Math.sqrt(files.length));
                let eachsize = Math.floor(size / columns);
                let offset = Math.ceil(files.length / columns);

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
                            .extract({ left: 0, top: 0, width: eachsize * columns, height: eachsize * offset })
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

    stitchFixedEachSize: (dir) => {
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

                // 2. compute sizes
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
                const eachsize = 64;
                let columns = Math.floor(Math.sqrt(files.length));

                let width = columns * eachsize;
                // let offset = Math.ceil(files.length / columns) + (files.length % columns == 0 ? 0 : 1);                
                let offset = Math.ceil(files.length / columns);
                let height = eachsize * offset;

                // let height = width;
                // if (width * width < files.length * eachsize * eachsize) {
                //     let offset = Math.ceil((files.length - columns * columns) / columns);
                //     height = width + eachsize * offset;
                // }
                console.log(width, height, columns, files.length);
                let x = 0;
                let y = 0;

                // 3. prepare for composite
                const options = {
                    raw: {
                        width: width,
                        height: height,
                        channels: 4
                    }
                };
                const base = sharp({
                    create: {
                        width: width,
                        height: height,
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
                            width: width,
                            height: height,
                            channels: 4
                        }
                    }).toFile(result, function (err, output) {
                        if (err) {
                            console.log(err);
                        }
                        console.log(output);
                        resolve('friends.jpg');
                    });
                });
            } catch (err) {
                reject(err);
            }
        })
    },

    stitchFixedEachSizeCeil: (dir) => {
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

                // 2. compute sizes
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
                const eachsize = 64;
                let columns = Math.ceil(Math.sqrt(files.length));

                let width = columns * eachsize;
                // let offset = Math.floor(files.length / columns) + (files.length % columns == 0 ? 0 : 1);
                let offset = Math.ceil(files.length / columns);
                let height = eachsize * offset;

                let x = 0;
                let y = 0;

                // 3. prepare for composite
                const options = {
                    raw: {
                        width: width,
                        height: height,
                        channels: 4
                    }
                };
                const base = sharp({
                    create: {
                        width: width,
                        height: height,
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
                            width: width,
                            height: height,
                            channels: 4
                        }
                    }).toFile(result, function (err, output) {
                        if (err) {
                            console.log(err);
                        }
                        console.log(output);
                        resolve('friends.jpg');
                    });
                });
            } catch (err) {
                reject(err);
            }
        })
    }
}