// This action presents the selected rows in chosen column as markdown file in Share Sheet.
// If there's no header markup (#) in any rows of the document in the chosen column, then the export adds # according to level to every selected row. Otherwise, only rows with # are exported with # according to level, while others are exported as body texts.
var _ = function() {
	var action = new PlugIn.Action(function(selection, sender) {
		const Lib = this.plugIn.library('ApplicationLib')
		var selectedItems = selection.items
		
		// List all visible text columns
		var editor = document.editors[0]
		var filteredColumns = columns.filter(function(column) {
			if (editor.visibilityOfColumn(column)) {
				if (column.type === Column.Type.Text) {return column}
			}
		})
		
		if (filteredColumns.length === 0) {
			throw new Error("This document has no text columns.")
		}
		
		
		var filteredColumnTitles = filteredColumns.map(function(column) {
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
		formPrompt = "Select Column"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject) {
			return null
		}
	
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject) {
			var selectedColumn = formObject.values["columnInput"]
			var strings = []
			// Get strings from all top level rows to see if there are markdown header markups
			rootItem.children.forEach(function(item) {
				if (selectedColumn === document.outline.outlineColumn) {
					strings.push(item.topic)
				} else if (selectedColumn === document.outline.noteColumn) {
					strings.push(item.note)
				} else {
					if (item.valueForColumn(selectedColumn)) {
						strings.push(item.valueForColumn(selectedColumn).string)
					}
				}
			})
			
			if (!hasHash(strings)) {
				strings = []
				selectedItems.forEach(function(item) {
					var level = item.level
					
					if (item.valueForColumn(selectedColumn)) {
						strings.push('#'.repeat(level + 1) + " " + Lib.textToMD(item.valueForColumn(selectedColumn)))
					} else {
						strings.push('#'.repeat(level + 1) + " " + '-'.repeat(level + 1) )
					}
					
				})
			} else {
				strings = []
				selectedItems.forEach(function(item) {
					var level = item.level
					
					if (item.valueForColumn(selectedColumn)) {
						if (/^#/.test(item.valueForColumn(selectedColumn).string)) {
							strings.push('#'.repeat(level + 1) + " " + Lib.textToMD(item.valueForColumn(selectedColumn)).replace(/^#+/, ''))
						} else {
							strings.push(Lib.textToMD(item.valueForColumn(selectedColumn)))
						}
					} else {
						strings.push('-'.repeat(level + 1))
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
		formPromise.catch(function(err) {
			console.log("form cancelled", err.message)
		})
	
	});
	
	
	
	action.validate = function(selection, sender) {
		if (selection.items.length > 0) {
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