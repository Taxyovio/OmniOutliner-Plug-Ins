// This action pastes the array of objects from Clipboard into the selected column of the selected rows.
// The clipboard item list and row list are truncated to the length of the shorter one.
var _ = (function () {
	var action = new PlugIn.Action(function (selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		var array = Pasteboard.general.items;
		var arrayLength = array.length;

		var items = selection.items;
		var itemsLength = items.length;

		// The number of items get pasted is limited by both array length and selection length
		if (arrayLength > itemsLength) {
			var length = itemsLength;
			array = array.slice(0, length);
		} else {
			var length = arrayLength;
			items = items.slice(0, length);
		}

		// List all visible text columns for insertion
		editor = document.editors[0];
		filteredColumns = columns.filter(function (column) {
			if (editor.visibilityOfColumn(column)) {
				return column;
			}
		});

		if (filteredColumns.length === 0) {
			throw new Error("This document has no visible columns.");
		}

		filteredColumnTitles = filteredColumns.map(function (column) {
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

		if (filteredColumns.indexOf(document.outline.outlineColumn) !== -1) {
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

		// Override or append to existing contents
		var overrideToggle = new Form.Field.Checkbox(
			"overrideInput",
			"Override",
			true
		);

		// ADD THE FIELDS TO THE FORM
		inputForm.addField(columnField);
		inputForm.addField(overrideToggle);
		// PRESENT THE FORM TO THE USER
		formPrompt = "Paste Array to Column";
		formPromise = inputForm.show(formPrompt, "Continue");

		// VALIDATE THE USER INPUT
		inputForm.validate = function (formObject) {
			return null;
		};

		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function (formObject) {
			var column = formObject.values["columnInput"];
			var override = formObject.values["overrideInput"];

			array.forEach((obj, index) => {
				var item = items[index];

				var ogValue = item.valueForColumn(column);

				if (ogValue && column.type === Column.Type.Text) {
					var style = ogValue.style;
				} else {
					var style = item.style;
				}

				var newText = new Text("", style);
				var newTextIsEmpty = true;
				// Filter out proprietary Pasteboard.Item types
				var types = obj.types.filter((type) => {
					return (
						type.identifier !==
							"com.omnigroup.omnioutliner.pboard.xmloutline.items" &&
						type.identifier !==
							"com.omnigroup.omnioutliner.pboard.items-v3" &&
						type.identifier !== "com.omnigroup.omnistyle.pboard.xml"
					);
				});

				// Construct new text obj
				if (types.length !== 0) {
					console.log(
						"clipboard object ",
						index + 1,
						"/",
						length,
						"is of type",
						types
					);

					var textTypes = types.filter((type) => {
						return (
							type.conformsTo(TypeIdentifier.plainText) ||
							type.identifier === "public.utf8-plain-text" ||
							type.identifier === "public.rtf" ||
							type === TypeIdentifier.URL
						);
					});

					if (textTypes.length !== 0) {
						var str = "";
						if (
							textTypes.some((type) =>
								type.conformsTo(TypeIdentifier.plainText)
							)
						) {
							str = obj.stringForType(
								types.find((type) =>
									type.conformsTo(TypeIdentifier.plainText)
								)
							);
						} else if (
							obj.types.some(
								(type) =>
									type.identifier === "public.utf8-plain-text"
							)
						) {
							str = obj.stringForType(
								types.find(
									(type) =>
										type.identifier ===
										"public.utf8-plain-text"
								)
							);
						} else if (
							obj.types.some(
								(type) => type === TypeIdentifier.URL
							)
						) {
							str = obj.stringForType(
								types.find(
									(type) => type === TypeIdentifier.URL
								)
							);
						}
						str = str.trim();
						if (str) {
							var text = new Text(str, style);
							newText.append(text);
							newTextIsEmpty = false;
						}
					}

					var nonTextTypes = types.filter((type) => {
						return (
							!type.conformsTo(TypeIdentifier.plainText) &&
							type.identifier !== "public.utf8-plain-text" &&
							type.identifier !== "public.rtf" &&
							type.identifier !== "public.url"
						);
					});

					if (nonTextTypes.length !== 0) {
						nonTextTypes.forEach((type, i) => {
							var fileExtension = type.pathExtensions[0];
							if (fileExtension) {
								var fileName =
									fileExtension.toUpperCase() +
									" " +
									index.toString() +
									i.toString() +
									"." +
									fileExtension;
							} else {
								var fileName = index.toString();
							}
							var newWrapper = FileWrapper.withContents(
								fileName,
								obj.dataForType(type)
							);
							var newFile = Text.makeFileAttachment(
								newWrapper,
								style
							);
							newText.append(newFile);
							newTextIsEmpty = false;
						});
					}
				} else {
					console.log(
						"clipboard object ",
						index + 1,
						"/",
						length,
						"has no valid type"
					);
				}

				// Modify items
				if (column.type === Column.Type.Text) {
					if (override) {
						item.setValueForColumn(newText, column);
					} else {
						if (ogValue) {
							if (
								!ogValue.string.slice(-1).match(/\s/) &&
								!newTextIsEmpty
							) {
								var space = new Text(" ", style);
								ogValue.append(space);
							}
							ogValue.append(newText);
						} else {
							item.setValueForColumn(newText, column);
						}
					}
				} else if (column.type === Column.Type.Date) {
					var newDate = new Date(newText.string);
					if (isValidDate(newDate)) {
						if (override) {
							item.setValueForColumn(newDate, column);
						} else if (!ogValue) {
							item.setValueForColumn(newDate, column);
						}
					} else if (override) {
						item.setValueForColumn(null, column);
					}
				} else if (
					column.type === Column.Type.Number ||
					column.type === Column.Type.Duration
				) {
					var newNumber = Number(newText.string);
					if (!isNaN(newNumber)) {
						if (override) {
							item.setValueForColumn(newNumber, column);
						} else if (!ogValue) {
							item.setValueForColumn(newNumber, column);
						}
					} else if (override) {
						item.setValueForColumn(null, column);
					}
				} else if (column.type === Column.Type.Enumeration) {
					var enumeration = column.enumeration;

					if (
						!enumeration.memberNamed(newText.string) &&
						newText.string &&
						override
					) {
						enumeration.add(newText.string);
					}
					item.setValueForColumn(
						enumeration.memberNamed(newText.string),
						column
					);
				} else if (column.type === Column.Type.Checkbox) {
					if (override) {
						if (ciEquals(newText.string, "Checked")) {
							item.setValueForColumn(State.Checked, column);
						} else if (ciEquals(newText.string, "Unchecked")) {
							item.setValueForColumn(State.Unchecked, column);
						}
					} else {
						// If no overriding, only checking unchecked boxes are allowed.
						if (ciEquals(newText.string, "Checked")) {
							item.setValueForColumn(State.Checked, column);
						}
					}
				}
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
		if (selection.items.length > 0) {
			return true;
		} else {
			return false;
		}
	};

	return action;
})();
_;

// https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
function isValidDate(d) {
	return d instanceof Date && !isNaN(d);
}

// https://stackoverflow.com/questions/2140627/how-to-do-case-insensitive-string-comparison
function ciEquals(a, b) {
	return typeof a === "string" && typeof b === "string"
		? a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0
		: a === b;
}
