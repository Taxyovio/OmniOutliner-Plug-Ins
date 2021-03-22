// This action presents the item links from selected rows in Share Sheet.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		linksArray = []
		selection.items.forEach(function(item){
			itemLink = 'omnioutliner:///open?row=' + item.identifier
			linksArray.push(itemLink)
		})
		sharePanel = new SharePanel(linksArray)		
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