// This action creates a new task into the inbox of Things from the selected row using URL schemes. Topic is passed as task title. Note and item link are passed to task notes.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		selection.items.forEach(function(item){
			try {taskName = item.topic} catch(err){taskName = ''}
			try {taskNote = item.note} catch(err){taskNote = ''}
			itemLink = 'omnioutliner:///open?row=' + item.identifier
			itemLink = encodeURIComponent(itemLink)
			if(taskName != ''){
				taskName = encodeURIComponent(taskName)
				urlStr = "things:///add?title=" + taskName
				if (taskNote != ''){
					taskNote = encodeURIComponent(taskNote)
					urlStr = urlStr + "&notes=" + itemLink+ "%0A%0A" + taskNote
				} else {
					urlStr = urlStr + "&notes=" + itemLink
				}
				URL.fromString(urlStr).call(function(result){})
			}
		})
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.items.length === 1){return true} else {return false}
	};
	
	return action;
}();
_;