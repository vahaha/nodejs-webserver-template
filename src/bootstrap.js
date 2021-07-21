require('./configs') // init config. this line must to be on top required.
const connections = require('./connections')

exports.load = async () => {
    await connections.initConnections()
    
    return
}
