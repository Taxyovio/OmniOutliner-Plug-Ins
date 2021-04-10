// This action presents the clipboard contents in Share Sheet.
var _ = function() {
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		
		var array = []
		
		Pasteboard.general.items.forEach((obj, index) => {
			var types = obj.types.filter(type => {
				return (type.identifier !== 'com.omnigroup.omnioutliner.pboard.xmloutline.items') && (type.identifier !== 'com.omnigroup.omnioutliner.pboard.items-v3') && (type.identifier !== 'com.omnigroup.omnistyle.pboard.xml')
			})
			
			// Construct new text obj
			if (types.length !== 0) {
				console.log('clipboard object ', index + 1, '/', Pasteboard.general.items.length, 'is of type', types)
				
				var textTypes = types.filter(type => {
					return (type.conformsTo(TypeIdentifier.plainText)) || (type.identifier === 'public.utf8-plain-text') || (type === TypeIdentifier.URL)
				})
				
				if (textTypes.length !== 0) {
					var str = ''
					if (textTypes.some(type => type.conformsTo(TypeIdentifier.plainText))) {
						str = obj.stringForType(types.find(type => type.conformsTo(TypeIdentifier.plainText)))
					} else if (obj.types.some(type => type.identifier === 'public.utf8-plain-text')) {
						str = obj.stringForType(types.find(type => type.identifier === 'public.utf8-plain-text'))
					} else if (obj.types.some(type => type === TypeIdentifier.URL)) {
						str = obj.stringForType(types.find(type => type === TypeIdentifier.URL))
					}
					array.push(str.trim())
				}
				
				var nonTextTypes = types.filter(type => {
					return (!type.conformsTo(TypeIdentifier.plainText)) && (type.identifier !== 'public.utf8-plain-text') && (type.identifier !== 'public.url')
				})
				
				if (nonTextTypes.length !== 0) {
					nonTextTypes.forEach((type, i) => {
						var fileExtension = type.pathExtensions[0]
						if (fileExtension) {
							var fileName = fileExtension.toUpperCase() + ' ' + index.toString() + i.toString() + '.' + fileExtension
						} else {
							var fileName = index.toString()
						}
						var newWrapper = FileWrapper.withContents(fileName, obj.dataForType(type))
						array.push(newWrapper)
					})
				}
				
			} else {
				console.log('clipboard object ', index + 1, '/', Pasteboard.general.items.length, 'has no valid type')
			}
		})
		
		var sharePanel = new SharePanel(array)
		sharePanel.show()
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(Pasteboard.general.items.length > 0) {return true} else {return false}
	};
	
	return action;
}();
_;