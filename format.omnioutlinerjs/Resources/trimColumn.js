// This action trimes all column titles except Status and Notes.
(() => {
	var action = new PlugIn.Action(function(selection, sender){
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles
		var trimmableColumns = columns.filter(col => {
			return col !== noteColumn && col !== statusColumn
		})
		var count = 0
		trimmableColumns.forEach(col => {
			if (col.title !== col.title.trim()){
				count += 1
				col.title = col.title.trim()
			}
		})
		var alertTitle = "Confirmation"
		if (count === 0) {
			var alertMessage = 'No column title has been trimmed.'
		} else if (count === 1) {
			var alertMessage = '1 column title has been trimmed.'
		} else {
			var alertMessage = count + ' column titles have been trimmed.'
		}
		
		var alert = new Alert(alertTitle, alertMessage)
		alert.show()
	});

	action.validate = function(selection, sender) {
		// selection options: columns, document, editor, items, nodes, styles
		if(document) {return true} else {return false}
	};
	
	return action;
})();