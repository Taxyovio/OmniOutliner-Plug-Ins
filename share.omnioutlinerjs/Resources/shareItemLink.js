// This action presents the item links from selected rows in Share Sheet.
var _ = function() {
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		
		if (selection.items.length > 1) {
			// CREATE FORM FOR GATHERING USER INPUT
			var inputForm = new Form()
			
			var arrayToggle = new Form.Field.Checkbox(
				'arrayToggleInput',
				'Share as Array',
				false
			)
			
			inputForm.addField(arrayToggle)
			// PRESENT THE FORM TO THE USER
			formPrompt = "Share as Link"
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
					var sharePanel = new SharePanel(linksArray)
				} else {
					var sharePanel = new SharePanel([linksArray.join('\n')])
				}
				sharePanel.show()
			})
			
			// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
			formPromise.catch(function(err) {
				console.log("form cancelled", err.message)
			})
		} else {
			itemLink = 'omnioutliner:///open?row=' + selection.items[0].identifier
			var sharePanel = new SharePanel([itemLink])
			sharePanel.show()
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