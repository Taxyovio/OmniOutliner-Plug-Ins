// This action counts the total number of characters in the topic column for the selected rows.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		var characterCount = 0
		
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
		inputForm.validate = function(formObject){
			return null
		}
	
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject){
			var selectedColumn = formObject.values["columnInput"]
			
			selection.items.forEach(function(item){
				var textObj = item.valueForColumn(selectedColumn)
				if (textObj) {
					characterCount = characterCount + textObj.characters.length
				}
			})
			alert = new Alert('Character Count', characterCount.toString())
			alert.show()
		})
		
		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function(err){
			console.log("form cancelled", err.message)
		})
		
		
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.items.length > 0){return true} else {return false}
	};
	
	return action;
}();
_;