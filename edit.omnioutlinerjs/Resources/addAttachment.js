// This action inserts texts at the end or start of the selected column of selected rows.
(() => {
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles
		
		const sizeLimit = 250000000 // The app tends to crahs on iOS/iPadOS with files bigger than 250MB
		
		var selectedItem = selection.items[0]
		
		// List all visible text columns for insertion
		editor = document.editors[0]
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
		
		// Toggle if import urls or files
		var importURLOptionField = new Form.Field.Checkbox(
			"importURLOptionInput",
			"Add as URL",
			false
		)
		
		// Toggle if import url schemes for specific apps
		var defaultimportAppURLOption = false
		var importAppURLOptionField = function (bool) {
			return new Form.Field.Checkbox(
				"importAppURLOptionInput",
				"Add App URL",
				bool
			)
		}
		
		// ADD THE FIELDS TO THE FORM
		inputForm.addField(columnField)
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
				urlsArray.forEach((url, index) => {
					urlStr = url.string
					var ogText = selectedItem.valueForColumn(selectedColumn)
					
					if (importURL) {
						if (ogText) {
							var textObj = new Text(urlScheme(urlStr, importAppURL), ogText.style)
							if (!ogText.string.slice(-1).match(/\s/)) {
								var space = new Text(' ', ogText.style)
								ogText.append(space)
								ogText.append(textObj)
							}
						} else {
							var textObj = new Text(urlScheme(urlStr, importAppURL), selectedItem.style)
							selectedItem.setValueForColumn(textObj, selectedColumn)
						}
						
					} else {
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
						// IMPORT FILES
						url.fetch(function(data) {
							var size = data.length
							console.log(filename, size, 'bytes')
							if (size > sizeLimit && (app.platformName === 'iOS' || app.platformName === 'iPadOS')) {
								const displayNameLimit = 21
								if (filename.length > displayNameLimit) {
									var displayName = baseName.substring(0, baseName.length - (filename.length - displayNameLimit)) + '....' + extension
								} else {
									var displayName = filename
								}
								var alertTitle = "Confirmation"
								var alertMessage = displayName + "\nThis file is larger than 250MB, which may cause crash."
								var alert = new Alert(alertTitle, alertMessage)
								
								alert.addOption("Skip")
								alert.addOption("Add URL")
								alert.addOption("Add File")
								var alertPromise = alert.show()
								
								alertPromise.then(buttonIndex => {
									if (buttonIndex === 0) {
										console.log("skip large file")
									} else if (buttonIndex === 1) {
										console.log("adding url for large file")
										if (ogText) {
											var textObj = new Text(urlScheme(urlStr, false), ogText.style)
											if (!ogText.string.slice(-1).match(/\s/)) {
												var space = new Text(' ', ogText.style)
												ogText.append(space)
												ogText.append(textObj)
											}
										} else {
											var textObj = new Text(urlScheme(urlStr, importAppURL), selectedItem.style)
											selectedItem.setValueForColumn(textObj, selectedColumn)
										}
									} else if (buttonIndex === 2) {
										console.log("adding large file")
										var wrapper = FileWrapper.withContents(filename,data)
										if (ogText) {
											var textObj = Text.makeFileAttachment(wrapper, ogText.style)
											ogText.append(textObj)
										} else {
											var textObj = Text.makeFileAttachment(wrapper, selectedItem.style)
											selectedItem.setValueForColumn(textObj, selectedColumn)
										}
									}
								})
								
							} else {
								var wrapper = FileWrapper.withContents(filename,data)
								if (ogText) {
									var textObj = Text.makeFileAttachment(wrapper, ogText.style)
									ogText.append(textObj)
								} else {
									var textObj = Text.makeFileAttachment(wrapper, selectedItem.style)
									selectedItem.setValueForColumn(textObj, selectedColumn)
								}
							}
						})
					}
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
		if(selection.nodes.length === 1) {return true} else {return false}
	};
	
	return action;
})();


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
				result += ' gropen://' + encodeURIComponent(str) + '?cc=1'
			}
		}
	}
	
	return result + ' '
}