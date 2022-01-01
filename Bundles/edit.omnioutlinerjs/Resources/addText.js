// This action inserts texts at the end or start of the selected column of selected rows.
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
		if (Pasteboard.general.hasStrings) {
			var defaultText = Pasteboard.general.string
		}
		
		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form()
		
		// CREATE TEXT FIELD
		var textField = new Form.Field.String(
			"textInput",
			"Text",
			defaultText
		)
		
		if (filteredColumns.includes(document.outline.outlineColumn)) {
			var defaultColumn = document.outline.outlineColumn
		} else {
			var defaultColumn = document.outline.noteColumn
		}
		
		var colourField = new Form.Field.Checkbox(
			"colourInput",
			"Colour",
			false
		)
		
		var defaultRGB = '(1, 0, 0, 1)'
		var rgbField = function (str) {
			return new Form.Field.String(
				"rgbInput",
				"RGB",
				str
			)
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
		inputForm.addField(columnField)
		inputForm.addField(insertionPositionField)
		inputForm.addField(colourField)
		// PRESENT THE FORM TO THE USER
		formPrompt = "Enter Text and select Column"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject) {
			var keys = formObject.fields.map(field => field.key)
			
			var textValue = formObject.values["textInput"]
			var textStatus = (textValue && textValue.length > 0) ? true:false
			
			if (keys.indexOf('rgbInput') === -1) {
				if (formObject.values["colourInput"]) {
					formObject.addField(rgbField(defaultRGB))
				} 
			} else {
			
				if (formObject.values["colourInput"]) {
					var rgb = formObject.values["rgbInput"]
					if (rgb.match(/\(\s*\d+\.{0,1}\d*\s*,\s*\d+\.{0,1}\d*\s*,\s*\d+\.{0,1}\d*\s*,\s*\d+\.{0,1}\d*\s*\)/) === null) {
						return false
					} else {
						var arr = rgb.match(/\d+\.{0,1}\d*/g)
						for (var i = 0; i < arr.length; i++) {
							var float = parseFloat(arr[i])
							if (float > 1) {return false}
						}
					}
				} else {
					defaultRGB = formObject.values["rgbInput"]
					formObject.removeField(formObject.fields[keys.indexOf('rgbInput')])
				}
			}
			return textStatus
		}
	
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject) {
			var insertStr = formObject.values["textInput"]
			var selectedColumn = formObject.values["columnInput"]
			var selectedPosition = formObject.values["insertionPositionInput"]
			
			var fillColour = formObject.values["colourInput"]
			if (fillColour) {
				var rgb = formObject.values["rgbInput"]
				var floatArr = rgb.match(/\d+\.{0,1}\d*/g).map(str => parseFloat(str))
				var colour = Color.RGB(floatArr[0], floatArr[1], floatArr[2], floatArr[3])
			}
			
			selectedItems.forEach(function(item) {
				var targetText = item.valueForColumn(selectedColumn)
				if (targetText) {
					var textInsert = new Text(insertStr, targetText.style)
					if (fillColour) {textInsert.style.set(Style.Attribute.FontFillColor, colour)}
					if (selectedPosition === 'End') {
						targetText.append(textInsert)
					} else if (selectedPosition === 'Start') {
						targetText.insert(targetText.start, textInsert)
					}
				} else {
					var textInsert = new Text(insertStr, item.style)
					if (fillColour) {textInsert.style.set(Style.Attribute.FontFillColor, colour)}
					item.setValueForColumn(textInsert, selectedColumn)
				}
			})
			
			
			// Work around a bug that crops images by forcing UI to update
			editor.setVisibilityForColumn(selectedColumn, false)
			editor.setVisibilityForColumn(selectedColumn, true)
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