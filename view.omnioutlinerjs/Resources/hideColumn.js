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
		if (typeof columns !== 'undefined') {
			var visibleColumns = columns.filter(col => {
				var visible = document.editors[0].visibilityOfColumn(col)
				if (visible && col !== outlineColumn) {
					return col
				}
			})
			if (visibleColumns.length > 0) {return true} else {return false}
		} else {
			return false
		}
	};
	
	return action;
})();

function hideAllColumns() {
	var hidableColumns = columns.filter(col => {
		return col !== outlineColumn
	})
	hidableColumns.forEach(col => {
		document.editors[0].setVisibilityOfColumn(col, false)
	})
}