// This action pastes the array of objects from Clipboard into separate rows.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		objects = Pasteboard.general.items
		var selectedItem = selection.items[0]
		var selectedItemParent = selectedItem.parent
		objects.slice().reverse().forEach((obj,index) => {
			types = obj.types
			selectedItemParent.addChild(
				selectedItem.after,
				function(item){
					if (types.some(type => type.identifier === 'public.plain-text')) {
						item.topic = obj.stringForType(types.find(type => type.identifier === 'public.plain-text'))
					} else if (obj.types.some(type => type.identifier === 'public.utf8-plain-text')) {
						item.topic = obj.stringForType(types.find(type => type.identifier === 'public.utf8-plain-text'))
					} else {
						var fileExtension = types[0].pathExtensions[0]
						var fileName = index.toString() + '.' + fileExtension
						console.log(types)
						var newWrapper = FileWrapper.withContents(fileName, obj.dataForType(types[0]))
						console.log(newWrapper)
						var textObj = Text.makeFileAttachment(newWrapper, document.outline.baseStyle)
						console.log(textObj)
						item.setValueForColumn(textObj, document.outline.outlineColumn)
					}
					
				}
			)
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