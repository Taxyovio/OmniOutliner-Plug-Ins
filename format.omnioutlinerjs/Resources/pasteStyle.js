// This action pastes the style of the selected row into the targets selected in the form.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		var selectedItem = selection.items[0]
		var rootItem = document.outline.rootItem
		
		// Nowhere to paste if there's only one row
		if (rootItem.descendants.length <= 1) {
			throw new Error('No rows available for pasting.')
		}
		
		// Collect pasting targets
		var inputForm = new Form()
		
		var allField = new Form.Field.Checkbox(
			'allInput',
			'All',
			false
		)
		inputForm.addField(allField)
		
		if (selectedItem.hasChildren) {
			var descendantsField = new Form.Field.Checkbox(
				'descendantsInput',
				'Descendants',
				false
			)
			inputForm.addField(descendantsField)
			
			var childrenField = new Form.Field.Checkbox(
				'childrenInput',
				'Children',
				false
			)
			inputForm.addField(childrenField)
			
			var leavesField = new Form.Field.Checkbox(
				'leavesInput',
				'Leaves',
				false
			)
			inputForm.addField(leavesField)
		}
		
		// The rootItem has no parent nor ancestors.
		if (selectedItem.parent !== rootItem) {
			var ancestorsField = new Form.Field.Checkbox(
				'ancestorsInput',
				'Ancestors',
				false
			)
			inputForm.addField(ancestorsField)
			
			var parentField = new Form.Field.Checkbox(
				'parentInput',
				'Parent',
				false
			)
			inputForm.addField(parentField)
		}
		
		if (selectedItem.parent.children.length > 1) {
			
			// This means all following siblings and their descendants, basically everything below.
			var followingCollateralDescendantsField = new Form.Field.Checkbox(
				'followingCollateralDescendantsInput',
				'Following Collateral Descendants',
				false
			)
			inputForm.addField(followingCollateralDescendantsField)
			
			// Similarly this is everything above.
			var precedingCollateralDescendantsField = new Form.Field.Checkbox(
				'precedingCollateralDescendantsInput',
				'Preceding Collateral Descendants',
				false
			)
			inputForm.addField(precedingCollateralDescendantsField)
			
			var followingSiblingsField = new Form.Field.Checkbox(
				'followingSiblingsInput',
				'Following Siblings',
				false
			)
			inputForm.addField(followingSiblingsField)
			
			var precedingSiblingsField = new Form.Field.Checkbox(
				'precedingSiblingsInput',
				'Preceding Siblings',
				false
			)
			inputForm.addField(precedingSiblingsField)
		}
		
		
		
		formPrompt = "Select Paste Targets:"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject){
			return null
		}
	
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject){
			var sourceStyle = selectedItem.style
			
			var allChosen = formObject.values["allInput"]
			
			var descendantsChosen = formObject.values["descendantsInput"]
			var childrenChosen = formObject.values["childrenInput"]
			var leavesChosen = formObject.values["leavesInput"]
			
			var ancestorsChosen = formObject.values["ancestorsInput"]
			var parentChosen = formObject.values["parentInput"]
			
			var followingCollateralDescendantsChosen = formObject.values["followingCollateralDescendantsInput"]
			var precedingCollateralDescendantsChosen = formObject.values["precedingCollateralDescendantsInput"]
			
			var followingSiblingsChosen = formObject.values["followingSiblingsInput"]
			var precedingSiblingsChosen = formObject.values["precedingSiblingsInput"]
			
			
			if (allChosen) {
				rootItem.descendants.forEach(item => {
					item.style.setStyle(sourceStyle)
				})
			} else {
				if (descendantsChosen) {
					selectedItem.descendants.forEach(item => {
						item.style.setStyle(sourceStyle)
					})
				}
				
				if (!descendantsChosen && childrenChosen) {
					selectedItem.children.forEach(item => {
						item.style.setStyle(sourceStyle)
					})
				}
				
				if (!descendantsChosen && leavesChosen) {
					selectedItem.leaves.forEach(item => {
						item.style.setStyle(sourceStyle)
					})
				}
				
				if (ancestorsChosen) {
					selectedItem.ancestors.forEach(item => {
						item.style.setStyle(sourceStyle)
					})
				}
				
				if (!ancestorsChosen && parentChosen) {
					selectedItem.parent.style.setStyle(sourceStyle)
				}
				
				if (followingCollateralDescendantsChosen) {
					selectedItem.followingSiblings.forEach(item => {
						item.style.setStyle(sourceStyle)
						item.descendants.forEach(des => {
							des.style.setStyle(sourceStyle)
						})
					})
				}
				
				if (precedingCollateralDescendantsChosen) {
					selectedItem.precedingSiblings.forEach(item => {
						item.style.setStyle(sourceStyle)
						item.descendants.forEach(des => {
							des.style.setStyle(sourceStyle)
						})
					})
				}
				
				if (!followingCollateralDescendantsChosen && followingSiblingsChosen) {
					selectedItem.followingSiblings.forEach(item => {
						item.style.setStyle(sourceStyle)
					})
				}
				
				if (!precedingCollateralDescendantsChosen && precedingSiblingsChosen) {
					selectedItem.precedingSiblings.forEach(item => {
						item.style.setStyle(sourceStyle)
					})
				}
			}
		})
		
		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function(err){
			console.log("form cancelled", err.message)
		})
	});
		
	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.items.length === 1){return true} else {return false}
	};
	
	return action;
}();
_;