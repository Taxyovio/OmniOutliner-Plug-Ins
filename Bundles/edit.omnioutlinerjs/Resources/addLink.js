// This action inserts a URL hyperlink to the end of the selected column of selected rows.
(() => {
	var action = new PlugIn.Action(function(selection, sender){
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles
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
		var textField = new Form.Field.String(
			"textInput",
			"Title"
		)
		
		var urlField = new Form.Field.String(
			"urlInput",
			"URL",
			"https://omni-automation.com",
			null
		)
		
		var columnField = new Form.Field.Option(
			"columnInput",
			"Column",
			filteredColumns,
			filteredColumnTitles,
			document.outline.outlineColumn
		)
		
		// ADD THE FIELDS TO THE FORM
		inputForm.addField(textField)
		inputForm.addField(urlField)
		inputForm.addField(columnField)
		
		// PRESENT THE FORM TO THE USER
		formPrompt = "Enter Title and URL and select Column:"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject){
			var textValue = formObject.values["textInput"]
			var textStatus = (textValue && textValue.length > 0) ? true:false
			var urlValue = formObject.values["urlInput"]
			var urlStatus = (urlValue && urlValue.length > 0) ? true:false
			return (textStatus && urlStatus)
		}
	
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject){
			var insertStr = formObject.values["textInput"]
			var urlStr = formObject.values["urlInput"]
			var selectedColumn = formObject.values["columnInput"]
			var url = URL.fromString(urlStr)
			textInsert = new Text(insertStr, document.outline.baseStyle)
			textInsert.style.set(Style.Attribute.Link, url)
			
			selectedItems.forEach(function(item){
			
				// Add to the selected column
				targetTextObj = item.valueForColumn(selectedColumn)	
				// When item has no content, it's not possible to get the position for insertion.
				if (targetTextObj === null){
					item.setValueForColumn(textInsert, selectedColumn)
				} else {
					textStr = targetTextObj.string
					targetTextObj.insert(targetTextObj.end, textInsert)
				}
			})
		})
		
		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function(err){
			console.log("form cancelled", err.message)
		})
	});

	action.validate = function(selection, sender) {
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.nodes.length > 0){return true} else {return false}
	};
	
	return action;
	})();