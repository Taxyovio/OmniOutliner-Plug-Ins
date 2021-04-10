// This action hides all columns except Topic and Notes.
(() => {
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles
		
		// This needs to be ran twice, otherwise the UI doesn't reflect the changes. 
		var counter = 0
		Timer.repeating(0.1, function(timer) {
			if (counter === 2) {
				timer.cancel()
			} else {
				counter += 1
				console.log(counter)
				hideAllColumns()
			}
			
		})
		
	});

	action.validate = function(selection, sender) {
		// selection options: columns, document, editor, items, nodes, styles
		if(document) {return true} else {return false}
	};
	
	return action;
})();

function hideAllColumns() {
	var hidableColumns = columns.filter(col => {
		return col !== outlineColumn && col !== noteColumn
	})
	hidableColumns.forEach(col => {
		document.editors[0].setVisibilityOfColumn(col, false)
	})
}