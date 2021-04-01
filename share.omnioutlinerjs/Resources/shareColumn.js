// This action presents the Topic texts from selected rows in Share Sheet.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		var columnTitles = columns.map(function(column){
			if (column.title !== ''){
				return column.title
			} else if (column === document.outline.noteColumn){
			// The note column is the only text column with empty title
				return 'Notes'
			} else if (column === document.outline.statusColumn){
			// The note column is the only text column with empty title
				return 'Status'
			}
		})
		
		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form()
		
		// CREATE TEXT FIELD
		var columnField = new Form.Field.Option(
			"columnInput",
			"Column",
			columns,
			columnTitles,
			document.outline.outlineColumn
		)
		
		// ADD THE FIELDS TO THE FORM
		inputForm.addField(columnField)
		// PRESENT THE FORM TO THE USER
		formPrompt = "Select Column"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject){
			return null
		}
		
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject){
			var col = formObject.values["columnInput"]
			var strings = selection.items.map(item => {
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
						return value.string.trim() + '\n'
					} else {
						return '\n\n'
					}
					
				} else if (col.type === Column.Type.Checkbox) {
					// Value is a State object
					if (value === State.Checked) {
						return 'Checked' + '\n'
					} else if (value === State.Unchecked) {
						return 'Unchecked' + '\n'
					} else if (value === State.Mixed) {
						return 'Mixed' + '\n'
					} else {
						return '\n\n'
					}
					
				} else if (col.type === Column.Type.Date) {
					// Value is a Date object
					if (value) {
						return value.toString() + '\n'
					} else {
						return '\n\n'
					}
					
				} else if (col.type === Column.Type.Duration || col.type === Column.Type.Number) {
					// Value is a Decimal object
					if (value) {
						return value.toString() + '\n'
					} else {
						return '\n\n'
					}
					
				} else if (col.type === Column.Type.Enumeration) {
					// Value is an Enumaration object
					if (value) {
						return value.name.trim() + '\n'
					} else {
						return '\n\n'
					}
					
				}
				
			})
			
			sharePanel = new SharePanel(strings)		
			sharePanel.show()
			
		})
		
		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function(err){
			console.log("form cancelled", err.message)
		})
		
		
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.items.length > 0){return true} else {return false}
	};
	
	return action;
}();
_;