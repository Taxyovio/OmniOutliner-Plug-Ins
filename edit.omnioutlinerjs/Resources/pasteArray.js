// This action pastes the array of objects from Clipboard into the selected column of the selected rows.
var _ = function() {
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		var array = Pasteboard.general.items
		var arrayLength = array.length
		
		var items = selection.items
		var itemsLength = items.length
		
		// The number of items get pasted is limited by both array length and selection length
		if (arrayLength > itemsLength) {
			var length = itemsLength
			array = array.slice(0, length)
		} else {
			var length = arrayLength
			items = items.slice(0, length)
		}
		
		// List all visible text columns for insertion
		editor = document.editors[0]
		filteredColumns = columns.filter(function(column) {
			if (editor.visibilityOfColumn(column)) {
				if (column.type === Column.Type.Text) {return column}
			}
		})
		
		if (filteredColumns.length === 0) {
			throw new Error("This document has no visible text columns.")
		}
		
		filteredColumnTitles = filteredColumns.map(function(column) {
			if (column.title !== '') {
				return column.title
			} else if (column === document.outline.noteColumn) {
			// The note column has empty title for unknown reason
				return 'Notes'
			}
		})
		
		
		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form()
		
		// CREATE TEXT FIELD
		
		if (filteredColumns.indexOf(document.outline.outlineColumn) !== -1) {
			var defaultColumn = document.outline.outlineColumn
		} else {
			var defaultColumn = document.outline.noteColumn
		}
		
		var columnField = new Form.Field.Option(
			"columnInput",
			"Column",
			filteredColumns,
			filteredColumnTitles,
			defaultColumn
		)
		
		// Override or append to existing contents
		var overrideToggle = new Form.Field.Checkbox(
			"overrideInput",
			"Override",
			false
		)
		
		// ADD THE FIELDS TO THE FORM
		inputForm.addField(columnField)
		inputForm.addField(overrideToggle)
		// PRESENT THE FORM TO THE USER
		formPrompt = "Paste Array to Column"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject) {
			return null
		}
	
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject) {
			var column = formObject.values["columnInput"]
			var override = formObject.values["overrideInput"]
			
			array.forEach((obj, index) => {
				var item = items[index]
				
				var ogText = item.valueForColumn(column)
				
				if (ogText) {
					var style = ogText.style
				} else {
					var style = item.style
				}
				
				var newText = new Text('', style)
				var newTextIsEmpty = true
				// Filter out proprietary Pasteboard.Item types
				var types = obj.types.filter(type => {
					return (type.identifier !== 'com.omnigroup.omnioutliner.pboard.xmloutline.items') && (type.identifier !== 'com.omnigroup.omnioutliner.pboard.items-v3') && (type.identifier !== 'com.omnigroup.omnistyle.pboard.xml')
				})
				
				// Construct new text obj
				if (types.length !== 0) {
					console.log('clipboard object ', index + 1, '/', length, 'is of type', types)
					
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
						str = str.trim()
						if (str) {
							var text = new Text(str, style)
							newText.append(text)
							newTextIsEmpty = false
						}
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
							var newFile = Text.makeFileAttachment(newWrapper, style)
							newText.append(newFile)
							newTextIsEmpty = false
						})
					}
					
				} else {
					console.log('clipboard object ', index + 1, '/', length, 'has no valid type')
				}
				
				// Modify items
				if (override) {
					item.setValueForColumn(newText, column)
				} else {
					if (ogText) {
						console.log(newTextIsEmpty,ogText.string.slice(-1).match(/\s/))
						if (!ogText.string.slice(-1).match(/\s/) && !newTextIsEmpty) {
							var space = new Text(' ', style)
							ogText.append(space)
						}
						ogText.append(newText)
					} else {
						item.setValueForColumn(newText, column)
					}
				}
			
			})
			
		})
		
		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function(err) {
			console.log("form cancelled", err.message)
		})
	});
	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.items.length > 0) {return true} else {return false}
	};
	
	return action;
}();
_;