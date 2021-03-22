// This action splits the texts in the selected column according to paragraphs for the selected rows. Note that the selected nodd will be turned into the last paragraoh.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		var selectedItems = selection.items
		var pb = Pasteboard.makeUnique()
		
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
		// Rename columns with the same titles
		if (hasDuplicates(filteredColumnTitles)) {
			var alertTitle = "Confirmation"
			var alertMessage = "Some columns have the same title.\nRename duplicated titles?"
			var alert = new Alert(alertTitle, alertMessage)
			alert.addOption("Continue")
			alert.addOption("Stop")
			var alertPromise = alert.show()
			
			alertPromise.then(buttonIndex => {
				if (buttonIndex === 0){
					console.log("Continue script")
					filteredColumnTitles = renameStrings(filteredColumnTitles)
					filteredColumns.forEach((column,index) => {
						if (column.title !== ''){
							if (column.title !== filteredColumnTitles[index]) {
								column.title = filteredColumnTitles[index]
							}
						}
					})
				} else {
					throw new Error('script cancelled')
				}
			})
		} 
		

		
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
			var selectedColumnTitle = selectedColumn.title
			
			selection.nodes.forEach(function(node, index){
				editor.copyNodes([node],pb)
				// Get the text object from topic column
				var textObj = node.valueForColumn(selectedColumn)
				var paragraphArray = textObj.paragraphs
				var paragraphStringArray = paragraphArray.map(function(par){
					if (par.string !== null && /\S/.test(par.string)) {
						return par.string.trim()
					}
				})
				var paragraphStringArray = paragraphStringArray.filter(el => {
					return el !== null && el !== undefined;
				})
				
				var paragraphArrayLength = paragraphStringArray.length
				
				if (paragraphArrayLength > 1) {
					var counter = 0
					var repeats = paragraphArrayLength
					
					// In the Timer, all objects get invalidated except the document object.
					Timer.repeating(0, function(timer){
						if (counter === repeats){
							console.log('done')
							timer.cancel()
						} else {
							console.log('counter:', counter)
							var node = document.editors[0].selection.nodes[index]
							var childIndex = node.index
							document.editors[0].paste(pb, node.parent, childIndex)
							var newNode = node.parent.children[childIndex]
							if (selectedColumnTitle === '') {
								var column = document.outline.noteColumn
							} else {
								var column = document.outline.columns.byTitle(selectedColumnTitle)
							}
							newNode.object.valueForColumn(column).string = paragraphStringArray.slice().reverse()[counter]
							counter = counter + 1
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

function hasDuplicates(array) {
	return (new Set(array)).size !== array.length;
}