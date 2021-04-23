// This action imports the selected files, trying to put them into the correct rows by matching filenames with item contents.
(() => {
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles
		
		// List all visible text columns for insertion
		const editor = document.editors[0]
		var filteredColumns = columns.filter(function(column) {
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
		
		
		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form()
		
		// Define default column for selection
		if (filteredColumnTitles.indexOf('attachment') !== -1) {
			var index = filteredColumnTitles.indexOf('attachment')
			var defaultColumn = filteredColumns[index]
		} else if (filteredColumnTitles.indexOf('Attachment') !== -1) {
			var index = filteredColumnTitles.indexOf('Attachment')
			var defaultColumn = filteredColumns[index]
		} else if (filteredColumnTitles.indexOf('attachments') !== -1) {
			var index = filteredColumnTitles.indexOf('attachments')
			var defaultColumn = filteredColumns[index]
		} else if (filteredColumnTitles.indexOf('Attachments') !== -1) {
			var index = filteredColumnTitles.indexOf('Attachments')
			var defaultColumn = filteredColumns[index]
		} else if (filteredColumns.indexOf(document.outline.outlineColumn) !== -1) {
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
		
		// Toggle if import urls or files
		var importURLOptionField = new Form.Field.Checkbox(
			"importURLOptionInput",
			"Import as URL",
			false
		)
		
		// Toggle if import url schemes for specific apps
		var defaultimportAppURLOption = false
		var importAppURLOptionField = function (bool) {
			return new Form.Field.Checkbox(
				"importAppURLOptionInput",
				"Import App URL",
				bool
			)
		}
		// Toggle if importing attachments into new rows if no match is found
		var importUnmatchedOptionField = new Form.Field.Checkbox(
			"importUnmatchedOptionInput",
			"Import Unmatched Attachment",
			true
		)
		
		// ADD THE FIELDS TO THE FORM
		inputForm.addField(columnField)
		inputForm.addField(importUnmatchedOptionField)
		inputForm.addField(importURLOptionField)
		// PRESENT THE FORM TO THE USER
		formPrompt = "Select Column and Import Option"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject) {
			var keys = formObject.fields.map(field => field.key)
			if (formObject.values["importURLOptionInput"] === true) {
				if (keys.indexOf('importAppURLOptionInput') === -1) {
					formObject.addField(importAppURLOptionField(defaultimportAppURLOption))
				}
			} else {
				if (keys.indexOf('importAppURLOptionInput') !== -1) {
					defaultimportAppURLOption = formObject.values["importAppURLOptionInput"]
					formObject.removeField(formObject.fields[keys.indexOf('importAppURLOptionInput')])
				}
			}
			return null
		}
	
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject) {
			var selectedColumn = formObject.values["columnInput"]
			var importURL = formObject.values["importURLOptionInput"]
			var importUnmatched = formObject.values["importUnmatchedOptionInput"]
			
			if (importURL) {
				var importAppURL = formObject.values["importAppURLOptionInput"]
			}
			
			var picker = new FilePicker()
			picker.folders = false
			picker.multiple = true
			picker.types = null
			
			pickerPromise = picker.show()
			
			// PROMISE FUNCTION CALLED UPON PICKER APPROVAL
			pickerPromise.then(function(urlsArray) {
				urlsArray.forEach(url => {
					// Match attachments into rows and get the matched item or null if no match
					var matchedItem = matchItem(url, selectedColumn, importUnmatched, importURL, importAppURL)
					
				})
			})
			// PROMISE FUNCTION CALLED UPON PICKER CANCELLATION
			pickerPromise.catch(function(error) {
				console.log("form cancelled", error.message)
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
		if(document) {return true} else {return false}
	};
	
	return action;
})();


// Return item if its visible texts contain at least some threshold percentage of the words 
function matchItem(url, selectedColumn, importUnmatched, importURL, importAppURL) {
	var threshold = 0.75 // Adjusting how relaxed the match is.
	const displayNameLimit = 21
	const sizeLimit = 250000000 // The app tends to crahs on iOS/iPadOS with files bigger than 250MB
	
	urlStr = url.string
	// GET FILE NAME
	var filename = urlStr.substring(urlStr.lastIndexOf('/')+1)
	// REMOVE FILE EXTENSION AND ENCODING
	var baseName = filename.substring(0,filename.lastIndexOf('.'))
	baseName = decodeURIComponent(baseName)
	var extension = filename.substring(filename.lastIndexOf('.') + 1, filename.length)
			
	// If there's no extension in the filename, the above codes assign the whole name to extension.
	if (baseName === '') {
		baseName = extension
		extension = ''
	}
	if (extension === '') {
		filename = baseName
	} else {
		filename = baseName + '.' + extension
	}
	var str = baseName
	var words = str.match(/\b(\w+)\b/g)
	
	// 100 most common words to exclude
	const commonWords = ["the","be","to","of","and","a","in","that","have","I","it","for","not","on","with","he","as","you","do","at","this","but","his","by","from","they","we","say","her","she","or","an","will","my","one","all","would","there","their","what","so","up","out","if","about","who","get","which","go","me","when","make","can","like","time","no","just","him","know","take","people","into","year","your","good","some","could","them","see","other","than","then","now","look","only","come","its","over","think","also","back","after","use","two","how","our","work","first","well","way","even","new","want","because","any","these","give","day","most","us"]
	
	words = words.filter(function(word) {
		if (commonWords.indexOf(word.toLowerCase()) === -1) {return word}
	})
	console.log('words: ',words)
	
	// Warn if there are too few words to match and give the option to skip matching.
	if (words.length === 0) {
		var alertTitle = "Confirmation"
		var alertMessage = "No valid words to match in \n\"" + str + "\"\nSkip automatical matching?"
		var alert = new Alert(alertTitle, alertMessage)
		var alertPromise = alert.show()
		console.log("Skip matching as no words to match.")
		if (importUnmatched) {
			if (importURL) {
				// Add new row at the bottom
				var textObj = new Text(urlScheme(urlStr, importAppURL), document.outline.baseStyle)
				rootItem.addChild(null, function(item) {
					item.setValueForColumn(textObj, selectedColumn)
				})
				
			} else {
				url.fetch(function(data) {
					var size = data.length
					console.log(filename, size, 'bytes')
					
					
					if (size > sizeLimit && (app.platformName === 'iOS' || app.platformName === 'iPadOS')) {
						
						if (filename.length > displayNameLimit) {
							var displayName = baseName.substring(0, baseName.length - (filename.length - displayNameLimit)) + '....' + extension
						} else {
							var displayName = filename
						}
						var alertTitle = "Confirmation"
						var alertMessage = displayName + "\nA file larger than 250MB might cause crash.\nContinue to add?"
						var alert = new Alert(alertTitle, alertMessage)
						alert.addOption("Skip")
						alert.addOption("Continue")
						var alertPromise = alert.show()
						
						alertPromise.then(buttonIndex => {
							if (buttonIndex === 1) {
								console.log("Continue script")
								var wrapper = FileWrapper.withContents(filename,data)
								// Add new row at the bottom
								var textObj = Text.makeFileAttachment(wrapper, document.outline.baseStyle)
								rootItem.addChild(null, function(item) {
									item.setValueForColumn(textObj, selectedColumn)
								})
							}
						})
						
					} else {
						var wrapper = FileWrapper.withContents(filename,data)
						// Add new row at the bottom
						var textObj = Text.makeFileAttachment(wrapper, document.outline.baseStyle)
						rootItem.addChild(null, function(item) {
							item.setValueForColumn(textObj, selectedColumn)
						})
					}
				})
			}
		}
		return null
		
	} else if (words.length < 5) {
		var alertTitle = "Confirmation"
		var alertMessage = "Too few words to match in \n\"" + str + "\"\nSkip automatical matching?"
		var alert = new Alert(alertTitle, alertMessage)
		alert.addOption("Match")
		alert.addOption("Skip")
		var alertPromise = alert.show()
		
		alertPromise.then(buttonIndex => {
			if (buttonIndex === 1) {
				console.log("Skip matching as instructed by user.")
				
				if (importUnmatched) {
					if (importURL) {
						// Add new row at the bottom
						var textObj = new Text(urlScheme(urlStr, importAppURL), document.outline.baseStyle)
						rootItem.addChild(null, function(item) {
							item.setValueForColumn(textObj, selectedColumn)
						})
						
					} else {
						url.fetch(function(data) {
							var size = data.length
							console.log(filename, size, 'bytes')
							if (size > sizeLimit && (app.platformName === 'iOS' || app.platformName === 'iPadOS')) {
								
								if (filename.length > displayNameLimit) {
									var displayName = baseName.substring(0, baseName.length - (filename.length - displayNameLimit)) + '....' + extension
								} else {
									var displayName = filename
								}
								var alertTitle = "Confirmation"
								var alertMessage = displayName + "\nA file larger than 250MB might cause crash.\nContinue to add?"
								var alert = new Alert(alertTitle, alertMessage)
								alert.addOption("Skip")
								alert.addOption("Continue")
								var alertPromise = alert.show()
								
								alertPromise.then(buttonIndex => {
									if (buttonIndex === 1) {
										console.log("Continue script")
										var wrapper = FileWrapper.withContents(filename,data)
										// Add new row at the bottom
										var textObj = Text.makeFileAttachment(wrapper, document.outline.baseStyle)
										rootItem.addChild(null, function(item) {
											item.setValueForColumn(textObj, selectedColumn)
										})
									}
								})
								
							} else {
								var wrapper = FileWrapper.withContents(filename,data)
								// Add new row at the bottom
								var textObj = Text.makeFileAttachment(wrapper, document.outline.baseStyle)
								rootItem.addChild(null, function(item) {
									item.setValueForColumn(textObj, selectedColumn)
								})
							}
							
						})
					}
				}
				
				return null
			} else {
				return autoMatch()
			}
		})
	} else {
		return autoMatch()
	}
	
	
	function autoMatch() {
		const editor = document.editors[0]
		var filteredColumns = columns.filter(function(column) {
			if (editor.visibilityOfColumn(column)) {
				if (column.type === Column.Type.Text) {return column}
			}
		})
		
		if (filteredColumns.length === 0) {
			throw new Error("This document has no text columns.")
		}
		var blacklist = [] // Store indices of items that are below threshold
		var repeats = Math.floor((1.0 - threshold) * words.length + 1)
		if (repeats > words.length) {repeats = words.length}
		for (var pass = 0; pass < repeats; pass++) {
			console.log('pass', pass + 1, ' out of ', repeats)
			// Go through all items once and return the item that matches all but some 'pass' number of words
			for (var i = 0; i < rootItem.descendants.length; i++) {
				console.log('Checking item ', i + 1, ' out of ', rootItem.descendants.length)
				if (blacklist.indexOf(i) === -1) {
					var item = rootItem.descendants[i]
					
					var visibleStr = ''
					filteredColumns.forEach(col => {
						var textObj = item.valueForColumn(col)
						if (textObj) {
							visibleStr += textObj.string.trim() + '\n'
						}
					})
					console.log('Visible texts to match:\n', visibleStr)
					
					var matchCount = 0
					words.forEach(word => {
						if (visibleStr.toLowerCase().includes(word.toLowerCase())) {matchCount += 1}
					})
					console.log('Match: ', matchCount, ' out of ', words.length)
					
					if (matchCount === words.length - pass) {
						console.log('Return matched item.')
						var matchedItem = item
						var ogText = matchedItem.valueForColumn(selectedColumn)
						if (importURL) {
							if (ogText) {
								var textObj = new Text(urlScheme(urlStr, importAppURL), ogText.style)
								var space = new Text(' ', ogText.style)
								ogText.append(space)
								ogText.append(textObj)
							} else {
								var textObj = new Text(urlStr, matchedItem.style)
								matchedItem.setValueForColumn(textObj, selectedColumn)
							}
							
						} else {
							url.fetch(function(data) {
								var size = data.length
								console.log(filename, size, 'bytes')
								if (size > sizeLimit && (app.platformName === 'iOS' || app.platformName === 'iPadOS')) {
									
									if (filename.length > displayNameLimit) {
										var displayName = baseName.substring(0, baseName.length - (filename.length - displayNameLimit)) + '....' + extension
									} else {
										var displayName = filename
									}
									var alertTitle = "Confirmation"
									var alertMessage = displayName + "\nA file larger than 250MB might cause crash.\nContinue to add?"
									var alert = new Alert(alertTitle, alertMessage)
									alert.addOption("Skip")
									alert.addOption("Continue")
									var alertPromise = alert.show()
									
									alertPromise.then(buttonIndex => {
										if (buttonIndex === 1) {
											console.log("Continue script")
											var wrapper = FileWrapper.withContents(filename,data)
											if (ogText !== null) {
												var textObj = Text.makeFileAttachment(wrapper, ogText.style)
												ogText.append(textObj)
											} else {
												var textObj = Text.makeFileAttachment(wrapper, matchedItem.style)
												matchedItem.setValueForColumn(textObj, selectedColumn)
											}
										}
									})
									
								} else {
									var wrapper = FileWrapper.withContents(filename,data)
									if (ogText !== null) {
										var textObj = Text.makeFileAttachment(wrapper, ogText.style)
										ogText.append(textObj)
									} else {
										var textObj = Text.makeFileAttachment(wrapper, matchedItem.style)
										matchedItem.setValueForColumn(textObj, selectedColumn)
									}
								}
							})
						}
						
						return item
					} else if (matchCount < words.length - repeats) {
						console.log('Not a match. Add to blacklist.')
						blacklist.push(i)
					} else if (matchCount < words.length - pass) {
						console.log('Not a match this pass. But a potential match.')
					}
				} else {
					console.log('Skip item in blacklist.')
				}
			}
		}
		
		// Return null if no match above threshold is found.
		console.log('Return null.')
		if (importUnmatched) {
			if (importURL) {
				// Add new row at the bottom
				var textObj = new Text(urlScheme(urlStr, importAppURL), document.outline.baseStyle)
				rootItem.addChild(null, function(item) {
					item.setValueForColumn(textObj, selectedColumn)
				})
				
			} else {
				url.fetch(function(data) {
					var size = data.length
					console.log(filename, size, 'bytes')
					if (size > sizeLimit && (app.platformName === 'iOS' || app.platformName === 'iPadOS')) {
						
						if (filename.length > displayNameLimit) {
							var displayName = baseName.substring(0, baseName.length - (filename.length - displayNameLimit)) + '....' + extension
						} else {
							var displayName = filename
						}
						var alertTitle = "Confirmation"
						var alertMessage = displayName + "\nA file larger than 250MB might cause crash.\nContinue to add?"
						var alert = new Alert(alertTitle, alertMessage)
						alert.addOption("Skip")
						alert.addOption("Continue")
						var alertPromise = alert.show()
						
						alertPromise.then(buttonIndex => {
							if (buttonIndex === 1) {
								console.log("Continue script")
								var wrapper = FileWrapper.withContents(filename,data)
								// Add new row at the bottom
								var textObj = Text.makeFileAttachment(wrapper, document.outline.baseStyle)
								rootItem.addChild(null, function(item) {
									item.setValueForColumn(textObj, selectedColumn)
								})
							}
						})
						
					} else {
						var wrapper = FileWrapper.withContents(filename,data)
						// Add new row at the bottom
						var textObj = Text.makeFileAttachment(wrapper, document.outline.baseStyle)
						rootItem.addChild(null, function(item) {
							item.setValueForColumn(textObj, selectedColumn)
						})
					}
				})
			}
		}
		
		return null
	}
}

function urlScheme(urlStr, importAppURL) {
	var result = urlStr
	
	if (app.platformName === 'iOS' || app.platformName === 'iPadOS') {
		
		// Convert url to Files.app url
		var filesURL = urlStr.replace(/^file\:\/\/\//, 'shareddocuments:\/\/\/')
		result = filesURL
		
		if (importAppURL) {
			// Add url schemes to files stored in specific apps
			const uuidGoodReader = '6D808056-1B96-4C2B-94BF-5C5244474FBD'
			
			if (urlStr.includes(uuidGoodReader)) {
				var regex = new RegExp(uuidGoodReader + '/Documents/.*', '')
				var matchedStr = urlStr.match(regex)[0]
				var str = matchedStr.substring(uuidGoodReader.length + '/Documents/'.length, matchedStr.length)
				str = '0/' + decodeURIComponent(str)
				console.log('GoodReader', urlStr, '->', str)
				result += '\ngropen://' + encodeURIComponent(str) + '?cc=1'
			}
		}
	}
	
	return result + ' '
}