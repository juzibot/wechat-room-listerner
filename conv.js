/**
 *
 * a calss to maintain a conversation with a user
 * 
 *
*/
const sessions = ['groupName', 'groupNum', 'usrName', 'listening']


class Conv{

  constructor() {
    
    this.sessionID = 0
    this.room = ""
    this.listen_id = ""
  }

  get_session(){
    return sessions[this.sessionID]
  }

  toNext() {
    if(this.sessionID >= sessions.length - 1 )
      return false;

    this.sessionID++
    return this.get_session()
  } 

  toPrev() {
    if(this.sessionID <= 0 )
      return false;

    this.sessionID--
    return this.get_session()
  }

}

module.exports = Conv


