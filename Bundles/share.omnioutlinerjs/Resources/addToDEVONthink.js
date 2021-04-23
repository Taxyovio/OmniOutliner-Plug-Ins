// This action creates a new text file in DEVONthink To Go from the selected row using URL schemes. Document name is passed as text title. Topic is passed as text body. Note is passed as comment. Item link is passed as URL.
var _ = function() {
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		const Lib = this.plugIn.library('ApplicationLib')
		// selection options: columns, document, editor, items, nodes, styles
		
		const editor = document.editors[0]
		
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
		
		// Create DEVONthink ID column
		if (!columns.byTitle('DEVONthink ID') || columns.byTitle('DEVONthink ID').type !== Column.Type.Text) {
			document.outline.addColumn(Column.Type.Text, editor.afterColumn(), 
				function (column) {
					column.title = 'DEVONthink ID'
				}
			)
			
		}
		
		
		// Creating urls
		var urls = []
		selection.items.forEach(function(item) {
			try {title = document.name} catch(err) {title = ''}
			try {text = Lib.textToMD(item.valueForColumn(outlineColumn))} catch(err) {text = ''}
			try {comment = Lib.textToMD(item.valueForColumn(noteColumn))} catch(err) {comment = ''}
			itemLink = 'omnioutliner:///open?row=' + item.identifier
			itemLink = encodeURIComponent(itemLink)
			title = encodeURIComponent(title)
			if(text != '') {
				text = encodeURIComponent(text)
				urlStr = "x-devonthink://x-callback-url/createtext?title=" + title + "&text=" + text + "&location=" + itemLink
				if (comment != '') {
					comment = encodeURIComponent(comment)
					urlStr += "&comment=" + comment
				}
				urls.push(URL.fromString(urlStr))
			}
		})
		
		// Call the urls
		// Warn against flagging on multitasking as true
		if (selection.items.length > 1) {
			var alertTitle = "Confirmation"
			var alertMessage = 'The process can be accerelated if DEVONthink and OmniOutliner are on the same screen.\nContinue with multitasking?'
			var alert = new Alert(alertTitle, alertMessage)
			alert.addOption("No")
			alert.addOption("Continue")
			var alertPromise = alert.show()
			
			alertPromise.then(buttonIndex => {
				if (buttonIndex === 1) {
					console.log("Continue without delay")
					repeatingCall(urls, 0)
				} else {
					console.log("Continue with delay")
					repeatingCall(urls, delay)
				}
			})
		
		} else {
			console.log("Continue without delay")
			repeatingCall(urls, 0)
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

// Minimal delay 0.8 for mutiple tasks if app switching is needed.
function repeatingCall(urls, delay) {
	console.log('Calling URLs: ', urls)
	var counter = 0
	var repeats = urls.length
	
	// In the Timer, all user defined objects get invalidated. 
	// Usable objects: document, columns, rootItem, outlineColumn, noteColumn, statusColumn
	Timer.repeating(delay, function(timer) {
		if (counter === repeats) {
			console.log('done')
			timer.cancel()
			return 'Complete'
		} else {
			console.log('counter: ', counter)
			counter = counter + 1
			urls[counter - 1].call(function(result) {
				console.log('result', JSON.stringify(result))
				var urlStr = result.itemlink
				var str = urlStr.replace(/x-devonthink-item:\/\//, '')
				var url = URL.fromString(urlStr)
				var item = document.editors[0].selection.items[counter - 1]
				
				var textColumns = columns.filter(function(column) {
					if (column.type === Column.Type.Text) {return column}
				})
				
				var urlColumn = columnByTitle(textColumns, 'DEVONthink ID')
				
				var textObj = item.valueForColumn(urlColumn)
				if (textObj) {
					textObj = new Text(str, textObj.style)
					textObj.style.set(Style.Attribute.Link, url)
					item.setValueForColumn(textObj, urlColumn)
				} else {
					textObj = new Text(str, item.style)
					textObj.style.set(Style.Attribute.Link, url)
					item.setValueForColumn(textObj, urlColumn)
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