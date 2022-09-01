// This action inserts texts at the end or start of the selected column of selected rows.
(() => {
	var action = new PlugIn.Action(function (selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles

		const sizeLimit = 250000000; // The app tends to crahs on iOS/iPadOS with files bigger than 250MB

		var selectedItem = selection.items[0];

		// List all visible text columns for insertion
		editor = document.editors[0];
		var filteredColumns = columns.filter(function (column) {
			if (editor.visibilityOfColumn(column)) {
				if (column.type === Column.Type.Text) {
					return column;
				}
			}
		});

		if (filteredColumns.length === 0) {
			throw new Error("This document has no text columns.");
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

		// Toggle if import urls or files
		var importURLOptionField = new Form.Field.Checkbox(
			"importURLOptionInput",
			"Add as URL",
			false
		);

		// ADD THE FIELDS TO THE FORM
		inputForm.addField(columnField);
		inputForm.addField(importURLOptionField);
		// PRESENT THE FORM TO THE USER
		formPrompt = "Select Column and Import Option";
		formPromise = inputForm.show(formPrompt, "Continue");

		// VALIDATE THE USER INPUT
		inputForm.validate = function (formObject) {
			return null;
		};

		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function (formObject) {
			var selectedColumn = formObject.values["columnInput"];
			var importURL = formObject.values["importURLOptionInput"];

			var picker = new FilePicker();
			picker.folders = false;
			picker.multiple = true;
			picker.types = null;

			pickerPromise = picker.show();

			// PROMISE FUNCTION CALLED UPON PICKER APPROVAL
			pickerPromise.then(function (urlsArray) {
				urlsArray.forEach((url, index) => {
					urlStr = url.string;
					var ogText = selectedItem.valueForColumn(selectedColumn);

					if (importURL) {
						if (ogText) {
							var textObj = new Text(
								urlScheme(urlStr),
								ogText.style
							);
							if (!ogText.string.slice(-1).match(/\s/)) {
								var space = new Text(" ", ogText.style);
								ogText.append(space);
								ogText.append(textObj);
							}
						} else {
							var textObj = new Text(
								urlScheme(urlStr),
								selectedItem.style
							);
							selectedItem.setValueForColumn(
								textObj,
								selectedColumn
							);
						}
					} else {
						// GET FILE NAME
						var filename = urlStr.substring(
							urlStr.lastIndexOf("/") + 1
						);
						// REMOVE FILE EXTENSION AND ENCODING
						var baseName = filename.substring(
							0,
							filename.lastIndexOf(".")
						);
						baseName = decodeURIComponent(baseName);
						var extension = filename.substring(
							filename.lastIndexOf(".") + 1,
							filename.length
						);

						// If there's no extension in the filename, the above codes assign the whole name to extension.
						if (baseName === "") {
							baseName = extension;
							extension = "";
						}
						if (extension === "") {
							filename = baseName;
						} else {
							filename = baseName + "." + extension;
						}
						// IMPORT FILES
						url.fetch(function (data) {
							var size = data.length;
							console.log(filename, size, "bytes");
							if (
								size > sizeLimit &&
								(app.platformName === "iOS" ||
									app.platformName === "iPadOS")
							) {
								const displayNameLimit = 21;
								if (filename.length > displayNameLimit) {
									var displayName =
										baseName.substring(
											0,
											baseName.length -
												(filename.length -
													displayNameLimit)
										) +
										"...." +
										extension;
								} else {
									var displayName = filename;
								}
								var alertTitle = "Confirmation";
								var alertMessage =
									displayName +
									"\nThis file is larger than 250MB, which may cause crash.";
								var alert = new Alert(alertTitle, alertMessage);

								alert.addOption("Skip");
								alert.addOption("Add URL");
								alert.addOption("Add File");
								var alertPromise = alert.show();

								alertPromise.then((buttonIndex) => {
									if (buttonIndex === 0) {
										console.log("skip large file");
									} else if (buttonIndex === 1) {
										console.log(
											"adding url for large file"
										);
										if (ogText) {
											var textObj = new Text(
												urlScheme(urlStr, false),
												ogText.style
											);
											if (
												!ogText.string
													.slice(-1)
													.match(/\s/)
											) {
												var space = new Text(
													" ",
													ogText.style
												);
												ogText.append(space);
												ogText.append(textObj);
											}
										} else {
											var textObj = new Text(
												urlScheme(urlStr),
												selectedItem.style
											);
											selectedItem.setValueForColumn(
												textObj,
												selectedColumn
											);
										}
									} else if (buttonIndex === 2) {
										console.log("adding large file");
										var wrapper = FileWrapper.withContents(
											filename,
											data
										);
										if (ogText) {
											var textObj =
												Text.makeFileAttachment(
													wrapper,
													ogText.style
												);
											ogText.append(textObj);
										} else {
											var textObj =
												Text.makeFileAttachment(
													wrapper,
													selectedItem.style
												);
											selectedItem.setValueForColumn(
												textObj,
												selectedColumn
											);
										}
									}
								});
							} else {
								var wrapper = FileWrapper.withContents(
									filename,
									data
								);
								if (ogText) {
									var textObj = Text.makeFileAttachment(
										wrapper,
										ogText.style
									);
									ogText.append(textObj);
								} else {
									var textObj = Text.makeFileAttachment(
										wrapper,
										selectedItem.style
									);
									selectedItem.setValueForColumn(
										textObj,
										selectedColumn
									);
								}
							}
						});
					}
				});
			});

			// PROMISE FUNCTION CALLED UPON PICKER CANCELLATION
			pickerPromise.catch(function (error) {
				console.log("form cancelled", error.message);
			});

			/*
			// Work around a bug that crops images by forcing UI to update
			var ogAlignment = selectedColumn.textAlignment
			if (ogAlignment === TextAlignment.Natural) {
				selectedColumn.textAlignment = TextAlignment.Left
			} else {
				selectedColumn.textAlignment = TextAlignment.Natural
			}
			selectedColumn.textAlignment = ogAlignment
			*/
		});

		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function (err) {
			console.log("form cancelled", err.message);
		});
	});

	action.validate = function (selection, sender) {
		// selection options: columns, document, editor, items, nodes, styles
		if (selection.items.length === 1) {
			return true;
		} else {
			return false;
		}
	};

	return action;
})();

function urlScheme(urlStr) {
	var result = urlStr;

	if (app.platformName === "iOS" || app.platformName === "iPadOS") {
		// Convert url to Files.app url
		var filesURL = urlStr.replace(/^file\:\/\/\//, "shareddocuments:///");
		result = filesURL;
	}

	return result + " ";
}
