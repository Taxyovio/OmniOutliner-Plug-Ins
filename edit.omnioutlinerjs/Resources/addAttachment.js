// This action inserts texts at the end or start of the selected column of selected rows.
(() => {
	var action = new PlugIn.Action(function(selection, sender){
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles
		var selectedItem = selection.items[0]
		
		// List all visible text columns for insertion
		editor = document.editors[0]
		var filteredColumns = columns.filter(function(column){
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
		
		
		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form()
		
		if (filteredColumns.includes(document.outline.outlineColumn)) {
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
			var picker = new FilePicker()
			picker.folders = false
			picker.multiple = true
			picker.types = null
			
			pickerPromise = picker.show()
			
			// PROMISE FUNCTION CALLED UPON PICKER APPROVAL
			pickerPromise.then(function(urlsArray){
				urlsArray.forEach(url => {
					urlStr = url.string
					// GET FILE NAME
					var filename = urlStr.substring(urlStr.lastIndexOf('/')+1)
					// REMOVE FILE EXTENSION AND ENCODING
					var baseName = filename.substring(0,filename.lastIndexOf('.'))
					baseName = decodeURIComponent(baseName)
					// IMPORT FILES
					url.fetch(function(data){
						wrapper = FileWrapper.withContents(filename,data)
						ogText = selectedItem.valueForColumn(selectedColumn)
						if (ogText !== null) {
							textObj = Text.makeFileAttachment(wrapper, ogText.style)
							ogText.append(textObj)
						} else {
							textObj = Text.makeFileAttachment(wrapper, selectedItem.style)
							selectedItem.setValueForColumn(textObj, selectedColumn)
						}
					})
				})
			})

			// PROMISE FUNCTION CALLED UPON PICKER CANCELLATION
			pickerPromise.catch(function(error){
				console.log("form cancelled", error.message)
			})		
			// Work around a bug that crops images by forcing UI to update
			var ogAlignment = selectedColumn.textAlignment
			if (ogAlignment === TextAlignment.Natural) {
				selectedColumn.textAlignment = TextAlignment.Left
			} else {
				selectedColumn.textAlignment = TextAlignment.Natural
			}
			selectedColumn.textAlignment = ogAlignment
		})
		
		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function(err){
			console.log("form cancelled", err.message)
		})
	});

	action.validate = function(selection, sender) {
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.nodes.length === 1){return true} else {return false}
	};
	
	return action;
})();