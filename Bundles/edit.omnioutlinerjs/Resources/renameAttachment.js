// This action renames attachments after replacing illegal characters in filenames to similar but legal ones for the files attached to the text columns of the selected rows.
(() => {
	var action = new PlugIn.Action(function(selection, sender){
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles
		try {
			// GET ARRAY OF VISIBLE TEXT COLUMNS (OMIT “NOTE BUTTON” COLUMN)
			var editor = document.editors[0]
			var textColumns = [noteColumn]
			columns.forEach(col => {
				if (editor.visibilityOfColumn(col)){
					if (col.type === Column.Type.Text){
						if (!textColumns.includes(col)){
							textColumns.push(col)
						}
					}
				}
			})
			if(textColumns.length === 0){throw new Error("This document has no text columns.")}
			
			// GET ARRAY OF FILEWRAPPERS FOR ATTACHED Files
			selection.items.forEach(row => {
				textColumns.forEach(col => {
					if(row.valueForColumn(col)){
						var atts = row.valueForColumn(col).attachments
						var attRanges = row.valueForColumn(col).ranges(TextComponent.Attachments)
						if(atts){
							atts.forEach((att,index) => {
								var wrapper = att.fileWrapper
								var range = attRanges[index]
								if(wrapper.type === FileWrapper.Type.File){
									// Replace illegal characters in filenames to similar but legal ones
									var filename = wrapper.preferredFilename 
									filename = filename.replace(/\//g, '⧸')
									filename = filename.replace(/\\/g, '⧹')
									filename = filename.replace(/</g, '＜')
									filename = filename.replace(/>/g, '＞')
									filename = filename.replace(/:/g, '：')
									filename = filename.replace(/"/g, '＂')
									filename = filename.replace(/\|/g, '⏐')
									filename = filename.replace(/\?/g, '？')
									filename = filename.replace(/\*/g, '＊')
									
									// CREATE FORM FOR GATHERING USER INPUT
									var inputForm = new Form()
									// CREATE TEXT FIELD
									var textField = new Form.Field.String(
										"textInput",
										"Filename",
										filename
									)
									
									// ADD THE FIELDS TO THE FORM
									inputForm.addField(textField)
									
									// PRESENT THE FORM TO THE USER
									formPrompt = ""
									formPromise = inputForm.show(formPrompt,"Continue")
									
									// VALIDATE THE USER INPUT
									inputForm.validate = function(formObject){
										var textValue = formObject.values["textInput"]
										var textStatus = (textValue && textValue.length > 0) ? true:false
										return textStatus
									}
								
									// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
									formPromise.then(function(formObject){
										// As attachments are read only, we need to replace the old one with new one instead of renaming the old one directly.
										if (filename !== formObject.values["textInput"]) {
											var newWrapper = FileWrapper.withContents(formObject.values["textInput"], wrapper.contents)
											var textObj = Text.makeFileAttachment(newWrapper, document.outline.baseStyle)
											row.valueForColumn(col).replace(range, textObj)
										}
										
									})
									
									// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
									formPromise.catch(function(err){
										console.log("form cancelled", err.message)
									})
								}
							})
						}
					}
				})
			})
			
			
		}
		catch(err){
			console.error(err)
		}
	});

	action.validate = function(selection, sender){
		// validation code
		// selection options: columns, document, editor, items, nodes, outline, styles
		return (selection.items.length > 0)
	};
	
	return action;
	})();