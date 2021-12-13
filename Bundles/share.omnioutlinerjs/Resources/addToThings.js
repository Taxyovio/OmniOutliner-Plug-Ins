// This action creates/updates new tasks/projects into the Things app from the selected rows. Optionally a link to the created/updated item is passed back and added to a column 'Things ID'. For updating items, the authentication token needs to be provided either in the input form or from the first row in a column 'Authentication Token'.
var _ = function() {
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		try {
		const Lib = this.plugIn.library('ApplicationLib')
		// selection options: columns, document, editor, items, nodes, styles
		
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
			// The note column is the only text column with empty title
				return 'Notes'
			}
		})
		
		
		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form()
		
		// CREATE INPUT FIELDS
		
		if (filteredColumns.includes(document.outline.outlineColumn)) {
			var defaultTitleColumn = document.outline.outlineColumn
		} else {
			var defaultTitleColumn = document.outline.noteColumn
		}
		
		var titleField = new Form.Field.Option(
			"titleInput",
			"Title",
			filteredColumns,
			filteredColumnTitles,
			defaultTitleColumn
		)
		
		var notesField = new Form.Field.Option(
			"notesInput",
			"Notes",
			filteredColumns,
			filteredColumnTitles,
			document.outline.noteColumn
		)
		
		var defaultChecklist = false
		var checklistField = function (bool) {
			return new Form.Field.Checkbox(
				"checklistInput",
				"Checklist",
				bool
			)
		}
		
		var linkBackField = new Form.Field.Checkbox(
			"linkBackInput",
			"Retrieve Things ID",
			true
		)
		
		
		if (columns.byTitle('When') && columns.byTitle('When').type === Column.Type.Date) {
			var defaultWhen = true
		} else {
			var defaultWhen = false
		}
		
		var whenField = new Form.Field.Checkbox(
			"whenInput",
			"When",
			defaultWhen
		)
		
		var defaultReminder = false
		var reminderField = function (bool) {
			return new Form.Field.Checkbox(
				"reminderInput",
				"Reminder",
				bool
			)
		}
		
		if (columns.byTitle('Deadline') && columns.byTitle('Deadline').type === Column.Type.Date) {
			var defaultDeadline = true
		} else {
			var defaultDeadline = false
		}
		
		var deadlineField = new Form.Field.Checkbox(
			"deadlineInput",
			"Deadline",
			defaultDeadline
		)
		
		if (filteredColumnTitles.indexOf('Tags') !== -1) {
			var defaultTags = true
		} else {
			var defaultTags = false
		}
		
		var tagsField = new Form.Field.Checkbox(
			"tagsInput",
			"Tags",
			defaultTags
		)
		
		var projectField = new Form.Field.Checkbox(
			"projectInput",
			"Add as Project",
			false
		)
		
		var defaultUpdate = false
		var defaultAuth = ''
		// Authentication token field and update field
		var authColumn = columns.byTitle('Authentication Token')
		if (authColumn && authColumn.type === Column.Type.Text) {
			defaultUpdate = true
			
			for (var i = 0; i < rootItem.descendants.length; i++) {
				var textObj = rootItem.descendants[i].valueForColumn(authColumn)
				if (textObj && textObj.string !== '') {
					str = textObj.string
					if (!/\W/.test(str)) {
						defaultAuth = str
					}
					break
				}
				
				if (i > 1000) {
					break
				}
			}
			
		} else if (Pasteboard.general.hasStrings) {
			var str = Pasteboard.general.string
			if (!/\W/.test(str)) {
				var defaultAuth = str
			}
		}
		
		var updateField = new Form.Field.Checkbox(
			"updateInput",
			"Update Existing Things",
			defaultUpdate
		)
		
		var authField = function (str) {
			return new Form.Field.String(
				"authInput",
				"Authentication Token",
				str
			)
		}
		
		// ADD THE FIELDS TO THE FORM
		inputForm.addField(titleField)
		inputForm.addField(notesField)
		inputForm.addField(checklistField(defaultChecklist))
		
		inputForm.addField(whenField)
		if (defaultWhen === true) {inputForm.addField(reminderField(defaultReminder))}
		inputForm.addField(deadlineField)
		inputForm.addField(tagsField)
		
		inputForm.addField(projectField)
		inputForm.addField(linkBackField)
		
		inputForm.addField(updateField)
		if (defaultUpdate === true) {inputForm.addField(authField(defaultAuth))}
		
		// PRESENT THE FORM TO THE USER
		formPrompt = "Add to Things"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject) {
			var keys = formObject.fields.map(field => field.key)
			
			if (formObject.values['projectInput'] === true) {
				if (keys.indexOf('checklistInput') !== -1) {
					defaultChecklist = formObject.values['checklistInput']
					formObject.removeField(formObject.fields[keys.indexOf('checklistInput')])
				}
			} else {
				if (keys.indexOf('checklistInput') === -1) {
					formObject.addField(checklistField(defaultChecklist), keys.indexOf('notesInput') + 1)
				}
			}
			
			if (formObject.values['updateInput'] === false) {
				if (keys.indexOf('authInput') !== -1) {
					defaultAuth = formObject.values['authInput']
					formObject.removeField(formObject.fields[keys.indexOf('authInput')])
				}
			} else {
				if (keys.indexOf('authInput') === -1) {
					formObject.addField(authField(defaultAuth), keys.indexOf('updateInput') + 1)
				}
			}
			
			if (formObject.values['whenInput'] === true) {
				if (keys.indexOf('reminderInput') === -1) {
					formObject.addField(reminderField(defaultReminder), keys.indexOf('whenInput') + 1)
				}
			} else {
				if (keys.indexOf('reminderInput') !== -1) {
					defaultReminder = formObject.values['reminderInput']
					formObject.removeField(formObject.fields[keys.indexOf('reminderInput')])
				}
			}
			
			if (formObject.values["authInput"] === '' && formObject.values["updateInput"] === true) {
				throw new Error('Authentication token is required for update operation.')
			}
			return null
			
		}
		
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject) {
			console.log('Processing form')
			var titleColumn = formObject.values["titleInput"]
			var notesColumn = formObject.values["notesInput"]
			var includesChildren = formObject.values["checklistInput"]
			
			var includesWhen = formObject.values["whenInput"]
			var includesReminder = formObject.values["reminderInput"]
			
			var includesDeadline = formObject.values["deadlineInput"]
			var includesTags = formObject.values["tagsInput"]
			
			var asProject = formObject.values["projectInput"]
			var updateExisting = formObject.values["updateInput"]
			var linkBack = formObject.values["linkBackInput"]
			
			var authToken = formObject.values["authInput"]
			
			console.log('Adding columns')
			// Create new columns if missing
			if (includesWhen) {
				if (!columns.byTitle('When') || columns.byTitle('When').type !== Column.Type.Date) {
					includesWhen = false
					includesReminder = false
					var alertTitle = "Confirmation"
					var alertMessage = "Missing date column: When.\nAdd column?"
					var alert = new Alert(alertTitle, alertMessage)
					alert.addOption("Skip")
					alert.addOption("Add")
					var alertPromise = alert.show()
					
					alertPromise.then(buttonIndex => {
						if (buttonIndex === 1) {
							console.log("Continue script")
							document.outline.addColumn(Column.Type.Date, editor.afterColumn(), 
								function (column) {
									column.title = 'When'
								}
							)
						}
					})
					
				}
			}
			
			if (includesDeadline) {
				if (!columns.byTitle('Deadline') || columns.byTitle('Deadline').type !== Column.Type.Date) {
					
					includesDeadline = false
					var alertTitle = "Confirmation"
					var alertMessage = "Missing date column: Deadline.\nAdd column?"
					var alert = new Alert(alertTitle, alertMessage)
					alert.addOption("Skip")
					alert.addOption("Add")
					var alertPromise = alert.show()
					
					alertPromise.then(buttonIndex => {
						if (buttonIndex === 1) {
							console.log("Continue script")
							document.outline.addColumn(Column.Type.Date, editor.afterColumn(), 
								function (column) {
									column.title = 'Deadline'
								}
							)
						}
					})
				}
			}
			
			if (includesTags) {
				if (!filteredColumnTitles.includes('Tags')) {
					
					includesTags = false
					var alertTitle = "Confirmation"
					var alertMessage = "Missing text column: Tags.\nAdd column?"
					var alert = new Alert(alertTitle, alertMessage)
					alert.addOption("Skip")
					alert.addOption("Add")
					var alertPromise = alert.show()
					
					alertPromise.then(buttonIndex => {
						if (buttonIndex === 1) {
							console.log("Continue script")
							document.outline.addColumn(Column.Type.Text, editor.afterColumn(), 
								function (column) {
									column.title = 'Tags'
								}
							)
						}
					})
				}
			}
			
			if (linkBack) {
				if (!columns.byTitle('Things ID') || columns.byTitle('Things ID').type !== Column.Type.Text) {
					updateExisting = false
					document.outline.addColumn(Column.Type.Text, editor.afterColumn(), 
						function (column) {
							column.title = 'Things ID'
						}
					)
					
				}
			}
			
			
			// Creating an array of objects to later convert to JSON, from each selected items.
			console.log('Creating Things objects')
			var things = []
			var items = selection.items
			
			
			items.forEach((item, index) => {
				console.log('Things object is being created ', index + 1, ' out of ', items.length)
				/* An object of Things
				{
					"type": "to-do",
					"operation": "update",
					"id": "1BD13549-0BE7-49AC-B645-74B7BA8DE7C4",
					"attributes": {
						"deadline": "today"
					}
				}
				*/
				var thing = {}
				if (asProject) {thing.type = 'project'} else {thing.type = 'to-do'}
				console.log('Things object : ', JSON.stringify(thing))
				var urlColumn = columnByTitle(filteredColumns, 'Things ID')
				if (urlColumn && item.valueForColumn(urlColumn) && item.valueForColumn(urlColumn).string.trim().length !== 0) {
					thing.id = item.valueForColumn(urlColumn).string.trim()
				}
				console.log('Things object : ', JSON.stringify(thing))
				if (updateExisting) {
					if (thing.id) {
						thing.operation = 'update'
					} else {
						thing.operation = 'create'
					}
				} else {
					thing.operation = 'create'
				}
				
				console.log('Things object: ', JSON.stringify(thing))
				
				var attributes = {}
				try {attributes.title = Lib.textToMD(item.valueForColumn(titleColumn)).trim()} catch(err) {attributes.title = ''}
				try {
					// Prepend OO item link in notes field in Things
					attributes.notes = 'omnioutliner:///open?row=' + item.identifier + '\n\n' + Lib.textToMD(item.valueForColumn(notesColumn)).trim()
				} catch(err) {
					attributes.notes = 'omnioutliner:///open?row=' + item.identifier
				}
				
				if (includesChildren && !asProject) {
					const limit = 100 // Max checklist items imposed by Things
					var checklistItems = []
					
					var filteredChildren = item.children.filter(child => {
						return child.topic !== ''
					})
					
					if (filteredChildren.length <= 100) {
						filteredChildren.forEach(child => {
							var checklistItem = {'type':'checklist-item'}
							var childLink = 'omnioutliner:///open?row=' + child.identifier
							checklistItem.attributes = {'title':Lib.textToMD(child.valueForColumn(titleColumn)).trim() + ' ' + childLink}
							checklistItems.push(checklistItem)
						})
					} else {
						for (var i = 0; i < limit; i++) {
							var child = filteredChildren[i]
							var checklistItem = {'type':'checklist-item'}
							var childLink = 'omnioutliner:///open?row=' + child.identifier
							checklistItem.attributes = {'title':Lib.textToMD(child.valueForColumn(titleColumn)).trim() + ' ' + childLink}
							checklistItems.push(checklistItem)
						}
					}
					console.log('Checklist Items:\n', JSON.stringify(checklistItems))
					attributes['checklist-items'] = checklistItems
				} else {
					attributes['checklist-items'] = []
				}
				
				// Add date attributes
				if (includesWhen || includesDeadline) {
					var dateColumns = columns.filter(col => {
						return col.type === Column.Type.Date
					})
				}
				
				if (includesWhen) {
					var whenColumn = columnByTitle(dateColumns, 'When')
					var when = item.valueForColumn(whenColumn)
					if (when) {
						if (includesReminder) {
							attributes.when = when.toString()
						} else {
							attributes.when = when.toDateString()
						}
					} else {
						attributes.when = ''
					}
				} else {
					attributes.when = ''
				}
				
				if (includesDeadline) {
					var deadlineColumn = columnByTitle(dateColumns, 'Deadline')
					var deadline = item.valueForColumn(deadlineColumn)
					if (deadline) {
						attributes.deadline = deadline.toDateString()
					} else {
						attributes.deadline = ''
					}
				} else {
					attributes.deadline = ''
				}
				
				// Add tags
				if (includesTags) {
					var tagsColumn = columnByTitle(filteredColumns, 'Tags')
					var tags = item.valueForColumn(tagsColumn)
					if (tags && tags.string.trim().length !== 0) {
						var tagsArray = tags.string.trim().split(',')
						tagsArray = tagsArray.map(tag => tag.trim()) // Trim tags
						attributes.tags = tagsArray
					} else {
						attributes.tags = []
					}
				} else {
					attributes.tags = []
				}
				
				
				thing.attributes = attributes
				
				console.log('Things object completed ', index + 1, ' out of ', items.length, ':\n', JSON.stringify(thing))
				
				things.push(thing)
				console.log('Add to object array:\n', JSON.stringify(things))
				
				
			})
			
			
			var data = JSON.stringify(things)
			var urlStr = 'things:///json?data=' + encodeURIComponent(data) + '&reveal=true'
			if (updateExisting && authToken !== '') {
				urlStr += '&auth-token=' + authToken
			}
			
			console.log('URL:\n', urlStr)
			
			URL.fromString(urlStr).call(result => {
				console.log('Callback result:\n', result, '\n\n Is array? ', Array.isArray(result))
				if (linkBack) {
					var items = document.editors[0].selection.items
					items.forEach((item, index) => {
						var str = result[index]
						var url = URL.fromString('things:///show?id=' + str)
						var textColumns = columns.filter(function(column) {
							if (column.type === Column.Type.Text) {return column}
						})
						
						var thingsColumn = columnByTitle(textColumns, 'Things ID')
						var textObj = item.valueForColumn(thingsColumn)
						if (textObj) {
							textObj = new Text(str, textObj.style)
							textObj.style.set(Style.Attribute.Link, url)
							item.setValueForColumn(textObj, thingsColumn)
						} else {
							textObj = new Text(str, item.style)
							textObj.style.set(Style.Attribute.Link, url)
							item.setValueForColumn(textObj, thingsColumn)
						}
					})
				}
			})
			
		})
		
		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function(err) {
			console.log("form cancelled", err.message)
		})
		} catch (error) {
			console.log(error)
		}
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.items.length > 0) {return true} else {return false}
	};
	
	return action;
}();
_;

function columnByTitle(columnArray, title) {
	for (var i = 0; i < columnArray.length; i++) {
		if (columnArray[i].title === title) {
			return columnArray[i]
		}
	}
}

function reverse(str) {
	return str.split("").reverse().join("")
}