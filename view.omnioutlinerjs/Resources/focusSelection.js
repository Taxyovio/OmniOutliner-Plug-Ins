// This action focuses the editor on the selected items.
(() => {
	var action = new PlugIn.Action(function (selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles
		var selectedItems = selection.items;
		var editor = selection.editor;
		var nodes = editor.nodesForObjects(selection.items);
		editor.focusedItems = selectedItems;
	});

	action.validate = function (selection, sender) {
		// selection options: columns, document, editor, items, nodes, styles
		if (selection.items.length > 0) {
			return true;
		} else {
			return false;
		}
	};

	return action;
})();
