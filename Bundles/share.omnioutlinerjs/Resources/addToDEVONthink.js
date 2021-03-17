// This action creates a new text file in DEVONthink To Go from the selected row using URL schemes. Document name is passed as text title. Topic is passed as text body. Note is passed as comment. Item link is passed as URL.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		selection.items.forEach(function(item){
			try {title = document.name} catch(err){title = ''}
			try {text = item.topic} catch(err){text = ''}
			try {comment = item.note} catch(err){comment = ''}
			itemLink = 'omnioutliner:///open?row=' + item.identifier
			itemLink = encodeURIComponent(itemLink)
			title = encodeURIComponent(title)
			if(text != ''){
				text = encodeURIComponent(text)
				urlStr = "x-devonthink://createtext?title=" + title + "&text=" + text + "&location=" + itemLink
				if (comment != ''){
					comment = encodeURIComponent(comment)
					urlStr = urlStr + "&comment=" + comment
				}
				url = URL.fromString(urlStr).call(function(result){})
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