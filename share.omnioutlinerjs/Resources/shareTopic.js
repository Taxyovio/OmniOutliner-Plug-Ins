// This action presents the Topic texts from selected rows in Share Sheet.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		topicsArray = []
		selection.items.forEach(function(item){
			topicsArray.push(item.topic)
		})
		sharePanel = new SharePanel(topicsArray)		
		sharePanel.show()
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.items.length > 0){return true} else {return false}
	};
	
	return action;
}();
_;