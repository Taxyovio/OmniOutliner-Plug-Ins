// This action requires using the 'Add to Anki' otemplate and appropriate configuration for card types in Anki. Three custom card types are defined with custom fields: {Basic: Front, Back, Reference, Reverse, Extra}, {Cloze: Text, Reference, Extra}, {Input: Front, Back, Reference, Extra}.

// This action creates a new note in Anki Mobile from the selected row using URL schemes. 
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		
		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form()
		
		// CREATE TEXT FIELD
		var profileField = new Form.Field.String(
			"profileInput",
			"Profile",
			null
		)
		
		// ADD THE FIELDS TO THE FORM
		inputForm.addField(profileField)
		
		// PRESENT THE FORM TO THE USER
		formPrompt = "Enter the Profile:"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject){
		
			// selection options: columns, document, editor, items, nodes, styles
			selection.items.forEach(function(item){
				try {front = item.topic} catch(err){front = ''}
				try {back = item.valueForColumn(columns.byTitle('Back')).string} catch(err){back=''}
				try {deck = item.valueForColumn(columns.byTitle('Deck')).string} catch(err){deck='Default'}
				try {type = item.valueForColumn(columns.byTitle('Type')).name} catch(err){type='Basic'}
				try {tags = item.valueForColumn(columns.byTitle('Tags')).string} catch(err){tags=''}
				try {reference = item.valueForColumn(columns.byTitle('Reference')).string} catch(err){reference=''}
				try {extra = item.valueForColumn(columns.byTitle('Extra')).string} catch(err){extra=''}
				try {reverse = item.valueForColumn(columns.byTitle('Reverse')).name} catch(err){reverse=''}
				if(front != ''){
					front = encodeURIComponent(front)
					back = encodeURIComponent(back)
					deck = encodeURIComponent(deck)
					type = encodeURIComponent(type)
					tags = encodeURIComponent(tags)
					if (type === 'Basic' || type === ''){
						urlStr = "anki://x-callback-url/addnote?profile=" + formObject.values["profileInput"] + "&type=" + type + "&deck=" + deck + "&fldFront=" + front + "&fldBack=" + back + "&tags=" + tags
						if (reverse === 'Yes') {
							urlStr = urlStr + "&fldReverse=Y"
						}
					} else if (type === 'Cloze'){
						urlStr = "anki://x-callback-url/addnote?profile=" + formObject.values["profileInput"] + "&type=" + type + "&deck=" + deck + "&fldText=" + front + "&tags=" + tags
					} else if (type === 'Input'){
						urlStr = "anki://x-callback-url/addnote?profile=" + formObject.values["profileInput"] + "&type=" + type + "&deck=" + deck + "&fldFront=" + front + "&fldBack=" + back + "&tags=" + tags
					}
					
					if(reference !== ''){urlStr = urlStr + "&fldReference=" + encodeURIComponent(reference)}
					if(extra !== ''){urlStr = urlStr + "&fldExtra=" + encodeURIComponent(extra)}
					URL.fromString(urlStr).call(function(result){})
					
				}
			})
		})
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.items.length == 1){return true} else {return false}
	};
	
	return action;
}();
_;