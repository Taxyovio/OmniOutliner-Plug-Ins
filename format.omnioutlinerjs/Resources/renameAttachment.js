// This action renames attachments after replacing illegal characters in filenames to similar but legal ones for the files attached to the text columns of the selected rows.
(() => {
	var action = new PlugIn.Action(function(selection, sender){
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles
		
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
		if (textColumns.length === 0) {
			throw new Error("This document has no text columns.")
		}
		
		// GET ARRAY OF FILEWRAPPERS FOR ATTACHED FILES
		var numberOfAtts = 0
		selection.items.forEach(row => {
			textColumns.forEach(col => {
				if (row.valueForColumn(col)) {
					var style = row.valueForColumn(col).style
					var atts = row.valueForColumn(col).attachments
					var attRanges = row.valueForColumn(col).ranges(TextComponent.Attachments)
					if (atts) {
						numberOfAtts = numberOfAtts + atts.length
						atts.forEach((att,index) => {
							var wrapper = att.fileWrapper
							var range = attRanges[index]
							if(wrapper.type === FileWrapper.Type.File){
								
								var filename = wrapper.preferredFilename
								filename = legaliseFileName(filename)
								var baseName = filename.substring(0,filename.lastIndexOf('.'))
								var extension = filename.substring(filename.lastIndexOf('.') + 1, filename.length)
								
								// CREATE FORM FOR GATHERING USER INPUT
								var inputForm = new Form()
								// CREATE TEXT FIELD
								var baseNameField = new Form.Field.String(
									"baseNameInput",
									"Base Name",
									baseName
								)
								
								var extensionField = new Form.Field.String(
									"extensionInput",
									"Extension",
									extension
								)
								
								// ADD THE FIELDS TO THE FORM
								inputForm.addField(baseNameField)
								inputForm.addField(extensionField)
								
								// PRESENT THE FORM TO THE USER
								formPrompt = ""
								formPromise = inputForm.show(formPrompt,"Continue")
								
								// VALIDATE THE USER INPUT
								inputForm.validate = function(formObject){
									if (/\s/.test(formObject.values["extensionInput"].trim())) {
										return false
									} else {
										var textValue = formObject.values["baseNameInput"]
										var textStatus = (textValue && textValue.length > 0) ? true:false
										return textStatus
									}
								}
							
								// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
								formPromise.then(function(formObject){
									var newBaseName = legaliseFileName(formObject.values["baseNameInput"])
									var newExtension = formObject.values["extensionInput"]
									if (newExtension !== '') {
										var newFilename = newBaseName + '.' + newExtension
									} else {
										var newFilename = newBaseName
									}
									
									
									// As attachments are read only, we need to replace the old one with new one instead of renaming the old one directly.
									if (wrapper.preferredFilename !== newFilename) {
										var newWrapper = FileWrapper.withContents(newFilename, wrapper.contents)
										var textObj = Text.makeFileAttachment(newWrapper, style)
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
				
				// Work around a bug that crops images by forcing UI to update
				var ogAlignment = col.textAlignment
				if (ogAlignment === TextAlignment.Natural) {
					col.textAlignment = TextAlignment.Left
				} else {
					col.textAlignment = TextAlignment.Natural
				}
				col.textAlignment = ogAlignment
				})
		})
		if (numberOfAtts === 0) {
			throw new Error("No attachments are found.")
		}
	});

	action.validate = function(selection, sender){
		// validation code
		// selection options: columns, document, editor, items, nodes, outline, styles
		return (selection.items.length > 0)
	};
	
	return action;
})();

// Replace illegal characters in filenames to similar but legal ones
function legaliseFileName(filename) {
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