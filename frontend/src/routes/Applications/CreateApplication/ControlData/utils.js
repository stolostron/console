export const getUniqueChannelName = (channelPath, groupControlData) => {
    //create a unique name for a new channel, based on path and type
    if (!channelPath || !groupControlData) {
      return ''
    }
  
    //get the channel type and append to url to make sure different type of channels are unique, yet using the same url
    const channelTypeSection = groupControlData.find(
      ({ id }) => id === 'channelType'
    )
  
    let channelTypeStr
    let channelType
    if (channelTypeSection) {
      channelTypeStr = _.get(channelTypeSection, 'active', [''])[0]
    }
  
    switch (channelTypeStr) {
    case 'github':
      channelType = 'g'
      break
    case 'helmrepo':
      channelType = 'h'
      break
    case 'objectstore':
      channelType = 'o'
      break
    default:
      channelType = 'ns'
    }
  
    let channelName = _.trim(channelPath)
    if (_.startsWith(channelName, 'https://')) {
      channelName = _.trimStart(channelName, 'https://')
    }
    if (_.startsWith(channelName, 'http://')) {
      channelName = _.trimStart(channelName, 'http://')
    }
    if (_.endsWith(channelName, '.git')) {
      channelName = _.trimEnd(channelName, '.git')
    }
  
    channelName = _.replace(channelName, /\./g, '')
    channelName = _.replace(channelName, /:/g, '')
    channelName = _.replace(channelName, /\//g, '-')
  
    channelName = _.trimEnd(channelName, '-')
    channelName = channelName.toLowerCase()
  
    //max name for ns or resources is 63 chars
    // trim channel name to max 58 char to allow a max of 63 char length
    //for the channel authentication (which is channelName-auth) object and channel ns (channelName-ns)
    if (channelName.length > 58) {
      channelName = channelName.substring(channelName.length - 56)
    }
    channelName = `${channelType}${channelName}`
  
    return channelName
  }