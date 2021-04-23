// This action renames attachments after replacing illegal characters in filenames to similar but legal ones for the files attached to the text columns of the selected rows.
(() => {
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles
		
		// List all text columns
		var editor = document.editors[0]
		
		var textColumns = columns.filter(function(column) {
			if (column.type === Column.Type.Text) {return column}
		})
		
		if (textColumns.length === 0) {
			throw new Error("This document has no text columns.")
		}
		
		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form()
		
		// CREATE FIELDS
		var reviewToggle = new Form.Field.Checkbox(
			"reviewToggleInput",
			"Review Filename",
			true,
		)
		var legaliseToggle = new Form.Field.Checkbox(
			"legaliseToggleInput",
			"Replace Reserved Character",
			true,
		)
		var automaticToggle = new Form.Field.Checkbox(
			"automaticToggleInput",
			"Automatic Renaming",
			false,
		)
		
		
		// Use {%Column Title} to assign the value of the column to filename
		var defaultRule = '\{%' + outlineColumn.title + '\}-[\{%Notes\}]-(\{%Status\})'
		
		var renamingRuleField = function (str) {
			return new Form.Field.String(
				"renamingRuleInput",
				"Renaming Rule",
				str,
				null
			)
		}
		
		// ADD THE FIELDS TO THE FORM
		inputForm.addField(reviewToggle)
		inputForm.addField(legaliseToggle)
		inputForm.addField(automaticToggle)
		
		// PRESENT THE FORM TO THE USER
		formPrompt = "Rename Attachment"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject) {
			var keys = formObject.fields.map(field => field.key)
			if (keys.indexOf('renamingRuleInput') === -1) {
				if (formObject.values["automaticToggleInput"] === true) {
					formObject.addField(renamingRuleField(defaultRule))
				}
			} else {
				if (formObject.values["automaticToggleInput"] === false) {
					defaultRule = formObject.values["renamingRuleInput"]
					formObject.removeField(formObject.fields[keys.indexOf('renamingRuleInput')])
				} else {
					if (formObject.values["renamingRuleInput"].match(/\{%.*?\}/g) === null) {
						throw new Error('Invalid renaming rule.')
					}
				}
			}
			return null
		}
		
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject) {
			var review = formObject.values["reviewToggleInput"]
			var legalise = formObject.values["legaliseToggleInput"]
			
			var automatic = formObject.values["automaticToggleInput"]
			if (automatic) {
				var renamingRule = formObject.values["renamingRuleInput"] // This is insured to be not null nor blank.
			} else {
				var renamingRule = ''
			}
			console.log('review: ', review, ', legalise: ', legalise, ', automatic: ', automatic, '\nrenaming rule: ', renamingRule)
			
			// Get corresponding columns if automatic renaming
			if (automatic) {
				var matches = renamingRule.match(/\{%.*?\}/g) // This is insured to be non-null.
				// stripe off {%}
				//matches = matches.map(match => match.replace(/^\{%/, '').replace(/\}$/, ''))
				
				
				matches = matches.filter(match => {
					var columnTitle = match.replace(/^\{%/, '').replace(/\}$/, '')
					return match === '\{%Status\}' || match === '\{%Notes\}' || columns.byTitle(columnTitle)
				})
				console.log('matches: ', matches)
				
				var matchedColumns = matches.map(match => {
					var columnTitle = match.replace(/^\{%/, '').replace(/\}$/, '')
					if (columnTitle === 'Status') {
						return statusColumn
					} else if (columnTitle === 'Notes') {
						return noteColumn
					} else {
						return columns.byTitle(columnTitle)
					}
				})
				
				if (review) {
					renameAndReview(selection, textColumns, renamingRule, matches, matchedColumns, legalise)
				} else {
					rename(selection, textColumns, renamingRule, matches, matchedColumns, legalise)
					
				}
			} else {
				if (review) {
					renameAndReview(selection, textColumns, renamingRule, null, null, legalise)
				} else {
					rename(selection, textColumns, renamingRule, null, null, legalise)
				}
			}
			
		})
		
		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function(err) {
			console.log("form cancelled", err.message)
		})
		
	});
	
	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, outline, styles
		return (selection.items.length > 0)
	};
	
	return action;
})();

// Replace illegal characters in filenames to similar but legal ones
function legaliseFilename(filename) {
	filename = filename.replace(/\//g, '⧸')
	filename = filename.replace(/\\/g, '⧹')
	filename = filename.replace(/</g, '＜')
	filename = filename.replace(/>/g, '＞')
	filename = filename.replace(/:/g, '：')
	filename = filename.replace(/"/g, '＂')
	filename = filename.replace(/\|/g, '⏐')
	filename = filename.replace(/\?/g, '？')
	filename = filename.replace(/\*/g, '＊')
	return filename
}

function renameAndReview(selection, textColumns, renamingRule, matches, matchedColumns, legalise) {
	console.log('Rename and review')
	var numberOfAttachments = 0
	
	selection.items.forEach((item, selectionIndex) => {
		textColumns.forEach(column => {
			console.log('Rename attachments at item ', selectionIndex + 1, ' out of ', selection.items.length, ', column: ', column.title)
			var textObj = item.valueForColumn(column)
			if (textObj) {
				// Get attachments and their ranges
				var attachments = textObj.attachments
				var attachmentRanges = textObj.ranges(TextComponent.Attachments)
				
				var style = textObj.style
				
				if (attachments) {
					attachments.forEach((att, index) => {
						var wrapper = att.fileWrapper
						var range = attachmentRanges[index]
						
						// We only want to rename files, not directories nor symbolic links
						if(wrapper.type === FileWrapper.Type.File) {
							
							// Original filename
							var filename = wrapper.preferredFilename
							var baseName = filename.substring(0,filename.lastIndexOf('.'))
							var extension = filename.substring(filename.lastIndexOf('.') + 1, filename.length)
							
							// If there's no extension in the filename, the above codes assign the whole name to extension.
							if (baseName === '') {
								baseName = extension
								extension = ''
							}
							
							// CREATE FORM FOR GATHERING USER INPUT
							var inputForm = new Form()
							
							// The form can display up to 27 chars for the nanme of a checkbox field. Limit to a smaller value.
							const displayNameLimit = 21
							if (filename.length > displayNameLimit) {
								var displayName = baseName.substring(0, baseName.length - (filename.length - displayNameLimit)) + '....' + extension
							} else {
								var displayName = filename
							}
							
							var toggleField = new Form.Field.Checkbox(
								"toggleInput",
								displayName,
								true
							)
							
							
							// Generate new base name from renaming rule, limited to 99 chars.
							if (matches && matches.length !== 0) {
								// Get matched text objects from matched columns, replacing null objects with blank ones.
								var charCount = 0
								
								var matchedStrings = matchedColumns.map(col => {
									var value = item.valueForColumn(col)
									/*
									All column types:
									var Checkbox → Column.Type read-only
									var Date → Column.Type read-only
									var Duration → Column.Type read-only
									var Enumeration → Column.Type read-only
									var Number → Column.Type read-only
									var Text → Column.Type read-only
									*/
									
									if (col.type === Column.Type.Text) {
										// Value is a Text object
										if (value) {
											charCount += value.string.trim().length
											return value.string.trim()
										} else {
											return ''
										}
										
									} else if (col.type === Column.Type.Checkbox) {
										// Value is a State object
										if (value === State.Checked) {
											charCount += 7
											return 'Checked'
										} else if (value === State.Unchecked) {
											charCount += 9
											return 'Unchecked'
										} else if (value === State.Mixed) {
											charCount += 5
											return 'Mixed'
										} else {
											return ''
										}
										
									} else if (col.type === Column.Type.Date) {
										// Value is a Date object
										if (value) {
											charCount += value.toString().length
											return value.toString()
										} else {
											return ''
										}
										
									} else if (col.type === Column.Type.Duration || col.type === Column.Type.Number) {
										// Value is a Decimal object
										if (value) {
											charCount += value.toString().length
											return value.toString()
										} else {
											return ''
										}
										
									} else if (col.type === Column.Type.Enumeration) {
										// Value is an Enumaration object
										if (value) {
											charCount += value.name.trim().length
											return value.name.trim()
										} else {
											return ''
										}
										
									}
									
								})
								
								// Replace matched columnes in the renaming rule with texts from the columns
								baseName = renamingRule
								if (charCount < 100) {
									matchedStrings.forEach((str, index) => {
										baseName = baseName.replace(matches[index], str)
									})
								} else {
									var allowedCharCountPerMatch = Math.floor(99 / matches.length)
									matchedStrings.forEach((str, index) => {
										var subStr = str.substring(0, allowedCharCountPerMatch)
										var numberOfWords = subStr.match(/\b(\w+)\b/g).length
										if (numberOfWords > 1) {
											// If there's no white spaces at the end, remove the last potentially truncated word.
											subStr = subStr.replace(/\b\w*$/, '').trim()
										} else {
											subStr = subStr.trim()
										}
										if (str.length > subStr.length) {subStr += '...'}
										baseName = baseName.replace(matches[index], subStr)
									})
								}
								
								console.log('base filename generated by renaming rule: ', baseName)
							}
							
							
							
							// CREATE TEXT FIELD
							var baseNameField = new Form.Field.String(
								"baseNameInput",
								"Name",
								baseName
							)
							
							var extensionField = new Form.Field.String(
								"extensionInput",
								"Extension",
								extension
							)
							
							// ADD THE FIELDS TO THE FORM
							inputForm.addField(toggleField)
							inputForm.addField(baseNameField)
							inputForm.addField(extensionField)
							
							// PRESENT THE FORM TO THE USER
							formPrompt = "Review Filename"
							formPromise = inputForm.show(formPrompt,"Continue")
							
							// VALIDATE THE USER INPUT
							inputForm.validate = function(formObject) {
								if (formObject.values["toggleInput"] === false) {
									return true
								} else if (/\s/.test(formObject.values["extensionInput"].trim())) {
									return false
								} else {
									var textValue = formObject.values["baseNameInput"]
									var textStatus = (textValue && textValue.length > 0) ? true:false
									return textStatus
								}
							}
						
							// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
							formPromise.then(function(formObject) {
								var skipRenaming = !formObject.values["toggleInput"]
								
								if (!skipRenaming) {
									var newBaseName = formObject.values["baseNameInput"]
									var newExtension = formObject.values["extensionInput"]
									if (legalise) {newBaseName = legaliseFilename(newBaseName)}
									
									if (newExtension !== '') {
										var newFilename = newBaseName + '.' + newExtension
									} else {
										var newFilename = newBaseName
									}
									
									
									// As attachments are read only, we need to replace the old one with new one instead of renaming the old one directly.
									if (wrapper.preferredFilename !== newFilename) {
										numberOfAttachments += 1
										var newWrapper = FileWrapper.withContents(newFilename, wrapper.contents)
										var newTextObj = Text.makeFileAttachment(newWrapper, style)
										console.log(wrapper.preferredFilename, ' -> ', newFilename)
										textObj.replace(range, newTextObj)
										console.log('Renamed ', numberOfAttachments, ' attachments.')
										
										// Work around a bug that crops images by forcing UI to update. 
										// This comes at the cost that I have to write 'item.valueForColumn(column).replace(range, newTextObj)' instead of 'textObj.replace(range, newTextObj)'. Otherwise some attachments get deleted.
										// I can also wrap this alignment shuffling in a timer to avoid the above compromise. But that introduces 2 more steps in the action in case of undoing.
										/*
										var ogAlignment = column.textAlignment
										if (ogAlignment === TextAlignment.Natural) {
											column.textAlignment = TextAlignment.Left
										} else {
											column.textAlignment = TextAlignment.Natural
										}
										column.textAlignment = ogAlignment
										*/
									}
								}
							})
							
							// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
							formPromise.catch(function(err) {
								console.log("form cancelled", err.message)
							})
						}
					})
				}
			}
		})
	})
	return numberOfAttachments
}

function rename(selection, textColumns, renamingRule, matches, matchedColumns, legalise) {
	console.log('Rename without review')
	var numberOfAttachments = 0
	
	selection.items.forEach((item, selectionIndex) => {
		textColumns.forEach((column, columnIndex) => {
			console.log('Rename attachments at item ', selectionIndex + 1, ' out of ', selection.items.length, ', column: ', column.title)
			var textObj = item.valueForColumn(column)
			
			if (textObj) {
				// Get attachments and their ranges
				var attachments = textObj.attachments
				var attachmentRanges = textObj.ranges(TextComponent.Attachments)
				
				var style = textObj.style
				
				if (attachments) {
					attachments.forEach((att, index) => {
						var wrapper = att.fileWrapper
						var range = attachmentRanges[index]
						
						// We only want to rename files, not directories nor symbolic links
						if(wrapper.type === FileWrapper.Type.File) {
							
							// Original filename
							var filename = wrapper.preferredFilename
							var baseName = filename.substring(0,filename.lastIndexOf('.'))
							var extension = filename.substring(filename.lastIndexOf('.') + 1, filename.length)
							
							// If there's no extension in the filename, the above codes assign the whole name to extension.
							if (baseName === '') {
								baseName = extension
								extension = ''
							}
							
							// Generate new base name from renaming rule, limited to 99 chars.
							if (matches && matches.length !== 0) {
								// Get matched text objects from matched columns, replacing null objects with blank ones.
								var charCount = 0
								
								var matchedStrings = matchedColumns.map(col => {
									var value = item.valueForColumn(col)
									/*
									All column types:
									var Checkbox → Column.Type read-only
									var Date → Column.Type read-only
									var Duration → Column.Type read-only
									var Enumeration → Column.Type read-only
									var Number → Column.Type read-only
									var Text → Column.Type read-only
									*/
									
									if (col.type === Column.Type.Text) {
										// Value is a Text object
										if (value) {
											charCount += value.string.trim().length
											return value.string.trim()
										} else {
											return ''
										}
										
									} else if (col.type === Column.Type.Checkbox) {
										// Value is a State object
										if (value === State.Checked) {
											charCount += 7
											return 'Checked'
										} else if (value === State.Unchecked) {
											charCount += 9
											return 'Unchecked'
										} else if (value === State.Mixed) {
											charCount += 5
											return 'Mixed'
										} else {
											return ''
										}
										
									} else if (col.type === Column.Type.Date) {
										// Value is a Date object
										if (value) {
											charCount += value.toString().length
											return value.toString()
										} else {
											return ''
										}
										
									} else if (col.type === Column.Type.Duration || col.type === Column.Type.Number) {
										// Value is a Decimal object
										if (value) {
											charCount += value.toString().length
											return value.toString()
										} else {
											return ''
										}
										
									} else if (col.type === Column.Type.Enumeration) {
										// Value is an Enumaration object
										if (value) {
											charCount += value.name.trim().length
											return value.name.trim()
										} else {
											return ''
										}
										
									}
									
								})
								
								// Replace matched columnes in the renaming rule with texts from the columns
								baseName = renamingRule
								if (charCount < 100) {
									matchedStrings.forEach((str, index) => {
										baseName = baseName.replace(matches[index], str)
									})
								} else {
									var allowedCharCountPerMatch = Math.floor(99 / matches.length)
									matchedStrings.forEach((str, index) => {
										var subStr = str.substring(0, allowedCharCountPerMatch)
										var numberOfWords = subStr.match(/\b(\w+)\b/g).length
										if (numberOfWords > 1) {
											// If there's no white spaces at the end, remove the last potentially truncated word.
											subStr = subStr.replace(/\b\w*$/, '').trim()
										} else {
											subStr = subStr.trim()
										}
										if (str.length > subStr.length) {subStr += '...'}
										baseName = baseName.replace(matches[index], subStr)
									})
								}
								
								console.log('base filename generated by renaming rule: ', baseName)
							}
							
							var newBaseName = baseName
							if (legalise) {newBaseName = legaliseFilename(newBaseName)}
							
							if (extension !== '') {
								var newFilename = newBaseName + '.' + extension
							} else {
								var newFilename = newBaseName
							}
							
							
							// As attachments are read only, we need to replace the old one with new one instead of renaming the old one directly.
							if (wrapper.preferredFilename !== newFilename) {
								numberOfAttachments += 1
								var newWrapper = FileWrapper.withContents(newFilename, wrapper.contents)
								var newTextObj = Text.makeFileAttachment(newWrapper, style)
								console.log(wrapper.preferredFilename, ' -> ', newFilename)
								textObj.replace(range, newTextObj)
								console.log('Renamed ', numberOfAttachments, ' attachments.')
								
								
							}
						}
					})
				}
			}
		})
	})
	var alertTitle = "Confirmation"
	if (numberOfAttachments === 0) {
		var alertMessage = 'No attachment has been renamed.'
	} else if (numberOfAttachments === 1) {
		var alertMessage = '1 attachment has been renamed.'
	} else {
		var alertMessage = numberOfAttachments + ' attachments have been renamed.'
	}
	
	var alert = new Alert(alertTitle, alertMessage)
	alert.show()
	return numberOfAttachments
}