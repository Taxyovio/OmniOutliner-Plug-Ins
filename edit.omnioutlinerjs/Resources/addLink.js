// This action inserts a URL hyperlink to the end of the selected column of selected rows.
(() => {
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles
		var selectedItems = selection.items
		
		// List all visible text columns for insertion
		editor = document.editors[0]
		filteredColumns = columns.filter(function(column) {
			if (editor.visibilityOfColumn(column)) {
				if (column.type === Column.Type.Text) {return column}
			}
		})
		
		if (filteredColumns.length === 0) {
			throw new Error("This document has no text columns.")
		}
		
		filteredColumnTitles = filteredColumns.map(function(column) {
			if (column.title !== '') {
				return column.title
			} else if (column === document.outline.noteColumn) {
			// The note column has empty title for unknown reason
				return 'Notes'
			}
		})
		
		var defaultText = ''
		var defaultURL = ''
		if (Pasteboard.general.hasURLs) {
			var defaultURL = Pasteboard.general.URL.string
		} else if (Pasteboard.general.hasStrings) {
			var defaultText = Pasteboard.general.string
		}
		
		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form()
		
		// CREATE TEXT FIELD
		var textField = new Form.Field.String(
			"textInput",
			"Title",
			defaultText,
			null
		)
		
		var urlField = new Form.Field.String(
			"urlInput",
			"URL",
			defaultURL,
			null
		)
		
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
		
		var insertionPositionField = new Form.Field.Option(
			"insertionPositionInput",
			"Position",
			["End", "Start"],
			null,
			"End"
		)
		// ADD THE FIELDS TO THE FORM
		inputForm.addField(textField)
		inputForm.addField(urlField)
		inputForm.addField(columnField)
		inputForm.addField(insertionPositionField)
		
		// PRESENT THE FORM TO THE USER
		formPrompt = "Enter URL and select Column"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject) {
			var urlValue = formObject.values["urlInput"]
			var urlStatus = (urlValue && urlValue.length > 0 && urlValue.match(/:\/\//)) ? true:false
			return urlStatus
		}
	
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject) {
			var insertStr = formObject.values["textInput"].trim()
			var urlStr = formObject.values["urlInput"].trim()
			var selectedColumn = formObject.values["columnInput"]
			var selectedPosition = formObject.values["insertionPositionInput"]
			var url = URL.fromString(urlStr)
			
			selectedItems.forEach(function(item) {
			
				var targetText = item.valueForColumn(selectedColumn)
				if (targetText) {
					if (insertStr === '') {
						insertStr = urlStr
						var textInsert = new Text(insertStr, targetText.style)
					} else {
						var textInsert = new Text(insertStr, targetText.style)
						textInsert.style.set(Style.Attribute.Link, url)
					}
					var space = new Text(' ', targetText.style)
					if (selectedPosition === 'End') {
						if (targetText.string) {
							targetText.append(space)
						}
						targetText.append(textInsert)
						targetText.append(space)
					} else if (selectedPosition === 'Start') {
						if (targetText.string) {
							targetText.insert(targetText.start, space)
						}
						targetText.insert(targetText.start, textInsert)
					}
				} else {
					if (insertStr === '') {
						insertStr = urlStr
						var textInsert = new Text(insertStr, item.style)
					} else {
						var textInsert = new Text(insertStr, item.style)
						textInsert.style.set(Style.Attribute.Link, url)
					}
					var space = new Text(' ', item.style)
					textInsert.append(space)
					item.setValueForColumn(textInsert, selectedColumn)
				}
			})
			
			/*
			// Work around a bug that crops images by forcing UI to update
			var ogAlignment = selectedColumn.textAlignment
			if (ogAlignment === TextAlignment.Natural) {
				selectedColumn.textAlignment = TextAlignment.Left
			} else {
				selectedColumn.textAlignment = TextAlignment.Natural
			}
			selectedColumn.textAlignment = ogAlignment
			*/
		})
		
		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function(err) {
			console.log("form cancelled", err.message)
		})
	});

	action.validate = function(selection, sender) {
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.nodes.length > 0) {return true} else {return false}
	};
	
	return action;
})();