// This action copies the item link(s) for the selected row(s).
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		const editor = selection.editor
		
		var optionForm = new Form()
		
		var findField = new Form.Field.String(
			'findInput',
			'Find',
			''
		)
		var caseToggle = new Form.Field.Checkbox(
			'caseToggleInput',
			'Case Sensitivity',
			false
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
			if (caseSensitive) {
				var regex = new RegExp(search, 'g')
				var findOptions = [Text.FindOption.RegularExpression]
			} else {
				var regex = new RegExp(search, 'gi')
				var findOptions = [Text.FindOption.RegularExpression, Text.FindOption.CaseInsensitive]
				
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
				var objArr = []
				for (var itemIndex = 0; itemIndex < items.length; itemIndex++) {
					var item = items[itemIndex]
					for (var colIndex = 0; colIndex < textColumns.length; colIndex++) {
						var col = textColumns[colIndex]
						var textObj = item.valueForColumn(col)
						if (textObj) {
							var str = textObj.string
							var matches = str.match(regex)
							var ranges = findGlobal(textObj, search, findOptions)
							
							if (ranges) {
								
								
								
								// Construct alerts
								var alertTitle = "Confirmation"
								
								if (matches.length === 1) {
									var alertMessage = '1 match is found'
								} else {
									var alertMessage = matches.length + ' matches are found'
								}
								
								if (items.length > 1) {
									alertMessage += ' at row ' + (itemIndex + 1) + ' out of ' + items.length
									if (textColumns.length > 1) {
										if (col.title) {
											alertMessage += ', column: ' + col.title
										} else {
											alertMessage += ', column: Notes'
										}
									}
								} else {
									if (textColumns.length > 1) {
										if (col.title) {
											alertMessage += ', column: ' + col.title
										} else {
											alertMessage += ', column: Notes'
										}
									}
								}
								alertMessage += '.'
								
								var alert = new Alert(alertTitle, alertMessage)
								alert.addOption("Done")
								alert.addOption("Show")
								if (replace) {alert.addOption("Replace")}
								
								var obj = {alert: alert, item: item, textObj: textObj, ranges: ranges, itemIndex: itemIndex, columnIndex: colIndex}
								objArr.push(obj)
								
							}
						}
					}
				}
				
				if (objArr.length === 0) {
					var alert = new Alert('Confirmation', 'No match is found.')
					alert.show()
				}
				
				// Recursive function to execute promises sequentially
				const showNextAlert = (d) => {
					var obj = objArr[d]
					var item = obj.item
					var textObj = obj.textObj
					var ranges = obj.ranges
					
					obj.alert.show().then(buttonIndex => {
						var node = editor.nodeForObject(item)
						if (buttonIndex === 0){
							console.log("done")
							return action
						} else {
							
							node.reveal()
							editor.scrollToNode(node)
							console.log(ranges)
							// RGBA values for original background colours to pass into the timer
							var ogBackgrounds = ranges.map(r => {
								var ogColour = textObj.styleForRange(r).get(Style.Attribute.BackgroundColor)
								var lightYellow = Color.RGB(1, 1, 0.1, 0.5)
								textObj.styleForRange(r).set(Style.Attribute.BackgroundColor, ogColour.blend(lightYellow, 0.8))
								
								var rgb = {r: ogColour.red, g: ogColour.green, b: ogColour.blue, a: ogColour.alpha} 
								return rgb
							})
							
							
							Timer.once(0.8, () => {
								// Needs to re-assign every objects needed as they tend to be invalidated in timer
								var items = []
								document.editors[0].selection.items.forEach(itm => {
									items.push(itm)
									items = items.concat(itm.descendants)
								})
								var textColumns = columns.filter(col => {return col.type === Column.Type.Text})
								var textObj = items[obj.itemIndex].valueForColumn(textColumns[obj.columnIndex])
								var ranges = findGlobal(textObj, search, findOptions)
								
								ranges.forEach((r, i) => {
									var ogColour = Color.RGB(ogBackgrounds[i].r, ogBackgrounds[i].g, ogBackgrounds[i].b, ogBackgrounds[i].a)
									textObj.styleForRange(r).set(Style.Attribute.BackgroundColor, ogColour)
								})
								if (buttonIndex === 1) {
									console.log('show')
								} else if (buttonIndex === 2) {
									console.log("replace")
									textObj.string = textObj.string.replace(regex, replacement)
								}
							})
							
							
							d++
							if (d < objArr.length) {
								showNextAlert(d)
							} else {
								console.log("done")
							}
						}
						
					})
				}
				showNextAlert(0);
				
				
			} else {
				items.forEach((item, itemIndex) => {
					textColumns.forEach((col, colIndex) => {
						console.log('at item', itemIndex + 1, '/', items.length, 'column', colIndex + 1, '/', textColumns.length)
						var textObj = item.valueForColumn(col)
						if (textObj) {
							var str = textObj.string
							
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
		if (selection.items.length > 0) {return true} else {return false}
	};
	
	return action;
}();
_;

function findGlobal(textObj, search, findOptions) {
	var ranges = []
	var searchRange = new Text.Range(textObj.start, textObj.end)
	console.log('finding', search, 'in\n', textObj.string)
	while (textObj.find(search, findOptions, searchRange)) {
		var range = textObj.find(search, findOptions, searchRange)
		ranges.push(range)
		searchRange = new Text.Range(range.end, textObj.end)
		console.log(searchRange.isEmpty)
	}
	
	if (ranges.length === 0) {
		console.log('return null')
		return null
	} else {
		return ranges
	}
}