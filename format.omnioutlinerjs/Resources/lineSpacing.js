// This action sets the line spacing as a multiple of font size for baseStyle of the whole document.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		var fontSize = parseFloat(document.outline.baseStyle.get(Style.Attribute.FontSize).toString())
		var curSpacing = parseFloat(document.outline.baseStyle.get(Style.Attribute.ParagraphLineSpacing).toString())
		var relativeHight = curSpacing / fontSize
		console.log(fontSize, curSpacing, relativeHight)
		var inputForm = new Form()
		
		// CREATE TEXT FIELD
		
		var spacingField = new Form.Field.String(
			"spacingInput",
			"Line Spacing",
			relativeHight.toString(),
			null
		)
		
		// ADD THE FIELDS TO THE FORM
		inputForm.addField(spacingField)
		// PRESENT THE FORM TO THE USER
		formPrompt = "Enter Line Spacing:"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject){
			var float = parseFloat(formObject.values["spacingInput"])
			if (isNaN(float) || float < 0) {
				throw new Error('Please enter a non-negative number.')
				return false
			} else {
				return null
			}
			
		}
	
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject){
			var relativeHight = formObject.values["spacingInput"]
			document.outline.baseStyle.set(Style.Attribute.ParagraphLineSpacing, fontSize * relativeHight)
		})
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if (document !== null) {return true}
	};
	
	return action;
}();
_;