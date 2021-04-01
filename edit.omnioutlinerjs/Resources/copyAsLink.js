// This action copies the item link(s) for the selected row(s).
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		linksArray = []
		selection.items.forEach(function(item, index){
			itemLink = 'omnioutliner:///open?row=' + item.identifier
			if (index < selection.items.length - 1)
			itemLink += '\n'
			linksArray.push(itemLink)
		})
		Pasteboard.general.strings = linksArray
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.items.length > 0){return true} else {return false}
	};
	
	return action;
}();
_;