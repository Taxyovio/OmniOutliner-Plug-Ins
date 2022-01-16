// This action splits the texts in the selected column according to paragraphs for the selected rows. Note that the selected node will be turned into the last paragraoh.
var _ = function() {
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		var selectedItems = selection.items
		var pb = Pasteboard.makeUnique()
		
		// List all visible text columns
		var editor = document.editors[0]
		var filteredColumns = columns.filter(function(column) {
			if (editor.visibilityOfColumn(column)) {
				if (column.type === Column.Type.Text) {return column}
			}
		})
		
		if (filteredColumns.length === 0) {
			throw new Error("This document has no visible text columns.")
		}
		
		
		var filteredColumnTitles = filteredColumns.map(function(column) {
			if (column.title !== '') {
				return column.title
			} else if (column === document.outline.noteColumn) {
			// The note column is the only text column with empty title
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
			var selectedColumnTitle = selectedColumn.title
			
			// Rename columns with the same titles temporarily to work around bugs in Timer and Tree.paste
			if (hasDuplicates(filteredColumnTitles)) {
				var duplicateColumns = {"columns":[], "titles":[], "indices":[]}
				filteredColumnTitles = renameStrings(filteredColumnTitles)
				filteredColumns.forEach((column,index) => {
					if (column.title !== '') {
						if (column.title !== filteredColumnTitles[index]) {
							duplicateColumns.columns.push(column)
							duplicateColumns.titles.push(column.title)
							// Adding the index of the column in all columns, not filtered columns
							duplicateColumns.indices.push(columns.indexOf(column))
							column.title = filteredColumnTitles[index]
						}
					}
				})
				var duplicateColumnTitles = duplicateColumns.titles
				var duplicateColumnIndices = duplicateColumns.indices
			}
			
			
			selection.nodes.forEach(function(node, index) {
				editor.copyNodes([node],pb)
				// Get the text object from topic column
				var textObj = node.valueForColumn(selectedColumn)
				var paragraphArray = textObj.paragraphs
				var paragraphStringArray = paragraphArray.map(function(par) {
					if (par.string && /\S/.test(par.string)) {
						return par.string.trim()
					}
				})
				var paragraphStringArray = paragraphStringArray.filter(el => {
					return el
				})
				
				var paragraphArrayLength = paragraphStringArray.length
				
				if (paragraphArrayLength > 1) {
					// Prepare timer to work around Tree.paste bug
					var counter = 0
					var repeats = paragraphArrayLength
					
					// Timer.repeating is bugged and causes crashes when canceled. So writing my own repeating timer. Good news is objects no longer gets invalidated.
					function repeatingTimer(interval, repeatingFunc, startFunc, endFunc) {
						if (counter === 0) {
							startFunc()
							Timer.once(interval, function(timer) {
								repeatingTimer(interval, repeatingFunc, startFunc, endFunc)
							})
						} else if (counter < repeats) {
							repeatingFunc()
							Timer.once(interval, function(timer) {
								repeatingTimer(interval, repeatingFunc, startFunc, endFunc)
							})
						} else if (counter === repeats) {
							endFunc()
						}
						
					}
					
					// Can't set interval too small (<0.004). Otherwise it overrides the 1st par with the 2nd par.
					repeatingTimer(0.005, 
						function () {
							var node = document.editors[0].selection.nodes[index]
							
							console.log('counter: ', counter)
							counter = counter + 1
							var childIndex = node.index
							document.editors[0].paste(pb, node.parent, childIndex)
							var newNode = node.parent.children[childIndex]
							if (paragraphStringArray.slice().reverse()[counter - 1]) {
								newNode.object.valueForColumn(selectedColumn).string = paragraphStringArray.slice().reverse()[counter - 1]
							}
						}, 
						function () {
							var node = document.editors[0].selection.nodes[index]
							
							console.log('counter: ', counter)
							counter = counter + 1
							node.object.valueForColumn(selectedColumn).string = paragraphStringArray.slice().reverse()[0]
						},
						function () {
							if (duplicateColumnTitles) {
								duplicateColumnTitles.forEach((title, i) => {
									columns[duplicateColumnIndices[i]].title = title
								})
							}
							console.log("done")
						}
						
					)
					
					
				} else {
					alert = new Alert('Error', 'Not enough paragraphs are found.')
					alert.show()
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

function renameStrings(arr) {
	var count = {}
	arr.forEach(function(x, i) {
		if (arr.indexOf(x) !== i) {
			var c = x in count ? count[x] = count[x] + 1 : count[x] = 1
			var j = c + 1
			var k = x + ' '.repeat(j)
			while(arr.indexOf(k) !== -1) k = x + ' ' + (++j)
			arr[i] = k
		}
	})
	return arr
}

function hasDuplicates(array) {
	return (new Set(array)).size !== array.length;
}

function columnByTitle(columnArray, title) {
	for (var i = 0; i < columnArray.length; i++) {
		if (columnArray[i].title === title) {
			return columnArray[i]
		}
	}
}