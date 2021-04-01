// This action copies the item link(s) for the selected row(s).
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		const editor = selection.editor
		
		var optionForm = new Form()
		
		var findField = new Form.Field.String(
			'findInput',
			'RegEx',
			''
		)
		var caseToggle = new Form.Field.Checkbox(
			'caseToggleInput',
			'Case Sensitivity',
			true
		)
		
		var replaceToggle = new Form.Field.Checkbox(
			'replaceToggleInput',
			'Replace',
			false
		)
		
		var defaultReplace = ''
		var replaceField = function (str) {
			return new Form.Field.String(
				'replaceInput',
				'',
				str
			)
		}
		
		var defaultReplaceAll = false
		var replaceAllToggle = function (bool) {
			return new Form.Field.Checkbox(
				'replaceAllToggleInput',
				'Replace All',
				bool
			)
		}
		
		optionForm.addField(findField)
		optionForm.addField(caseToggle)
		optionForm.addField(replaceToggle)
		
		formPrompt = "Find and Replace"
		formPromise = optionForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		optionForm.validate = function(formObject){
			var keys = formObject.fields.map(field => field.key)
			if (formObject.values['replaceToggleInput']) {
				if (keys.indexOf('replaceInput') === -1) {
					formObject.addField(replaceField(defaultReplace))
					console.log(defaultReplace)
				}
				if (keys.indexOf('replaceAllToggleInput') === -1) {
					formObject.addField(replaceAllToggle(defaultReplaceAll))
				}
			} else {
				if (keys.indexOf('replaceAllToggleInput') !== -1) {
					defaultReplaceAll = formObject.values['replaceAllToggleInput']
					formObject.removeField(formObject.fields[keys.indexOf('replaceAllToggleInput')])
				}
				if (keys.indexOf('replaceInput') !== -1) {
					defaultReplace = formObject.values['replaceInput']
					console.log(defaultReplace)
					formObject.removeField(formObject.fields[keys.indexOf('replaceInput')])
				}
			}
			return null
		}
	
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject){
			var search = formObject.values["findInput"]
			var caseSensitive = formObject.values["caseToggleInput"]
			var replace = formObject.values["replaceToggleInput"]
			if (replace) {
				var replacement = formObject.values["replaceInput"]
				var replaceAll = formObject.values["replaceAllToggleInput"]
			}
			
			// Get all selected items and their descendants to search through
			var items = []
			selection.items.forEach(itm => {
				items.push(itm)
				items = items.concat(itm.descendants)
			})
			
			var textColumns = columns.filter(col => {return col.type === Column.Type.Text})
			if (textColumns.length === 0) {throw new Error('This document has no text columns.')}
			
			if (!replaceAll) {
				items.forEach((item, itemIndex) => {
					textColumns.forEach((col, colIndex) => {
						console.log('at item', itemIndex + 1, '/', items.length, 'column', colIndex + 1, '/', textColumns.length)
						var textObj = item.valueForColumn(col)
						if (textObj) {
							var str = textObj.string
							if (caseSensitive) {
								var regex = new RegExp(search, 'g')
							} else {
								var regex = new RegExp(search, 'gi')
							}
							
							var matches = str.match(regex)
							if (matches) {
								var alertTitle = "Confirmation"
								
								if (matches.length === 1) {
									var alertMessage = '1 match is found at row ' + (itemIndex + 1) + '.'
								} else {
									var alertMessage = matches.length + ' matches are found at row ' + (itemIndex + 1) + '.'
								}
								
								var alert = new Alert(alertTitle, alertMessage)
								alert.addOption("Done")
								alert.addOption("Show")
								if (replace) {alert.addOption("Replace")}
								var alertPromise = alert.show()
								
								alertPromise.then(buttonIndex => {
									if (buttonIndex === 0){
										console.log("done")
										return action
									} else if (buttonIndex === 1) {
										console.log("show")
										var node = editor.nodeForObject(item)
										node.reveal()
										editor.scrollToNode(node)
									} else if (buttonIndex === 2) {
										console.log("replace")
										var node = editor.nodeForObject(item)
										node.reveal()
										editor.scrollToNode(node)
										textObj.string = str.replace(regex, replacement)
									}
								})
							}
						}
					})
				})
			} else {
				items.forEach((item, itemIndex) => {
					textColumns.forEach((col, colIndex) => {
						console.log('at item', itemIndex + 1, '/', items.length, 'column', colIndex + 1, '/', textColumns.length)
						var textObj = item.valueForColumn(col)
						if (textObj) {
							var str = textObj.string
							if (caseSensitive) {
								var regex = new RegExp(search, 'g')
							} else {
								var regex = new RegExp(search, 'gi')
							}
							
							var matches = str.match(regex)
							if (matches) {
								var node = editor.nodeForObject(item)
								node.reveal()
								editor.scrollToNode(node)
								textObj.string = str.replace(regex, replacement)
							}
						}
					})
				})
			}
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