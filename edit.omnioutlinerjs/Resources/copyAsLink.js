// This action copies the item link(s) for the selected row(s).
var _ = function() {
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		
		if (selection.items.length > 1) {
			// CREATE FORM FOR GATHERING USER INPUT
			var inputForm = new Form()
			
			var arrayToggle = new Form.Field.Checkbox(
				'arrayToggleInput',
				'Copy as Array',
				false
			)
			
			inputForm.addField(arrayToggle)
			// PRESENT THE FORM TO THE USER
			formPrompt = "Copy as Link"
			formPromise = inputForm.show(formPrompt,"Continue")
			
			// VALIDATE THE USER INPUT
			inputForm.validate = function(formObject) {
				return null
			}
			
			// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
			formPromise.then(function(formObject) {
				var shareAsArray = formObject.values["arrayToggleInput"]
				
				linksArray = []
				selection.items.forEach(function(item) {
					itemLink = 'omnioutliner:///open?row=' + item.identifier
					linksArray.push(itemLink)
				})
				
				if (shareAsArray) {
					Pasteboard.general.strings = linksArray
				} else {
					Pasteboard.general.strings = [linksArray.join('\n')]
				}
			})
			
			// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
			formPromise.catch(function(err) {
				console.log("form cancelled", err.message)
			})
		} else {
			itemLink = 'omnioutliner:///open?row=' + selection.items[0].identifier + '\n'
			Pasteboard.general.strings = [itemLink]
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