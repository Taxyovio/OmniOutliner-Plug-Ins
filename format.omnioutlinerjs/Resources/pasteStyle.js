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
			var defaultDescendants = false
			var descendantsField = function(bool) {
				return new Form.Field.Checkbox(
					'descendantsInput',
					'Descendants',
					bool
				)
			}
			inputForm.addField(descendantsField(defaultDescendants))
			
			
			var defaultChildren = false
			var childrenField = function(bool) {
				return new Form.Field.Checkbox(
					'childrenInput',
					'Children',
					bool
				)
			}
			inputForm.addField(childrenField(defaultChildren))
			
			
			var defaultLeaves = false
			var leavesField = function(bool) {
				return new Form.Field.Checkbox(
					'leavesInput',
					'Leaves',
					bool
				)
			}
			inputForm.addField(leavesField(defaultLeaves))
		}
		
		
		if (selectedItem.level > 1) {
			var defaultAncestors = false
			var ancestorsField = function(bool) {
				return new Form.Field.Checkbox(
					'ancestorsInput',
					'Ancestors',
					bool
				)
			}
			inputForm.addField(ancestorsField(defaultAncestors))
			
			var defaultParent = false
			var parentField = function(bool) {
				return new Form.Field.Checkbox(
					'parentInput',
					'Parent',
					bool
				)
			}
			inputForm.addField(parentField(defaultParent))
		}
		
		
		if (selectedItem.parent.children.length > 1) {
			
			// This means all following siblings and their descendants, basically everything below.
			var defaultFollowingCollateralDescendants = false
			var followingCollateralDescendantsField = function(bool) {
				return new Form.Field.Checkbox(
					'followingCollateralDescendantsInput',
					'Following Collateral Descendants',
					bool
				)
			}
			inputForm.addField(followingCollateralDescendantsField(defaultFollowingCollateralDescendants))
			
			
			var defaultFollowingSiblings = false
			var followingSiblingsField = function(bool) {
				return new Form.Field.Checkbox(
					'followingSiblingsInput',
					'Following Siblings',
					bool
				)
			}
			inputForm.addField(followingSiblingsField(defaultFollowingSiblings))
			
			
			// Similarly this is everything above.
			var defaultPrecedingCollateralDescendants = false
			var precedingCollateralDescendantsField = function(bool) {
				return new Form.Field.Checkbox(
					'precedingCollateralDescendantsInput',
					'Preceding Collateral Descendants',
					bool
				)
			}
			inputForm.addField(precedingCollateralDescendantsField(defaultPrecedingCollateralDescendants))
			
			
			var defaultPrecedingSiblings = false
			var precedingSiblingsField = function(bool) {
				return new Form.Field.Checkbox(
					'precedingSiblingsInput',
					'Preceding Siblings',
					bool
				)
			}
			inputForm.addField(precedingSiblingsField(defaultPrecedingSiblings))
		}
		
		// Declare field positions
		var descendantsInputIndex
		var childrenInputIndex
		var leavesInputIndex
		var ancestorsInputIndex
		var parentInputIndex
		var followingCollateralDescendantsInputIndex
		var precedingCollateralDescendantsInputIndex
		var followingSiblingsInputIndex
		var precedingSiblingsInputIndex
		
		formPrompt = "Select Paste Target"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject){
			var keys = formObject.fields.map(field => field.key)
			
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
				
				if (keys.indexOf('precedingSiblingsInput') !== -1) {
					defaultPrecedingSiblings = precedingSiblingsChosen
					precedingSiblingsInputIndex = keys.indexOf('precedingSiblingsInput')
					formObject.removeField(formObject.fields[precedingSiblingsInputIndex])
				}
				
				if (keys.indexOf('followingSiblingsInput') !== -1) {
					defaultFollowingSiblings = followingSiblingsChosen
					followingSiblingsInputIndex = keys.indexOf('followingSiblingsInput')
					formObject.removeField(formObject.fields[followingSiblingsInputIndex])
				}
				
				if (keys.indexOf('precedingCollateralDescendantsInput') !== -1) {
					defaultPrecedingCollateralDescendants = precedingCollateralDescendantsChosen
					precedingCollateralDescendantsInputIndex = keys.indexOf('precedingCollateralDescendantsInput')
					formObject.removeField(formObject.fields[precedingCollateralDescendantsInputIndex])
				}
				
				if (keys.indexOf('followingCollateralDescendantsInput') !== -1) {
					defaultFollowingCollateralDescendants = followingCollateralDescendantsChosen
					followingCollateralDescendantsInputIndex = keys.indexOf('followingCollateralDescendantsInput')
					formObject.removeField(formObject.fields[followingCollateralDescendantsInputIndex])
				}
				
				if (keys.indexOf('parentInput') !== -1) {
					defaultParent = parentChosen
					parentInputIndex = keys.indexOf('parentInput')
					formObject.removeField(formObject.fields[parentInputIndex])
				}
				
				if (keys.indexOf('ancestorsInput') !== -1) {
					defaultAncestors = ancestorsChosen
					ancestorsInputIndex = keys.indexOf('ancestorsInput')
					formObject.removeField(formObject.fields[ancestorsInputIndex])
				}
				
				if (keys.indexOf('leavesInput') !== -1) {
					defaultLeaves = leavesChosen
					leavesInputIndex = keys.indexOf('leavesInput')
					formObject.removeField(formObject.fields[leavesInputIndex])
				}
				
				if (keys.indexOf('childrenInput') !== -1) {
					defaultChildren = childrenChosen
					childrenInputIndex = keys.indexOf('childrenInput')
					formObject.removeField(formObject.fields[childrenInputIndex])
				}
				
				if (keys.indexOf('descendantsInput') !== -1) {
					defaultDescendants = descendantsChosen
					descendantsInputIndex = keys.indexOf('descendantsInput')
					formObject.removeField(formObject.fields[descendantsInputIndex])
				}
				
			} else {
				
				if (selectedItem.hasChildren) {
				
					if (keys.indexOf('descendantsInput') === -1) {
						formObject.addField(descendantsField(defaultDescendants), descendantsInputIndex)
					}
					
				}
				
				if (selectedItem.level > 1) {
				
					if (keys.indexOf('ancestorsInput') === -1) {
						formObject.addField(ancestorsField(defaultAncestors), ancestorsInputIndex)
					}
					
				}
				
				if (selectedItem.parent.children.length > 1) {
				
					if (keys.indexOf('followingCollateralDescendantsInput') === -1) {
						formObject.addField(followingCollateralDescendantsField(defaultFollowingCollateralDescendants), followingCollateralDescendantsInputIndex)
					}
					
					if (keys.indexOf('precedingCollateralDescendantsInput') === -1) {
						formObject.addField(precedingCollateralDescendantsField(defaultPrecedingCollateralDescendants), precedingCollateralDescendantsInputIndex)
					}
					
				}
				
				if (descendantsChosen) {
					
					if (keys.indexOf('leavesInput') !== -1) {
						defaultLeaves = leavesChosen
						leavesInputIndex = keys.indexOf('leavesInput')
						formObject.removeField(formObject.fields[leavesInputIndex])
					}
					
					if (keys.indexOf('childrenInput') !== -1) {
						defaultChildren = childrenChosen
						childrenInputIndex = keys.indexOf('childrenInput')
						formObject.removeField(formObject.fields[childrenInputIndex])
					}
					
					
				} else if (descendantsChosen === false) {
					
					if (keys.indexOf('childrenInput') === -1) {
						formObject.addField(childrenField(defaultChildren), childrenInputIndex)
					}
					
					if (keys.indexOf('leavesInput') === -1) {
						formObject.addField(leavesField(defaultLeaves), leavesInputIndex)
					}
					
				}
				
				if (ancestorsChosen) {
					
					if (keys.indexOf('parentInput') !== -1) {
						defaultParent = parentChosen
						parentInputIndex = keys.indexOf('parentInput')
						formObject.removeField(formObject.fields[parentInputIndex])
					}
					
				} else if (ancestorsChosen === false) {
					
					if (keys.indexOf('parentInput') === -1) {
						formObject.addField(parentField(defaultParent), parentInputIndex)
					}
					
				}
				
				if (followingCollateralDescendantsChosen) {
					
					if (keys.indexOf('followingSiblingsInput') !== -1) {
						defaultFollowingSiblings = followingSiblingsChosen
						followingSiblingsInputIndex = keys.indexOf('followingSiblingsInput')
						console.log('before removing', followingSiblingsInputIndex)
						formObject.removeField(formObject.fields[followingSiblingsInputIndex])
					}
					
				} else if (followingCollateralDescendantsChosen === false) {
					
					if (keys.indexOf('followingSiblingsInput') === -1) {
						console.log('before adding', followingSiblingsInputIndex)
						formObject.addField(followingSiblingsField(defaultFollowingSiblings), followingSiblingsInputIndex)
					}
					
				}
				
				if (precedingCollateralDescendantsChosen) {
					
					if (keys.indexOf('precedingSiblingsInput') !== -1) {
						defaultPrecedingSiblings = precedingSiblingsChosen
						precedingSiblingsInputIndex = keys.indexOf('precedingSiblingsInput')
						formObject.removeField(formObject.fields[precedingSiblingsInputIndex])
					}
					
				} else if (precedingCollateralDescendantsChosen === false) {
					
					if (keys.indexOf('precedingSiblingsInput') === -1) {
						formObject.addField(precedingSiblingsField(defaultPrecedingSiblings), precedingSiblingsInputIndex)
					}
					
				}
			}
			
			
			
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