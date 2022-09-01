// This action presents the Topic texts from selected rows in Share Sheet.
var _ = (function () {
	var action = new PlugIn.Action(function (selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles

		var textColumns = columns.filter(function (column) {
			if (column.type === Column.Type.Text) {
				return column;
			}
		});

		if (textColumns.length === 0) {
			throw new Error("This document has no text columns.");
		}
		var wrappers = [];
		selection.items.forEach((item) => {
			textColumns.forEach((column) => {
				var textObj = item.valueForColumn(column);

				if (textObj) {
					// Get attachments
					var attachments = textObj.attachments;

					if (attachments) {
						attachments.forEach((att) => {
							var wrapper = att.fileWrapper;
							// We only want to rename files, not directories nor symbolic links
							if (wrapper.type === FileWrapper.Type.File) {
								wrappers.push(wrapper);
							}
						});
					}
				}
			});
		});

		if (wrappers.length > 0) {
			sharePanel = new SharePanel(wrappers);
			sharePanel.show();
		} else {
			var alertTitle = "Error";
			var alertMessage = "No attachment found.";
			var alert = new Alert(alertTitle, alertMessage);
			var alertPromise = alert.show();
		}
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
