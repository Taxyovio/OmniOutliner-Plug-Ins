// This action computes the entered formula with eval() from values of selected columns, and outputs the results into the selected target column.
var _ = (function () {
	var action = new PlugIn.Action(function (selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles

		var items = selection.items;
		var itemsLength = items.length;

		// List all visible text columns for insertion
		editor = document.editors[0];
		filteredColumns = columns.filter(function (column) {
			if (editor.visibilityOfColumn(column)) {
				if (
					column.type === Column.Type.Number ||
					column.type === Column.Type.Duration ||
					column.type === Column.Type.Date ||
					column.type === Column.Type.Checkbox
				) {
					return column;
				}
			}
		});

		if (filteredColumns.length === 0) {
			throw new Error(
				"This document has no visible columns of valid types."
			);
		}

		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form();

		// CREATE TEXT FIELD

		if (filteredColumns.indexOf(document.outline.outlineColumn) !== -1) {
			var defaultTarget = document.outline.outlineColumn;
		} else {
			var defaultTarget = filteredColumns[0];
		}

		// Output column field
		var targetField = function (columns, col) {
			return new Form.Field.Option(
				"targetInput",
				"Output",
				columns,
				columns.map(function (column) {
					return column.title;
				}),
				col
			);
		};

		// Override or append to existing contents
		var overrideToggle = new Form.Field.Checkbox(
			"overrideInput",
			"Override",
			true
		);

		// Formula field function to update during validation
		var formulaField = function (str) {
			return new Form.Field.String("formulaInput", "Formula", str);
		};

		// Define a dynamic field to add and remove during validation
		var columnField = function (columns, index, col) {
			return new Form.Field.Option(
				"columnInput" + index,
				"Column " + index,
				columns,
				columns.map(function (column) {
					return column.title;
				}),
				col
			);
		};

		// Determine the column options for the input comlumn fields
		var inputColumnOptions = function (targetColumn, selectedInputColumns) {
			var columns = filteredColumns.filter(function (column) {
				if (!selectedInputColumns.includes(column)) {
					return column;
				}
			});

			var columns = columns.filter(function (column) {
				if (
					targetColumn.type === Column.Type.Date ||
					targetColumn.type === Column.Type.Duration
				) {
					// Allow only date and duration inputs
					if (
						column.type === Column.Type.Duration ||
						column.type === Column.Type.Date
					) {
						return column;
					}
				} else if (targetColumn.type === Column.Type.Number) {
					// Allow only number inputs
					if (column.type === Column.Type.Number) {
						return column;
					}
				} else if (targetColumn.type === Column.Type.Checkbox) {
					// Allow only number inputs
					if (column.type === Column.Type.Checkbox) {
						return column;
					}
				}
			});

			return columns;
		};

		// ADD THE FIELDS TO THE FORM
		inputForm.addField(targetField(filteredColumns, null));
		var targetIsFixed = false;

		inputForm.addField(overrideToggle);
		inputForm.addField(formulaField(""));

		var selectedInputColumns = []; // No columns are selected now.

		var inputLength = 0; // Keep track of the number of input column fields

		// PRESENT THE FORM TO THE USER
		formPrompt = "Compute Formula to Column";
		formPromise = inputForm.show(formPrompt, "Continue");

		// VALIDATE THE USER INPUT
		inputForm.validate = function (formObject) {
			var keys = formObject.fields.map((field) => field.key);

			var selectedTargetColumn = formObject.values["targetInput"];

			var formulaFieldIndex = keys.indexOf("formulaInput");
			var formulaInput = formObject.values["formulaInput"];

			// Add first input column field and fix target
			if (selectedTargetColumn && !targetIsFixed) {
				formObject.addField(
					columnField(
						inputColumnOptions(
							selectedTargetColumn,
							selectedInputColumns
						),
						0,
						null
					)
				);

				inputLength = inputLength + 1;

				var index = keys.indexOf("targetInput");
				formObject.removeField(formObject.fields[index]);
				formObject.addField(
					targetField([selectedTargetColumn], selectedTargetColumn),
					index
				);
				targetIsFixed = true;
			}

			if (
				keys.indexOf("columnInput" + (inputLength - 1)) &&
				formObject.values["columnInput" + (inputLength - 1)]
			) {
				var column =
					formObject.values["columnInput" + (inputLength - 1)];
				var index = keys.indexOf("columnInput" + (inputLength - 1));

				// Fix last column option
				if (selectedInputColumns.length === inputLength - 1) {
					formObject.removeField(formObject.fields[index]);
					formObject.addField(
						columnField([column], inputLength - 1, column),
						index
					);

					// Add this variable name to formula field
					let regex = new RegExp("C" + (inputLength - 1), "gi");
					if (!formulaInput.match(regex)) {
						if (formulaInput) {
							formulaInput =
								formulaInput + " C" + (inputLength - 1);
						} else {
							formulaInput =
								formulaInput + "C" + (inputLength - 1);
						}
						formObject.removeField(
							formObject.fields[formulaFieldIndex]
						);
						formObject.addField(
							formulaField(formulaInput),
							formulaFieldIndex
						);
					}
				}
				if (!selectedInputColumns.includes(column)) {
					selectedInputColumns.push(column);
				}

				if (
					inputColumnOptions(
						selectedTargetColumn,
						selectedInputColumns
					).length !== 0 &&
					keys.indexOf("columnInput" + inputLength) === -1
				) {
					// Add next column option
					formObject.addField(
						columnField(
							inputColumnOptions(
								selectedTargetColumn,
								selectedInputColumns
							),
							inputLength,
							null
						)
					);

					inputLength = inputLength + 1;
				}

				console.log(
					selectedInputColumns.length +
						" out of " +
						inputLength +
						" input column fields are selected on the form."
				);
			}

			// Two dates are only allowed to be substracted
			if (
				selectedInputColumns.length === 2 &&
				selectedInputColumns[0].type === Column.Type.Date &&
				selectedInputColumns[1].type === Column.Type.Date
			) {
				if (formulaInput.match(/(\bC1\b|\bC0\b)/gi).length % 2 !== 0) {
					throw new Error("Dates C0 and C1 must appear in pairs.");
				}
			}

			// Valid date formula with fake data
			if (formObject.values["targetInput"]) {
				if (
					isValidFormula(
						formulaInput,
						selectedInputColumns,
						formObject.values["targetInput"]
					)
				) {
					return true;
				} else {
					throw new Error("Formula is invalid.");
				}
			} else {
				throw new Error("Select an output column.");
			}
		};

		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function (formObject) {
			var target = formObject.values["targetInput"];
			var override = formObject.values["overrideInput"];
			var formula = formObject.values["formulaInput"];
			var columns = selectedInputColumns;

			items.forEach((item, index) => {
				console.log("computing for row ", index);
				var ogValue = item.valueForColumn(target);
				var result = compute(formula, item, columns, target);

				if (override) {
					item.setValueForColumn(result, target);
				} else if (!ogValue) {
					item.setValueForColumn(result, target);
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
		editor = document.editors[0];
		filteredColumns = columns.filter(function (column) {
			if (editor.visibilityOfColumn(column)) {
				if (
					column.type === Column.Type.Number ||
					column.type === Column.Type.Duration ||
					column.type === Column.Type.Date ||
					column.type === Column.Type.Checkbox
				) {
					return column;
				}
			}
		});

		if (selection.items.length > 0 && filteredColumns.length !== 0) {
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

function compute(formula, row, columns, target) {
	var result = 0;
	var c = columns.map((col) => {
		var value = row.valueForColumn(col);

		if (value) {
			if (value.constructor.name === "Decimal") {
				// Converts the custom Decimal objects to the native Number objects
				value = Number(value.toString());
			} else if (value.constructor.name === "Sate") {
				// Converts the checkbox State objects to the Boolean objects
				if (value === Sate.Checked) {
					value = true;
				} else {
					value = false;
				}
			} else if (value.constructor.name === "Date") {
				// Use hours instead of milliseconds in conputing dates
				value = Number(value) / 3600000;
			}
		} else {
			// Null, undefined, or 0 values are redefined.
			if (col.type === Column.Type.Checkbox) {
				value = false;
			} else {
				value = 0;
			}
		}

		return value;
	});

	formula = formula.replace(/\bC\d+\b/gi, (x) => {
		x = x.replace(/C/gi, "c[");
		return x + "]";
	});

	// Null result if formula doesn't pass
	try {
		result = eval(formula);
	} catch (err) {
		console.log(err);
		result = null;
	}

	if (target.type === Column.Type.Date) {
		if ((result && Number(result)) || result === 0) {
			result = new Date(Number(eval(formula) * 3600000));
		} else {
			result = null;
		}
	} else if (
		target.type === Column.Type.Duration ||
		target.type === Column.Type.Number
	) {
		if ((result && Number(result)) || result === 0) {
			result = Number(result);
		} else {
			result = null;
		}
	} else if (target.type === Column.Type.Checkbox) {
		if (result && Number(result)) {
			result = Boolean(result);
		} else {
			result = false;
		}

		if (result) {
			result = State.Checked;
		} else {
			result = State.Unchecked;
		}
	} else if (!result && result !== 0 && result !== false) {
		result = null;
	}

	// Final check on correct result types
	if (result) {
		if (
			(target.type === Column.Type.Number ||
				target.type === Column.Type.Duration) &&
			typeof result !== "number"
		) {
			result = null;
		} else if (
			target.type === Column.Type.Checkbox &&
			result.constructor.name !== "Sate"
		) {
			result = State.Unchecked;
		} else if (target.type === Column.Type.Date && !isValidDate(result)) {
			result = null;
		}
	}

	console.log(
		"formula: ",
		formula,
		"\n",
		"variables: ",
		c,
		"\n",
		"result: ",
		result
	);
	return result;
}

function isValidFormula(formula, columns, target) {
	var result = 0;
	var c = columns.map((col) => {
		if (col.type === Column.Type.Checkbox) {
			return false;
		} else {
			return 0;
		}
	});

	formula = formula.replace(/\bC\d+\b/gi, (x) => {
		x = x.replace(/C/gi, "c[");
		return x + "]";
	});

	if (formula === "") {
		return true;
	}

	try {
		result = eval(formula);
	} catch (err) {
		console.log("Invalid Formula: Formula doesn't pass eval().");
		return false;
	}

	if (result) {
		if (
			typeof result === "number" ||
			!isNaN(Number(result)) ||
			typeof result === "boolean" ||
			isValidDate(result)
		) {
			console.log(
				"Valid Formula: Result is ",
				result,
				" of type",
				typeof result,
				"."
			);
			return true;
		} else {
			console.log(
				"Invalid Formula: Result is ",
				result,
				" of type",
				typeof result,
				"."
			);
			return false;
		}
	} else if (result === 0 || result === null) {
		console.log(
			"Valid Formula: Result is ",
			result,
			" of type",
			typeof result,
			"."
		);
		return true;
	} else {
		console.log("Invalid Formula: Result is of type", typeof result, ".");
		return false;
	}
}
