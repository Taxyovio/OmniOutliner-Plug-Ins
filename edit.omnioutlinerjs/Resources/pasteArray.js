// This action pastes the array of objects from Clipboard into the selected column of the selected row.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		var objects = Pasteboard.general.items
		var objsLen = objects.length
		var selectedItem = selection.items[0]
		var selectedItemParent = selectedItem.parent

		
			
		// List all visible text columns for insertion
		editor = document.editors[0]
		filteredColumns = columns.filter(function(column){
			if (editor.visibilityOfColumn(column)){
				if (column.type === Column.Type.Text){return column}
			}
		})
		
		if (filteredColumns.length === 0) {
			throw new Error("This document has no text columns.")
		}
		
		filteredColumnTitles = filteredColumns.map(function(column){
			if (column.title !== ''){
				return column.title
			} else if (column === document.outline.noteColumn){
			// The note column has empty title for unknown reason
				return 'Notes'
			}
		})
		
		// Rename columns with the same titles
		filteredColumnTitles = renameStrings(filteredColumnTitles)
		filteredColumns.forEach((column,index) => {
			if (column.title !== ''){
				if (column.title !== filteredColumnTitles[index]) {
					column.title = filteredColumnTitles[index]
				}
			}
		})
		
		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form()
		
		// CREATE TEXT FIELD
		
		var columnField = new Form.Field.Option(
			"columnInput",
			"Column",
			filteredColumns,
			filteredColumnTitles,
			document.outline.outlineColumn
		)
		
		// ADD THE FIELDS TO THE FORM
		inputForm.addField(columnField)
		// PRESENT THE FORM TO THE USER
		formPrompt = "Select Column:"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject){
			return null
		}
	
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject){
			var selectedColumn = formObject.values["columnInput"]
			var valueForColumn = selectedItem.valueForColumn(selectedColumn)
			
			if (valueForColumn !== null) {
				var text = valueForColumn
			} else {
				var text = new Text('', document.outline.baseStyle)
			}
			objects.forEach((obj, index) => {
				console.log(index, obj.types)
				var separator = new Text('\n\n', text.style)
				if (valueForColumn !== null && index === 0) {
					var lastPar = valueForColumn.paragraphs[valueForColumn.paragraphs.length - 1]
					if ((lastPar.string !== null && /\S/.test(lastPar.string)) || lastPar.attachments !== null) {
						text.append(separator)
					}
				}
				// Filter out proprietary Pasteboard.Item types
				var types = obj.types.filter(type => {
					return (type.identifier !== 'com.omnigroup.omnioutliner.pboard.xmloutline.items') && (type.identifier !== 'com.omnigroup.omnioutliner.pboard.items-v3') && (type.identifier !== 'com.omnigroup.omnistyle.pboard.xml')
				})
				var fileTypes = types.filter(type => {
					return (type.pathExtensions.length > 0) && (type.identifier !== 'public.plain-text') && (type.identifier !== 'public.utf8-plain-text') && (type.identifier !== 'public.rtf') && (type.identifier !== 'public.url')
				})
				if (types.some(type => type.identifier === 'public.plain-text')) {
					var str = obj.stringForType(types.find(type => type.identifier === 'public.plain-text'))
					var newText = new Text(str, text.style)
					text.append(newText)
					if ((fileTypes.length > 0) || (index < objsLen - 1)) {
						text.append(separator)
					}
				} else if (obj.types.some(type => type.identifier === 'public.utf8-plain-text')) {
					var str = obj.stringForType(types.find(type => type.identifier === 'public.utf8-plain-text'))
					var newText = new Text(str, text.style)
					text.append(newText)
					if ((fileTypes.length > 0) || (index < objsLen - 1)) {
						text.append(separator)
					}
				}
				fileTypes.forEach((type, i) => {
					var fileExtension = fileTypes[i].pathExtensions[0]
					var fileName = fileExtension.toUpperCase() + ' ' + index.toString() + i.toString() + '.' + fileExtension
					var newWrapper = FileWrapper.withContents(fileName, obj.dataForType(type))
					var newFile = Text.makeFileAttachment(newWrapper, text.style)
					text.append(newFile)
					if ((i < fileTypes.length - 1) || (index < objsLen - 1)) {
						text.append(separator)
					}
				})
			})
			
			// Remove trailing white spaces
			trailingSpaceRange = text.find('\\s+$', [Text.FindOption.RegularExpression], null)
			if (trailingSpaceRange !== null) {
				text.remove(trailingSpaceRange)
			}
			
			selectedItem.setValueForColumn(text, selectedColumn)
		})
		
		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function(err){
			console.log("form cancelled", err.message)
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

function renameStrings(arr){
	var count = {}
	arr.forEach(function(x, i) {
		if (arr.indexOf(x) !== i) {
			var c = x in count ? count[x] = count[x] + 1 : count[x] = 1
			var j = c + 1
			var k = x + ' ' + j
			while(arr.indexOf(k) !== -1) k = x + ' ' + (++j)
			arr[i] = k
		}
	})
	return arr
}