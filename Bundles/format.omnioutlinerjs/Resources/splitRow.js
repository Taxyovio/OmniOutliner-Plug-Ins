// This action splits the texts in the topic column according to paragraphs for the selected rows. Trailing white spaces at each paragraph are removed.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		var selectedItems = selection.items
		
		// List all visible text columns for insertion
		editor = document.editors[0]
		visibleTextColumns = columns.map(function(column){
			if (editor.visibilityOfColumn(column)){
				if (column.type === Column.Type.Text){return column}
			}
		})
		
		filteredColumns = visibleTextColumns.filter(el => {
			return el !== null && el !== undefined;
		})
		
		if (filteredColumns.length === 0) {
			throw new Error("This document has no text columns.")
		}
		
		filteredColumnTitles = filteredColumns.map(function(column){
			if (column.title !== ''){
				return column.title
			} else if (column === document.outline.noteColumn){
			// The note column has empty title for unknown reason
				return 'Note'
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
			
			selection.nodes.forEach(function(node){
				// Get the text object from topic column
				var textObj = node.valueForColumn(selectedColumn)
				var paragraphArray = textObj.paragraphs
				var paragraphArrayLength = paragraphArray.length
				if (paragraphArrayLength > 1) {
					paragraphArray.slice().reverse().forEach((par, index) => {
						// add following sibling
						if (par.string.replace(/\s/g, '').length !== 0) {
							trailingSpaceRange = par.find('\\s+$', [Text.FindOption.RegularExpression], null)
							if (trailingSpaceRange !== null) {
								par.remove(trailingSpaceRange)
							}
							var selectedItem = node.object
							if (index < paragraphArrayLength-1) {
								var selectedItemParent = selectedItem.parent
								selectedItemParent.addChild(
									selectedItem.after,
									function(item){
										item.setValueForColumn(par, selectedColumn)
									}
								)
							} else if (index === paragraphArrayLength-1) {
								textObj.replace(textObj.range, par)
							}
						}
						
					})
				} else {
					alert = new Alert('Error', 'Not enough paragraphs are found.')
					alert.show()
				}
			})
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