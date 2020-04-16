/**
 * Wechaty linstener bot
 * Listen a specific user in a room and forward to listener
 * To start the bot, input the key word "ohi" to start a conversation
 * When listening, send a random message to the bot to stop it. 
 *
 * Next step:
 *		optimize the code
 *		start multiple listener for one user	
 *		maintain a roomlist to improve speed
 *		dealing with err input smoothly
 *		privacy: only let users listen the group they within 
 *
 */
const qrTerm = require('qrcode-terminal')
const { PuppetPadplus } = require('wechaty-puppet-padplus')
const {
  config,
  Contact,
  Room,
  log,
  Wechaty,
  Friendship,
}             = require('wechaty')

const util = require('util')

const token = ''
const puppet = new PuppetPadplus({
  token,
})

const name  = 'pBot'

const bot = new Wechaty({
  puppet,
  name, 
})

/**
 *
 * init listerer data structures
 *
 */
const Conv = require('./conv.js')
const map = new Map()
const fuunc_map = new Map()

/**
 *
 * Register event handlers
 *
 */
bot
.on('logout', onLogout)
.on('login',  onLogin)
.on('scan',   onScan)
.on('error',  onError)
.on('message', onMessage)
.on('friendship',onFriendship)

/**
 *
 * Start the bot
 *
 */
bot.start()
.catch(async e => {
  console.error('Bot start() fail:', e)
  await bot.stop()
  process.exit(-1)
})

/**
 *
 * Define Event Handler Functions
 *
 */

function onScan (qrcode, status) {
  qrTerm.generate(qrcode, { small: true })

  // Generate a QR Code online via
  // http://goqr.me/api/doc/create-qr-code/
  const qrcodeImageUrl = [
    'https://api.qrserver.com/v1/create-qr-code/?data=',
    encodeURIComponent(qrcode),
  ].join('')

  console.log(`[${status}] ${qrcodeImageUrl}\nScan QR Code above to log in: `)
}

function onLogin (user) {
  console.log(`${user.name()} login`)
  bot.say('Wechaty login').catch(console.error)
}

function onLogout (user) {
  console.log(`${user.name()} logouted`)
}

function onError (e) {
  console.error('Bot error:', e)
}

/**
 *
 * Receive a message from a group
 * Code defined in previous section
 * const Conv = require('./conv.js') -> conversation class
 * const map = new Map()             -> a map store all the sessions
 * const fuunc_map = new Map()       -> a map store all linstener functions
 *
 */

async function onMessage (msg) {
  console.log(msg.toString())

  if (msg.age() > 3 * 60) {
    console.log('Message discarded because its TOO OLD(than 3 minute)')
    return
  }

  const room = msg.room()
  const from = msg.from()
  const text = msg.text()

  if (!from){
     return
  }

  try {

    //receive a person msg
    if( !room ){
    	const id = from.id

      //check the key word and output according to current state
    	if(map.get(id) != null || /ohi/i.test(text)){

    		if(map.get(id) == null){
    			map.set(id, new Conv)
    		}
    		curr_conv = map.get(id)
        console.log("current session: " + curr_conv.get_session())
		    switch(curr_conv.get_session()){

          //output room names
		      case 'groupName':
		      	roomList = await bot.Room.findAll() 
		      	res = "请输入房间编号\n"
		      	for( i in roomList ){
		      		res += `  ${i}.  ${await roomList[i].topic()} \n`
		      	}
				    await from.say(res)
            curr_conv.toNext()
            console.log(curr_conv.get_session())
		        break

          //receive a room name, output select target room 
		      case 'groupNum':
            roomList = await bot.Room.findAll() 
            try{
              curr_conv.room = roomList[text]
              curr_conv.toNext()
              await from.say("请输入目标微信名")
            }
            //back to previous state if error
            catch(e){
              //curr_conv.toPrev()
              map.delete(id)
              await from.say("房间号错误，会话初始化")
            }
		      	break

          //receive a usr name, start listening
		      case 'usrName':
            try{
              curr_conv.listen_id = await curr_conv.room.member({name: text})
              //start listening if found
              if(curr_conv.listen_id != null){
                await from.say("启动监听程序，输入任意字符停止监听")
                //add listener function
                datas = {
                  roomName: curr_conv.room.topic(),
                  listenID: text,
                  listener: id
                }
                var listener = onMessageListen.bind(datas)
                bot.addListener('message', listener)
                fuunc_map.set(id, listener)
                curr_conv.toNext()
              }
              else
                throw new Error('no listen_id')
            }
            catch(e){
              //urr_conv.toPrev()
              map.delete(id)
              await from.say("微信名错误，会话初始化")
            }
		      	break

		      case 'listening':
            //remove listener function
            map.delete(id)
            await bot.removeListener('message', await fuunc_map.get(id))
            await fuunc_map.delete(id)
            await from.say("监听结束，愿人类荣光永存")
		      	break

		    }
    	}



      	return
    }

  } 
  catch (e) {
    log.error(e)
  }
}


/**
 *
 * Listener function that needed to bind with a datastructure with:
 *       roomName: target room
 *       listenID: id of the target
 *       listener: listener
 *
 */
async function onMessageListen (msg) {
  //console.log("listening: " + await this.roomName)
  if (msg.age() > 3 * 60) {
    console.log('Message discarded because its TOO OLD(than 3 minute)')
    return
  }

  const room = msg.room()
  const from = msg.from()
  const text = msg.text()
  if (!from || !room){
     return
  }
  try{
    // receive a group msg
    const topic = await room.topic()
    if( topic == await this.roomName && from.name() == await this.listenID ){
        const master = await bot.Contact.find({id: await this.listener})
        console.log("listening: " + await this.listener)
        master.say("Msg from: "+ from.name() + "\nContent: " + text);
    }

  }
  catch (e) {
    log.error(e)
  }
}

/**
 *
 * Receive a ship of friendship
 *
 */

async function onFriendship (ship) {
  //const contact = ship.contact()
  const contact = ship.contact()
  const name = contact.id
  console.log(`received friend event from ${name}`)
  try {
    switch (ship.type()) {

    // 1. New Friend Request

    case Friendship.Type.Receive:
      await ship.accept()
      // if want to send msg , you need to delay sometimes
      await new Promise(r => setTimeout(r, 1000))
      contact.say('Helle Wordl! I\'m your dumb bot friend')
      break

    // 2. Friend Ship Confirmed
    case Friendship.Type.Confirm:
      console.log(`friendship with id: ${name} confirmed`)
      break
    }

  } catch (e) {
    console.error(e)
  }

}
