// This action sets the style of selected rows to the base style of the document.
var _ = (function () {
	var action = new PlugIn.Action(function (selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		var textColumns = columns.filter((col) => {
			return col.type === Column.Type.Text;
		});

		selection.items.forEach(function (item) {
			item.style.clear();
			if (textColumns.length !== 0) {
				textColumns.forEach((col) => {
					try {
						item.valueForColumn(col).style.clear();
					} catch (error) {}
				});
			}
		});
	});

	action.validate = function (selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if (selection.items.length > 0) {
			return true;
		} else {
			return false;
		}
	};

	return action;
})();
_;
