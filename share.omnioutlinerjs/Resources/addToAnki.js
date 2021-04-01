// This action requires using the 'Add to Anki' otemplate and appropriate configuration for card types in Anki. Three custom card types are defined with custom fields: {Basic: Front, Back, Reference, Reverse, Extra}, {Cloze: Text, Reference, Extra}, {Input: Front, Back, Reference, Extra}.

// This action creates a new note in Anki Mobile from the selected row using URL schemes. 
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		var columns = document.outline.columns
		if (!columns.byTitle('Deck') || !columns.byTitle('Front') || !columns.byTitle('Type')) {
			var alertTitle = "Confirmation"
			var alertMessage = "Missing required columns.\nCreate a new template document?"
			var alert = new Alert(alertTitle, alertMessage)
			alert.addOption("Cancel")
			alert.addOption("Continue")
			var alertPromise = alert.show()
			
			alertPromise.then(buttonIndex => {
				if (buttonIndex === 1){
					console.log("Continue script")
					createNewAnkiTemplate()
				} else {
					throw new Error('script cancelled')
				}
			})
			
		} else {
			
			// This is the delay between each url call, constrained by the app switching animation on iOS. 
			// If it's set to too low, there could be data loss on transport.
			// Set default delay to 1 sec on iOS devices unless there's only one selected item
			if (app.platformName === 'iOS' || app.platformName === 'iPadOS') {
				if (selection.items.length === 1) {
					var delay = 0
				} else {
					var delay = 1
				}
			} else {
				var delay = 0
			}
			console.log('Default delay is set to', delay, 'seconds.')
			
			
			// CREATE FORM FOR GATHERING USER INPUT
			var inputForm = new Form()
			
			if (Pasteboard.general.hasStrings) {
				var defaultProfile = Pasteboard.general.string
			} else {
				var defaultProfile = ''
			}
			
			// CREATE TEXT FIELD
			var profileField = new Form.Field.String(
				"profileInput",
				"Profile",
				defaultProfile
			)
			
			// ADD THE FIELDS TO THE FORM
			inputForm.addField(profileField)
			
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
			
			inputForm.validate = function(formObject){
				if (!formObject.values["profileInput"] || !formObject.values["profileInput"].trim()) {
					throw new Error('Profile name is invalid.')
				}
				return null
			}
			
			// PRESENT THE FORM TO THE USER
			formPrompt = "Add to Anki"
			formPromise = inputForm.show(formPrompt,"Continue")
			
			// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
			formPromise.then(function(formObject){
				var profile = formObject.values["profileInput"]
				// This field is undefined unless selecting multiple rows on iOS.
				try {var multitasking = formObject.values["multitaskingInput"]} catch(err) {multitasking = false}
				
				// Constructing array of urls to call
				var urls = []
				selection.items.forEach(function(item){
					try {var front = item.topic} catch(err) {var front = ''}
					try {var back = item.valueForColumn(columns.byTitle('Back')).string} catch(err) {var back=''}
					try {var deck = item.valueForColumn(columns.byTitle('Deck')).string} catch(err) {var deck = 'Default'}
					try {var type = item.valueForColumn(columns.byTitle('Type')).name} catch(err) {var type = 'Basic'}
					try {var tags = item.valueForColumn(columns.byTitle('Tags')).string} catch(err) {var tags = ''}
					try {var reference = item.valueForColumn(columns.byTitle('Reference')).string} catch(err) {var reference = ''}
					try {var extra = item.valueForColumn(columns.byTitle('Extra')).string} catch(err) {var extra = ''}
					try {var reverse = item.valueForColumn(columns.byTitle('Reverse')).name} catch(err) {var reverse = ''}
					
					if(front != ''){
						front = encodeURIComponent(front)
						back = encodeURIComponent(back)
						deck = encodeURIComponent(deck)
						type = encodeURIComponent(type)
						tags = encodeURIComponent(tags)
						if (type === 'Basic' || type === ''){
							urlStr = "anki://x-callback-url/addnote?profile=" + profile + "&type=" + type + "&deck=" + deck + "&fldFront=" + front + "&fldBack=" + back + "&tags=" + tags
							if (reverse === 'Yes') {
								urlStr = urlStr + "&fldReverse=Y"
							}
						} else if (type === 'Cloze'){
							urlStr = "anki://x-callback-url/addnote?profile=" + profile + "&type=" + type + "&deck=" + deck + "&fldText=" + front + "&tags=" + tags
						} else if (type === 'Input'){
							urlStr = "anki://x-callback-url/addnote?profile=" + profile + "&type=" + type + "&deck=" + deck + "&fldFront=" + front + "&fldBack=" + back + "&tags=" + tags
						}
						
						if(reference !== ''){urlStr = urlStr + "&fldReference=" + encodeURIComponent(reference)}
						if(extra !== ''){urlStr = urlStr + "&fldExtra=" + encodeURIComponent(extra)}
						urls.push(URL.fromString(urlStr))
					}
					
				})
				
				// Call the urls
				// Warn against flagging on multitasking as true
				if (multitasking === true) {
					var alertTitle = "Warning"
					var alertMessage = 'Anki and OmniOutliner must be on the same screen.\nContinue with multitasking?'
					var alert = new Alert(alertTitle, alertMessage)
					alert.addOption("Cancel")
					alert.addOption("Continue")
					var alertPromise = alert.show()
					
					alertPromise.then(buttonIndex => {
						if (buttonIndex === 1){
							console.log("Continue without delay")
							repeatingCall(urls, 0)
						} else {
							console.log("Continue with delay")
							repeatingCall(urls, delay)
						}
					})
				} else {
					console.log("Continue with delay")
					repeatingCall(urls, delay)
				}
				
			})
			
			// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
			formPromise.catch(function(err){
				console.log("form cancelled", err.message)
			})
		}
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.items.length > 0){return true} else {return false}
	};
	
	return action;
}();
_;

function createNewAnkiTemplate() {
	Document.makeNew(function(doc){
		outline = doc.outline
		editor = doc.editors[0]
		outline.outlineColumn.title = 'Front'
		outline.addColumn(
			Column.Type.Text, 
			editor.afterColumn(outline.outlineColumn), 
			function (column) {
				column.title = 'Back'
			}
		)
		outline.addColumn(
			Column.Type.Text, 
			editor.afterColumn(null), 
			function (column) {
				column.title = 'Tags'
			}
		)
		outline.addColumn(
			Column.Type.Text, 
			editor.afterColumn(null), 
			function (column) {
				column.title = 'Reference'
			}
		)
		outline.addColumn(
			Column.Type.Text, 
			editor.afterColumn(null), 
			function (column) {
				column.title = 'Extra'
			}
		)
		outline.addColumn(
			Column.Type.Enumeration, 
			editor.afterColumn(null), 
			function (column) {
				column.title = 'Reverse'
				column.enumeration.add('No')
				column.enumeration.add('Yes')
			}
		)
		
		outline.addColumn(
			Column.Type.Text, 
			editor.beforeColumn(outline.outlineColumn), 
			function (column) {
				column.title = 'Deck'
			}
		)
		outline.addColumn(
			Column.Type.Enumeration,
			editor.beforeColumn(outline.outlineColumn), 
			function (column) {
				column.title = 'Type'
				column.enumeration.add('Basic')
				column.enumeration.add('Cloze')
				column.enumeration.add('Input')
			}
		)
		baseItem = editor.rootNode.object
		baseItem.addChild(baseItem.beginning, function(item) {
			item.topic = 'This is the front text of a input card.'
			item.setValueForColumn(outline.columns.byTitle('Type').enumeration.memberNamed('Input'), outline.columns.byTitle('Type'))
			item.setValueForColumn('Academia', outline.columns.byTitle('Deck'))
			item.setValueForColumn('This is the back text for a input card.', outline.columns.byTitle('Back'))
			item.setValueForColumn('tag1 tag2', outline.columns.byTitle('Tags'))
			item.setValueForColumn('Wikipedia', outline.columns.byTitle('Reference'))
			item.setValueForColumn('Extra notes', outline.columns.byTitle('Extra'))
		})
		baseItem.addChild(baseItem.beginning, function(item) {
			item.topic = 'This is the {{c1::text}} of a {{c2::cloze card}}.'
			item.setValueForColumn(outline.columns.byTitle('Type').enumeration.memberNamed('Cloze'), outline.columns.byTitle('Type'))
			item.setValueForColumn('Academia', outline.columns.byTitle('Deck'))
			item.setValueForColumn('N/A', outline.columns.byTitle('Back'))
			item.setValueForColumn('tag1 tag2', outline.columns.byTitle('Tags'))
			item.setValueForColumn('Wikipedia', outline.columns.byTitle('Reference'))
			item.setValueForColumn('Extra notes', outline.columns.byTitle('Extra'))
		})
		baseItem.addChild(baseItem.beginning, function(item) {
			item.topic = 'This is the front text of a basic card.'
			item.setValueForColumn(outline.columns.byTitle('Type').enumeration.memberNamed('Basic'), outline.columns.byTitle('Type'))
			item.setValueForColumn('Academia', outline.columns.byTitle('Deck'))
			item.setValueForColumn('This is the back text for a basic card.', outline.columns.byTitle('Back'))
			item.setValueForColumn('tag1 tag2', outline.columns.byTitle('Tags'))
			item.setValueForColumn(outline.columns.byTitle('Reverse').enumeration.memberNamed('No'), outline.columns.byTitle('Reverse'))
			item.setValueForColumn('Wikipedia', outline.columns.byTitle('Reference'))
			item.setValueForColumn('Extra notes', outline.columns.byTitle('Extra'))
		})
		baseItem.addChild(baseItem.beginning, function(item) {
			item.topic = 'This is a template for the "Add to Anki" Omni Automation action. This action requires using appropriate configuration for card types in Anki. Three custom card types are defined with custom fields: {Basic: Front, Back, Reference, Reverse, Extra}, {Cloze: Text, Reference, Extra}, {Input: Front, Back, Reference, Extra}.'
		})
		doc.save()
		
		if (document) {
			var alertTitle = "Confirmation"
			var alertMessage = doc.name + '.ooutline has been created.\nClose current document?'
			var alert = new Alert(alertTitle, alertMessage)
			alert.addOption("Done")
			alert.addOption("Close")
			var alertPromise = alert.show()
			
			alertPromise.then(buttonIndex => {
				if (buttonIndex === 1){
					console.log("Continue script")
					document.close()
				} else {
					throw new Error('script cancelled')
				}
			})
		} else {
			var alertTitle = "Confirmation"
			var alertMessage = doc.name + '.ooutline has been created.'
			var alert = new Alert(alertTitle, alertMessage)
			var alertPromise = alert.show()
		}
	})
}

// Minimal delay 0.8 for mutiple tasks if app switching is needed.
function repeatingCall(urls, delay) {
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
			urls[counter - 1].call(function(result){console.log('result', result)})
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