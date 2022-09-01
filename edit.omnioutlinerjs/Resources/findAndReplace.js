// This action copies the item link(s) for the selected row(s).
var _ = (function () {
	var action = new PlugIn.Action(function (selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles

		const delay = 0.8; // Delay for	temporary match highlights
		const editor = selection.editor;

		var textColumns = columns.filter(function (column) {
			if (editor.visibilityOfColumn(column)) {
				if (column.type === Column.Type.Text) {
					return column;
				}
			}
		});

		if (textColumns.length === 0) {
			throw new Error("This document has no visible text columns.");
		}

		var textColumnTitles = textColumns.map(function (column, index) {
			if (column.title !== "") {
				return column.title;
			} else if (column === document.outline.noteColumn) {
				// The note column is the only text column with empty title
				return "Notes";
			}
		});

		var optionForm = new Form();

		// Use titled of the columns instead of column objects so ut can be passed into timer
		var columnField = new Form.Field.MultipleOptions(
			"columnInput",
			"Column",
			textColumnTitles,
			textColumnTitles,
			textColumnTitles
		);

		var findField = new Form.Field.String("findInput", "Find", "");

		var caseToggle = new Form.Field.Checkbox(
			"caseToggleInput",
			"Case Sensitivity",
			false
		);

		var replaceToggle = new Form.Field.Checkbox(
			"replaceToggleInput",
			"Replace",
			false
		);

		var defaultReplace = "";
		var replaceField = function (str) {
			return new Form.Field.String("replaceInput", "", str);
		};

		var defaultReplaceAll = false;
		var replaceAllToggle = function (bool) {
			return new Form.Field.Checkbox(
				"replaceAllToggleInput",
				"Replace All",
				bool
			);
		};

		optionForm.addField(columnField);
		optionForm.addField(findField);
		optionForm.addField(caseToggle);
		optionForm.addField(replaceToggle);

		formPrompt = "Find and Replace";
		formPromise = optionForm.show(formPrompt, "Continue");

		// VALIDATE THE USER INPUT
		optionForm.validate = function (formObject) {
			var keys = formObject.fields.map((field) => field.key);
			if (formObject.values["replaceToggleInput"]) {
				if (keys.indexOf("replaceInput") === -1) {
					formObject.addField(replaceField(defaultReplace));
					console.log(defaultReplace);
				}
				if (keys.indexOf("replaceAllToggleInput") === -1) {
					formObject.addField(replaceAllToggle(defaultReplaceAll));
				}
			} else {
				if (keys.indexOf("replaceAllToggleInput") !== -1) {
					defaultReplaceAll =
						formObject.values["replaceAllToggleInput"];
					formObject.removeField(
						formObject.fields[keys.indexOf("replaceAllToggleInput")]
					);
				}
				if (keys.indexOf("replaceInput") !== -1) {
					defaultReplace = formObject.values["replaceInput"];
					console.log(defaultReplace);
					formObject.removeField(
						formObject.fields[keys.indexOf("replaceInput")]
					);
				}
			}
			if (
				formObject.values["columnInput"].length !== 0 &&
				formObject.values["findInput"]
			) {
				return null;
			} else {
				return false;
			}
		};

		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function (formObject) {
			textColumnTitles = formObject.values["columnInput"];
			var search = formObject.values["findInput"];
			var caseSensitive = formObject.values["caseToggleInput"];
			var replace = formObject.values["replaceToggleInput"];
			if (replace) {
				var replacement = formObject.values["replaceInput"];
				var replaceAll = formObject.values["replaceAllToggleInput"];
			}

			if (caseSensitive) {
				var findOptions = [Text.FindOption.RegularExpression];
			} else {
				var findOptions = [
					Text.FindOption.RegularExpression,
					Text.FindOption.CaseInsensitive,
				];
			}

			// Rename columns with the same titles temporarily to work around bugs in Timer
			if (hasDuplicates(textColumnTitles)) {
				var duplicateColumns = { columns: [], titles: [], indices: [] };
				textColumnTitles = renameStrings(textColumnTitles);
				textColumns.forEach((column, index) => {
					if (column.title !== "") {
						if (column.title !== textColumnTitles[index]) {
							duplicateColumns.columns.push(column);
							duplicateColumns.titles.push(column.title);
							// Adding the index of the column in all columns, not filtered columns
							duplicateColumns.indices.push(
								columns.indexOf(column)
							);
							column.title = textColumnTitles[index];
						}
					}
				});
				var duplicateColumnTitles = duplicateColumns.titles;
				var duplicateColumnIndices = duplicateColumns.indices;
			}

			// Get all selected items and their descendants to search through
			var items = [];
			selection.items.forEach((itm) => {
				if (items.indexOf(itm) === -1) {
					items.push(itm);
					items = items.concat(itm.descendants);
				}
			});

			// Filter columns by selected titles
			textColumns = textColumns.filter((col) => {
				if (
					textColumnTitles.indexOf(col.title) !== -1 ||
					col.title === ""
				) {
					return col;
				}
			});

			if (!replaceAll) {
				var objArr = [];
				for (var itemIndex = 0; itemIndex < items.length; itemIndex++) {
					var item = items[itemIndex];
					for (
						var colIndex = 0;
						colIndex < textColumns.length;
						colIndex++
					) {
						var col = textColumns[colIndex];
						var textObj = item.valueForColumn(col);
						if (textObj) {
							var str = textObj.string;
							var ranges = findGlobal(
								textObj,
								search,
								findOptions
							);

							if (ranges) {
								// Construct alerts
								var alertTitle = "Confirmation";

								if (ranges.length === 1) {
									var alertMessage = "1 match is found";
								} else {
									var alertMessage =
										ranges.length + " matches are found";
								}

								if (items.length > 1) {
									alertMessage +=
										" at row " +
										(itemIndex + 1) +
										" out of " +
										items.length;
									if (textColumns.length > 1) {
										if (col.title) {
											alertMessage +=
												", column: " + col.title.trim();
										} else {
											alertMessage += ", column: Notes";
										}
									}
								} else {
									if (textColumns.length > 1) {
										if (col.title) {
											alertMessage +=
												", column: " + col.title.trim();
										} else {
											alertMessage += ", column: Notes";
										}
									}
								}
								alertMessage += ".";

								var alert = new Alert(alertTitle, alertMessage);
								alert.addOption("Cancel");
								alert.addOption("Show");
								if (replace) {
									alert.addOption("Replace");
								}

								var obj = {
									alert: alert,
									item: item,
									textObj: textObj,
									ranges: ranges,
									itemIndex: itemIndex,
									columnIndex: colIndex,
								};
								objArr.push(obj);
							}
						}
					}
				}

				if (objArr.length === 0) {
					var alert = new Alert("Confirmation", "No match is found.");
					alert.show();
				}

				// Recursive function to execute promises sequentially
				const showNextAlert = (d) => {
					var obj = objArr[d];
					var item = obj.item;
					var textObj = obj.textObj;
					var ranges = obj.ranges;
					var alert = obj.alert;

					if (d < objArr.length - 1) {
						alert.addOption("Next");
					}

					alert.show().then((buttonIndex) => {
						var node = editor.nodeForObject(item);
						if (buttonIndex === 0) {
							if (duplicateColumnTitles) {
								duplicateColumnTitles.forEach((title, i) => {
									columns[duplicateColumnIndices[i]].title =
										title;
								});
							}
							console.log("cancel");
							return action;
						} else if (buttonIndex === 1) {
							console.log("show");
							node.reveal();
							editor.scrollToNode(node);

							// RGBA values for original background colours to pass into the timer
							var ogBackgrounds = ranges.map((r) => {
								var ogColour = textObj
									.styleForRange(r)
									.get(Style.Attribute.BackgroundColor);

								// Change backgroud colour to light yellow temporarily
								var lightYellow = Color.RGB(1, 1, 0.1, 0.5);
								textObj
									.styleForRange(r)
									.set(
										Style.Attribute.BackgroundColor,
										ogColour.blend(lightYellow, 0.8)
									);

								var rgb = {
									r: ogColour.red,
									g: ogColour.green,
									b: ogColour.blue,
									a: ogColour.alpha,
								};
								return rgb;
							});

							Timer.once(delay, () => {
								// Needs to re-assign every objects needed as they tend to be invalidated in timer
								var items = [];
								document.editors[0].selection.items.forEach(
									(itm) => {
										items.push(itm);
										items = items.concat(itm.descendants);
									}
								);
								var textColumns = columns.filter(function (
									column
								) {
									if (
										document.editors[0].visibilityOfColumn(
											column
										)
									) {
										if (column.type === Column.Type.Text) {
											if (
												textColumnTitles.indexOf(
													column.title
												) !== -1 ||
												column.title === ""
											) {
												return column;
											}
										}
									}
								});

								var textObj = items[
									obj.itemIndex
								].valueForColumn(textColumns[obj.columnIndex]);
								var ranges = findGlobal(
									textObj,
									search,
									findOptions
								);

								// Restore background colour
								ranges.forEach((r, i) => {
									var ogColour = Color.RGB(
										ogBackgrounds[i].r,
										ogBackgrounds[i].g,
										ogBackgrounds[i].b,
										ogBackgrounds[i].a
									);
									textObj
										.styleForRange(r)
										.set(
											Style.Attribute.BackgroundColor,
											ogColour
										);
								});
							});
						} else if (buttonIndex === 2) {
							if (replace) {
								console.log("replace");
								node.reveal();
								editor.scrollToNode(node);

								// RGBA values for original background colours to pass into the timer
								var ogBackgrounds = ranges.map((r) => {
									var ogColour = textObj
										.styleForRange(r)
										.get(Style.Attribute.BackgroundColor);
									var lightYellow = Color.RGB(1, 1, 0.1, 0.5);
									textObj
										.styleForRange(r)
										.set(
											Style.Attribute.BackgroundColor,
											ogColour.blend(lightYellow, 0.8)
										);

									var rgb = {
										r: ogColour.red,
										g: ogColour.green,
										b: ogColour.blue,
										a: ogColour.alpha,
									};
									return rgb;
								});

								Timer.once(delay, () => {
									// Needs to re-assign every objects needed as they tend to be invalidated in timer
									var items = [];
									document.editors[0].selection.items.forEach(
										(itm) => {
											items.push(itm);
											items = items.concat(
												itm.descendants
											);
										}
									);
									var textColumns = columns.filter(function (
										column
									) {
										if (
											document.editors[0].visibilityOfColumn(
												column
											)
										) {
											if (
												column.type === Column.Type.Text
											) {
												if (
													textColumnTitles.indexOf(
														column.title
													) !== -1 ||
													column.title === ""
												) {
													return column;
												}
											}
										}
									});

									var textObj = items[
										obj.itemIndex
									].valueForColumn(
										textColumns[obj.columnIndex]
									);
									var ranges = findGlobal(
										textObj,
										search,
										findOptions
									);

									// Restore background colour
									ranges.forEach((r, i) => {
										var ogColour = Color.RGB(
											ogBackgrounds[i].r,
											ogBackgrounds[i].g,
											ogBackgrounds[i].b,
											ogBackgrounds[i].a
										);
										textObj
											.styleForRange(r)
											.set(
												Style.Attribute.BackgroundColor,
												ogColour
											);
									});

									// Replace matched texts
									replaceGlobal(
										textObj,
										search,
										findOptions,
										replacement
									);
								});
							} else {
								console.log("next");
							}
						} else {
							console.log("next");
						}

						// Recursion
						d++;
						if (d < objArr.length) {
							showNextAlert(d);
						} else {
							if (duplicateColumnTitles) {
								duplicateColumnTitles.forEach((title, i) => {
									columns[duplicateColumnIndices[i]].title =
										title;
								});
							}
							console.log("done");
						}
					});
				};
				showNextAlert(0);
			} else {
				var count = 0;
				items.forEach((item, itemIndex) => {
					textColumns.forEach((col, colIndex) => {
						console.log(
							"at item",
							itemIndex + 1,
							"/",
							items.length,
							"column",
							colIndex + 1,
							"/",
							textColumns.length
						);
						var textObj = item.valueForColumn(col);
						if (textObj) {
							count += replaceGlobal(
								textObj,
								search,
								findOptions,
								replacement
							);
						}
					});
				});
				if (duplicateColumnTitles) {
					duplicateColumnTitles.forEach((title, i) => {
						columns[duplicateColumnIndices[i]].title = title;
					});
				}
				if (count === 1) {
					var alertMessage = "1 match has been replaced.";
				} else {
					var alertMessage = count + " matches have been replaced.";
				}
				var alert = new Alert("Confirmation", alertMessage);
				alert.show();
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

function findGlobal(textObj, search, findOptions) {
	var ranges = [];
	var searchRange = new Text.Range(textObj.start, textObj.end);
	console.log("finding", search, "in\n", textObj.string);
	while (textObj.find(search, findOptions, searchRange)) {
		var range = textObj.find(search, findOptions, searchRange);
		ranges.push(range);
		searchRange = new Text.Range(range.end, textObj.end);
	}

	if (ranges.length === 0) {
		console.log("return null");
		return null;
	} else {
		return ranges;
	}
}

function replaceGlobal(textObj, search, findOptions, replacement) {
	var count = 0;
	console.log(
		"replacing",
		search,
		"in\n",
		textObj.string,
		"with",
		replacement
	);
	while (textObj.find(search, findOptions, null)) {
		var range = textObj.find(search, findOptions, null);
		var text = new Text(replacement, textObj.styleForRange(range));
		textObj.replace(range, text);
		count += 1;
	}
	return count;
}

function renameStrings(arr) {
	var count = {};
	arr.forEach(function (x, i) {
		if (arr.indexOf(x) !== i) {
			var c = x in count ? (count[x] = count[x] + 1) : (count[x] = 1);
			var j = c + 1;
			var k = x + " ".repeat(j);
			while (arr.indexOf(k) !== -1) k = x + " " + ++j;
			arr[i] = k;
		}
	});
	return arr;
}

function hasDuplicates(array) {
	return new Set(array).size !== array.length;
}

function columnByTitle(columnArray, title) {
	for (var i = 0; i < columnArray.length; i++) {
		if (columnArray[i].title === title) {
			return columnArray[i];
		}
	}
}
