// This action presents texts of the entire document in Share Sheet.
var _ = function() {
  var action = new PlugIn.Action(function(selection, sender){
    var topics = new Array()
    rootItem.descendants.forEach(function(item){
        level = item.level
        itemString = '#'.repeat(level) + " " + item.topic
        topics.push(itemString)
        
        noteString = '\n'
        if(item.note) {
            noteString = noteString + item.note + '\n'
        }
        topics.push(noteString)
    })
    sharePanel = new SharePanel([topics.join("\n")])
    sharePanel.show()
  });
  
  action.validate = function(selection, sender){
    if(typeof rootItem !== 'undefined') {
		if (rootItem.descendants.length > 0){
			return true
		} else {
			return false
		}
	}
  }
  
  return action
}();
_;