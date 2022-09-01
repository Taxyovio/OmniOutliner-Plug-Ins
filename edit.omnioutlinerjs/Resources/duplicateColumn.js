// This action duplicates the chosen column and contents of all rows into the new column.
var _ = (function () {
	var action = new PlugIn.Action(function (selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		var selectedItems = selection.items;

		// List all visible columns
		var editor = document.editors[0];
		var tree = document.outline;

		var filteredColumns = columns.filter(function (column) {
			if (editor.visibilityOfColumn(column)) {
				return column;
			}
		});

		if (filteredColumns.length === 0) {
			throw new Error("This document has no visible columns.");
		}

		var filteredColumnTitles = filteredColumns.map(function (column) {
			if (column.title !== "") {
				return column.title;
			} else if (column === document.outline.noteColumn) {
				// The note column has empty title for unknown reason
				return "Notes";
			}
		});

		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form();

		// CREATE TEXT FIELD

		if (filteredColumns.includes(document.outline.outlineColumn)) {
			var defaultColumn = document.outline.outlineColumn;
		} else {
			var defaultColumn = document.outline.noteColumn;
		}

		var columnField = new Form.Field.Option(
			"columnInput",
			"Column",
			filteredColumns,
			filteredColumnTitles,
			defaultColumn
		);

		// ADD THE FIELDS TO THE FORM
		inputForm.addField(columnField);
		// PRESENT THE FORM TO THE USER
		formPrompt = "Select Column";
		formPromise = inputForm.show(formPrompt, "Continue");

		// VALIDATE THE USER INPUT
		inputForm.validate = function (formObject) {
			return null;
		};

		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function (formObject) {
			var selectedColumn = formObject.values["columnInput"];
			console.log("hi");
			var newColumn = tree.addColumn(
				selectedColumn.type,
				editor.afterColumn(selectedColumn),
				function (column) {
					column.title = selectedColumn.title + " Copy";
					try {
						if (selectedColumn.enumeration !== null) {
							column.enumeration = selectedColumn.enumeration;
						}
					} catch (err) {
						console.log(err.message);
					}
					try {
						if (selectedColumn.formatter !== null) {
							column.formatter = selectedColumn.formatter;
						}
					} catch (err) {
						console.log(err.message);
					}
					try {
						if (selectedColumn.style !== null) {
							column.setStyle(selectedColumn.style);
						}
					} catch (err) {
						console.log(err.message);
					}
					try {
						if (selectedColumn.textAlignment !== null) {
							column.textAlignment = selectedColumn.textAlignment;
						}
					} catch (err) {
						console.log(err.message);
					}
				}
			);

			rootItem.descendants.forEach((item) => {
				item.setValueForColumn(
					item.valueForColumn(selectedColumn),
					newColumn
				);
			});
		});

		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function (err) {
			console.log("form cancelled", err.message);
		});
	});

	action.validate = function (selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if (document !== null) {
			return true;
		} else {
			return false;
		}
	};

	return action;
})();
_;
