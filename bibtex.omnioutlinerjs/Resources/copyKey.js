// This action copies the entry key(s) for the selected row(s) into ~\cite{key1, key2, key3, ...}.
var _ = function() {
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		
		const editor = document.editors[0]
		
		if (!document.outline.columns.byTitle('EntryKey')) {
			throw new Error('No column: EntryKey.')
		} else if (document.outline.columns.byTitle('EntryKey').type !== Column.Type.Text) {
			throw new Error('No text column: EntryKey.')
		}
		
		// All text columns titled 'EntryKey'
		var keyColumns = document.outline.columns.filter(function(column) {
			if (column.type === Column.Type.Text && column.title === 'EntryKey') {return column}
		})
		// Take the first one as the source column
		var keyColumn = keyColumns[0]
	

		var str = '~\\cite\{'
		var keys = selection.items.map(item => {
			var entryKeyText = item.valueForColumn(keyColumn)
			if (entryKeyText && entryKeyText.string.trim().length !== 0) {
				return entryKeyText.string.trim()
			}
			return null
		})
		
		keys = keys.filter(key => {
			return key
		})
		
		str += keys.join(', ')
		str += '\}'

		var alertTitle = "Cite Key"
		var alertMessage = str
		
		var alert = new Alert(alertTitle, alertMessage)
		alert.addOption("Cancel")
		alert.addOption("Copy")
		var alertPromise = alert.show()
		
		alertPromise.then(buttonIndex => {
			if (buttonIndex === 1) {
				console.log("Continue script")
				Pasteboard.general.string = str
			} else {
				throw new Error('script cancelled')
			}
		})
		
		
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.items.length > 0) {return true} else {return false}
	};
	
	return action;
}();
_;