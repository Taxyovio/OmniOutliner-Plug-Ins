// This action creates a new task into the inbox of Things from the selected row using URL schemes.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		
		// This is the delay between each url call, constrained by the app switching animation on iOS. 
		// If it's set to too low, there could be data loss on transport.
		// Set default delay to 0.8 sec on iOS devices unless there's only one selected item
		if (app.platformName === 'iOS' || app.platformName === 'iPadOS') {
			if (selection.items.length === 1) {
				var delay = 0
			} else {
				var delay = 0.8
			}
		} else {
			var delay = 0
		}
		console.log('Default delay is set to', delay, 'seconds.')
		
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
		
		var checklistField = new Form.Field.Checkbox(
			"checklistInput",
			"Checklist",
			false
		)
		
		var linkBackField = new Form.Field.Checkbox(
			"linkBackInput",
			"Add Things URL",
			true
		)
		
		if (columns.byTitle('When') !== null && columns.byTitle('When').type === Column.Type.Date) {
			var defaultWhen = true
		} else {
			var defaultWhen = false
		}
		
		var whenField = new Form.Field.Checkbox(
			"whenInput",
			"When",
			defaultWhen
		)
		
		var reminderField = new Form.Field.Checkbox(
			"reminderInput",
			"Reminder",
			false
		)
		
		if (columns.byTitle('Deadline') !== null && columns.byTitle('Deadline').type === Column.Type.Date) {
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
		
		var 
		// ADD THE FIELDS TO THE FORM
		inputForm.addField(titleField)
		inputForm.addField(notesField)
		inputForm.addField(checklistField)
		inputForm.addField(whenField)
		inputForm.addField(reminderField)
		inputForm.addField(deadlineField)
		inputForm.addField(tagsField)
		inputForm.addField(projectField)
		inputForm.addField(linkBackField)
		
		// Delay is nonzero if and only if there're multiple selected items on iOS.
		// This field gives the option to remove this delay when multitasking.
		if (delay !== 0) {
			var multitaskingField = new Form.Field.Checkbox(
				"multitaskingInput",
				"Multitasking",
				false
			)
			inputForm.addField(multitaskingField)
		}
		
		
		// PRESENT THE FORM TO THE USER
		formPrompt = "Add to Things:"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject){
			if (formObject.values["checklistInput"] && formObject.values["projectInput"]) {
				throw new Error('A project cannot have a checklist.')
				return false
			} else {
				return null
			}
		}
		
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject){
			var titleColumn = formObject.values["titleInput"]
			var notesColumn = formObject.values["notesInput"]
			var includesChildren = formObject.values["checklistInput"]
			
			var includesWhen = formObject.values["whenInput"]
			var includesReminder = formObject.values["reminderInput"]
			
			var includesDeadline = formObject.values["deadlineInput"]
			var includesTags = formObject.values["tagsInput"]
			
			var asProject = formObject.values["projectInput"]
			
			var linkBack = formObject.values["linkBackInput"]
			
			// This field is undefined unless selecting multiple rows on iOS.
			try {var multitasking = formObject.values["multitaskingInput"]} catch(err) {multitasking = false}
			
			// Create new columns if missing
			if (includesWhen) {
				if (columns.byTitle('When') === null || columns.byTitle('When').type !== Column.Type.Date) {
					document.outline.addColumn(Column.Type.Date, editor.afterColumn(), 
						function (column) {
							column.title = 'When'
						}
					)
					includesWhen = false
					includesReminder = false
				}
			}
			
			if (includesDeadline) {
				if (columns.byTitle('Deadline') === null || columns.byTitle('Deadline').type !== Column.Type.Date) {
					document.outline.addColumn(Column.Type.Date, editor.afterColumn(), 
						function (column) {
							column.title = 'Deadline'
						}
					)
					includesDeadline = false
				}
			}
			
			if (includesTags) {
				if (!filteredColumnTitles.includes('Tags')) {
					document.outline.addColumn(Column.Type.Text, editor.afterColumn(), 
						function (column) {
							column.title = 'Tags'
						}
					)
					includesTags = false
				}
			}
			
			if (linkBack) {
				if (!filteredColumnTitles.includes('Things URL')) {
					document.outline.addColumn(Column.Type.Text, editor.afterColumn(), 
						function (column) {
							column.title = 'Things URL'
						}
					)
				}
			}
			
			
			
			// Constructing array of urls to call
			var urls = []
			selection.items.forEach(function(item, index){
				try {var title = item.valueForColumn(titleColumn).string} catch(err) {title = ''}
				try {var notes = item.valueForColumn(notesColumn).string} catch(err) {notes = ''}
				var itemLink = 'omnioutliner:///open?row=' + item.identifier
				
				title = encodeURIComponent(title)
				notes = encodeURIComponent(notes)
				itemLink = encodeURIComponent(itemLink)
				
				if (!asProject) {
					var urlStr = "things:///add?"
				} else {
					var urlStr = "things:///add-project?"
				}
				
				urlStr += "title=" + title
				urlStr += "&notes=" + itemLink+ encodeURIComponent('\n\n') + notes
				
				if (includesChildren && !asProject) {
					const limit = 100 // Max checklist items imposed by Things
					var filteredChildren = item.children.filter(child => {
						return child.topic !== ''
					})
					var checklistStr = '&checklist-items='
					if (filteredChildren.length <= 100) {
						filteredChildren.forEach(child => {
							var childLink = 'omnioutliner:///open?row=' + child.identifier
							checklistStr += encodeURIComponent(child.topic + ' ' + childLink + '\n')
						})
					} else {
						for (var i = 0; i < limit; i++) {
							var child = filteredChildren[i]
							var childLink = 'omnioutliner:///open?row=' + child.identifier
							checklistStr += encodeURIComponent(child.topic + ' ' + childLink + '\n')
						}
					}
					urlStr += checklistStr
				}
				
				// Reveal the last item added in Things
				if (index === selection.items.length - 1) {
					urlStr += '&reveal=true'
				}
				
				if (includesWhen || includesDeadline) {
					var dateColumns = columns.filter(col => {
						return col.type === Column.Type.Date
					})
				}
				
				if (includesWhen) {
					var whenColumn = columnByTitle(dateColumns, 'When')
					var when = item.valueForColumn(whenColumn)
					if (when !== null) {
						if (includesReminder) {
							urlStr += '&when=' + encodeURIComponent(when.toString())
						} else {
							urlStr += '&when=' + encodeURIComponent(when.toDateString())
						}
						
					}
				}
				
				if (includesDeadline) {
					var deadlineColumn = columnByTitle(dateColumns, 'Deadline')
					var deadline = item.valueForColumn(deadlineColumn)
					if (deadline !== null) {urlStr += '&deadline=' + encodeURIComponent(deadline.toDateString())}
				}
				
				if (includesTags) {
					var tagsColumn = columnByTitle(filteredColumns, 'Tags')
					var tags = item.valueForColumn(tagsColumn)
					if (tags !== null && tags.string.length !== 0) {urlStr += '&tags=' + encodeURIComponent(tags.string)}
				}
				
				
				urls.push(URL.fromString(urlStr)) 
			})
			
			
			
			// Call the urls
			// Warn against flagging on multitasking as true
			if (multitasking === true) {
				var alertTitle = "Warning"
				var alertMessage = 'Things and OmniOutliner must be on the same screen.\nContinue with multitasking?'
				var alert = new Alert(alertTitle, alertMessage)
				alert.addOption("Cancel")
				alert.addOption("Continue")
				var alertPromise = alert.show()
				
				alertPromise.then(buttonIndex => {
					if (buttonIndex === 1){
						console.log("Continue without delay")
						repeatingCall(urls, 0, linkBack)
					} else {
						console.log("Continue with delay")
						repeatingCall(urls, delay, linkBack)
					}
				})
			} else {
				console.log("Continue with delay")
				repeatingCall(urls, delay, linkBack)
			}
			
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

// Minimal delay 0.8 for mutiple tasks if app switching is needed.
function repeatingCall(urls, delay, linkBack) {
	console.log('Calling URLs: ', urls)
	var counter = 0
	var repeats = urls.length
	
	// In the Timer, all user defined objects get invalidated. 
	// Usable objects: document, columns, rootItem, outlineColumn, noteColumn, statusColumn
	Timer.repeating(delay, function(timer){
		if (counter === repeats){
			console.log('done')
			timer.cancel()
			return 'Complete'
		} else {
			console.log('counter: ', counter)
			counter = counter + 1
			urls[counter - 1].call(function(result) {
				console.log('URL Call Result', result)
				if (linkBack) {
					var str = 'things:///show?id=' + result
					var thingsColumn = columns.byTitle('Things URL')
					var item = document.editors[0].selection.items[counter - 1]
					if (item !== null && item !== undefined) {
						var textObj = item.valueForColumn(thingsColumn)
						if (textObj !== null) {
							textObj = new Text(str, textObj.style)
							item.setValueForColumn(textObj, thingsColumn)
						} else {
							textObj = new Text(str, item.style)
							item.setValueForColumn(textObj, thingsColumn)
						}
					}
				}
				
			})
		}
	})
}

function columnByTitle(columnArray, title) {
	for (var i = 0; i < columnArray.length; i++) {
		if (columnArray[i].title === title) {
			return columnArray[i]
		}
	}
}