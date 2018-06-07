/**
 * Author: Heartsuit
 * Date: 2018-06-05
 * Email: nxq0108@126.com 
 * Blog: https://blog.csdn.net/u013810234，https://heartsuit.github.io/
 */
process.env['WECHATY_HEAD'] = 1; // show browser for qrcode scanning
const {
  Contact,
  Room,
  Wechaty,
  MediaMessage
} = require('wechaty');

const fs = require('fs');
const merge = require('./merge');
const uuidv1 = require('uuid/v1');

let bot = Wechaty.instance(); // Singleton
bot.on('scan', (url, code) => console.log(`Scan QR Code to login: ${code}\n${url}`))
  .on('login', async user => {
    // 0. Now the user has logged in, do WHATEVER you want..
    console.log(`User ${user} logined`);

    // 1. Create directory
    let dir = uuidv1(); // uuid, to name the avatar directory
    fs.mkdirSync(dir);

    // 2. Get and save all personal firends' avatars
    let count = 0; // used as the name of avatar
    await saveAvatar(user, `./${dir}/${count++}.jpg`); // first image is your own avatar

    let contacts = await Contact.findAll();
    for (let c of contacts) {
      if (c.personal()) {
        console.log(count, '城市:', await c.city(), '性别:', await c.gender());
        // console.log(count, await c.name(), await c.province(), await c.city(), await c.gender())
        await saveAvatar(c, `./${dir}/${count++}.jpg`);
      }
    }

    // 3. Stitch all the avatars into one
// let result = await merge.stitchFixedTotalSize(dir); // NOT precise, NOT recommended
// let result = await merge.stitchFixedTotalSizeCeil(dir);
// let result = await merge.stitchFixedEachSize(dir);
    let result = await merge.stitchFixedEachSizeCeil(dir);

    // 4. Send the generated image to your wechat
    await bot.say(new MediaMessage(`${dir}/${result}`));
    await bot.say('Generated by Heartsuit, Powered by wechaty and sharp.');

    // 5. Stop and Exit
    // bot.stop();
    // process.exit(0);
  })
  .on('message', async (message) => {
    let sender = message.from();
    console.log(`From: ${sender.name()}——>${message}`);

    let room = message.room();
    if (!room) {
      return;
    }
    console.log(`Topic: ${room.topic()}`);
  })
  .start()
  .catch(e => {
    bot.quit();
    process.exit(-1);
  })

function saveAvatar(contact, filepath) {
  return new Promise(async (resolve, reject) => {
    try {
      const avatarFileName = filepath;
      const avatarReadStream = await contact.avatar();
      const avatarWriteStream = fs.createWriteStream(avatarFileName);
      avatarReadStream.pipe(avatarWriteStream);
      resolve();
    } catch (err) {
      reject(err);
    }
  })
}