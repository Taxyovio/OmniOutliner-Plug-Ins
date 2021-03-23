// This action presents the selected rows in chosen column as markdown file in Share Sheet.
// If there's no header markup (#) in any rows of the document in the chosen column, then the export adds # according to level to every selected row. Otherwise, only rows with # are exported with # according to level, while others are exported as body texts.
var _ = function() {
	var action = new PlugIn.Action(function(selection, sender){
		var selectedItems = selection.items
		
		if (selectedItems.length < 2) {
			var alertTitle = "Confirmation"
			var alertMessage = "Export the whole document?"
			var alert = new Alert(alertTitle, alertMessage)
			alert.addOption("Continue")
			alert.addOption("Stop")
			var alertPromise = alert.show()
			
			alertPromise.then(buttonIndex => {
				if (buttonIndex === 0){
					console.log("Continue script")
					selectedItems = rootItem.descendants
				} else {
					throw new Error('script cancelled')
				}
			})
		}
	
		// List all visible text columns
		var editor = document.editors[0]
		var filteredColumns = columns.filter(function(column){
			if (editor.visibilityOfColumn(column)){
				if (column.type === Column.Type.Text){return column}
			}
		})
		
		if (filteredColumns.length === 0) {
			throw new Error("This document has no text columns.")
		}
		
		
		var filteredColumnTitles = filteredColumns.map(function(column){
			if (column.title !== ''){
				return column.title
			} else if (column === document.outline.noteColumn){
			// The note column has empty title for unknown reason
				return 'Notes'
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
			var strings = []
			// Get strings from all top level rows to see if there are markdown header markups
			rootItem.children.forEach(function(item){
				if (selectedColumn === document.outline.outlineColumn) {
					strings.push(item.topic)
				} else if (selectedColumn === document.outline.noteColumn) {
					strings.push(item.note)
				} else {
					if (item.valueForColumn(selectedColumn) !== null) {
						strings.push(item.valueForColumn(selectedColumn).string)
					}
				}
			})
			
			if (!hasHash(strings)) {
				strings = []
				selectedItems.forEach(function(item){
					var level = item.level
					if (selectedColumn === document.outline.outlineColumn) {
						strings.push('#'.repeat(level + 1) + " " + item.topic)
					} else if (selectedColumn === document.outline.noteColumn) {
						strings.push('#'.repeat(level + 1) + " " + item.note)
					} else {
						if (item.valueForColumn(selectedColumn) !== null) {
							strings.push('#'.repeat(level + 1) + " " + item.valueForColumn(selectedColumn).string)
						} else {
							strings.push('#'.repeat(level + 1) + " " + '-'.repeat(level + 1) )
						}
					}
				})
			} else {
				strings = []
				selectedItems.forEach(function(item){
					var level = item.level
					if (selectedColumn === document.outline.outlineColumn) {
						if (/^#/.test(item.topic)) {
							strings.push('#'.repeat(level + 1) + " " + item.topic.replace(/^#+/, ''))
						} else {
							strings.push(item.topic)
						}
					} else if (selectedColumn === document.outline.noteColumn) {
						if (/^#/.test(item.note)) {
							strings.push('#'.repeat(level + 1) + " " + item.note.replace(/^#+/, ''))
						} else {
							strings.push(item.note)
						}
					} else {
						if (item.valueForColumn(selectedColumn) !== null) {
							if (/^#/.test(item.valueForColumn(selectedColumn).string)) {
								strings.push('#'.repeat(level + 1) + " " + item.valueForColumn(selectedColumn).string.replace(/^#+/, ''))
							} else {
								strings.push(item.valueForColumn(selectedColumn).string)
							}
						} else {
							strings.push('-'.repeat(level + 1))
						}
					}
				})
			}
			
			strings.unshift('# ' + document.name)
			var data = Data.fromString(strings.join("\n"))
			var fileWrapper = FileWrapper.withContents(document.name + '.md', data)
			sharePanel = new SharePanel([fileWrapper])
			sharePanel.show()
			
			
		})
		
		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function(err){
			console.log("form cancelled", err.message)
		})
	
	});
	
	
	
	action.validate = function(selection, sender){
		if(typeof rootItem !== 'undefined') {
			if (rootItem.descendants.length > 0){
				return true
			}
		} else if (selection.items.length > 1) {
			return true
		} else {
			return false
		}
	}
	return action
}();
_;

function hasHash(arr) {
	for (var i = 0; i < arr.length; i++) {
		if (/^#/.test(arr[i])) {
			return true
		}
	}
	return false
}