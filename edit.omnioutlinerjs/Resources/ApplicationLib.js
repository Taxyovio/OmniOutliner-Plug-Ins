var _ = (function () {
	var ApplicationLib = new PlugIn.Library(new Version("1.0"));

	ApplicationLib.isBeforeCurVers = function (versStrToCheck) {
		curVersStr = app.version;
		curVers = new Version(curVersStr);
		versToCheck = new Version(versStrToCheck);
		result = versToCheck.isBefore(curVers);
		console.log(
			versStrToCheck + " is before " + curVersStr + " = " + result
		);
		return result;
	};

	ApplicationLib.isEqualToCurVers = function (versStrToCheck) {
		curVersStr = app.version;
		curVers = new Version(curVersStr);
		versToCheck = new Version(versStrToCheck);
		result = versToCheck.equals(curVers);
		console.log(versStrToCheck + " equals " + curVersStr + " = " + result);
		return result;
	};

	ApplicationLib.isAtLeastCurVers = function (versStrToCheck) {
		curVersStr = app.version;
		curVers = new Version(curVersStr);
		versToCheck = new Version(versStrToCheck);
		result = versToCheck.atLeast(curVers);
		console.log(
			versStrToCheck + " is at least " + curVersStr + " = " + result
		);
		return result;
	};

	ApplicationLib.isAfterCurVers = function (versStrToCheck) {
		curVersStr = app.version;
		curVers = new Version(curVersStr);
		versToCheck = new Version(versStrToCheck);
		result = versToCheck.isAfter(curVers);
		console.log(
			versStrToCheck + " is after " + curVersStr + " = " + result
		);
		return result;
	};

	// returns a list of functions
	ApplicationLib.handlers = function () {
		return "\n// ApplicationLib ©2021 Taxyovio\n• isBeforeCurVers(versStrToCheck)\n• isEqualToCurVers(versStrToCheck)\n• isAtLeastCurVers(versStrToCheck)\n• isAfterCurVers(versStrToCheck)";
	};

	// returns contents of matching strings file
	ApplicationLib.documentation = function () {
		// create a version object
		var aVersion = new Version("1.0");
		// look up the plugin
		var plugin = PlugIn.find("com.Taxyovio.OmniOutliner", aVersion);
		// get the url for the text file inside this plugin
		var url = plugin.resourceNamed("ApplicationLib.strings");
		// read the file
		url.fetch(function (data) {
			dataString = data.toString();
			console.log(dataString); // show in console
			return dataString;
		});
	};

	// text object to markdown
	ApplicationLib.textToMD = function (textObj) {
		var str = "";
		var runs = textObj.attributeRuns;
		var hasAttachment = !(textObj.attachments.length === 0);

		const imgExts = ["png", "jpeg", "jpg", "bmp", "tiff"];

		runs.forEach((text) => {
			if (text.style.link) {
				// Check for hyperlink
				var urlStr = text.style.link.string;

				// Check for possible images
				var filename = urlStr.substr(urlStr.lastIndexOf("/") + 1);

				if (filename) {
					var baseName = filename.substring(
						0,
						filename.lastIndexOf(".")
					);
					var extension = filename.substring(
						filename.lastIndexOf(".") + 1,
						filename.length
					);
					// If there's no extension in the filename, the above codes assign the whole name to extension.
					if (baseName === "") {
						baseName = extension;
						extension = "";
					}

					if (imgExts.indexOf(extension) !== -1) {
						str += "![" + baseName + "](" + urlStr + ")";
					} else {
						if (urlStr === text.string) {
							str += "<" + urlStr + ">";
						} else {
							str += "[" + text.string + "](" + urlStr + ")";
						}
					}
				} else {
					console.log("hi");
					if (urlStr === text.string) {
						str += "<" + urlStr + ">";
					} else {
						str += "[" + text.string + "](" + urlStr + ")";
					}
				}
			} else if (text.fileWrapper) {
				// Check for attachments and if they are images
				var filename = text.fileWrapper.preferredFilename;
				var baseName = filename.substring(0, filename.lastIndexOf("."));
				var extension = filename.substring(
					filename.lastIndexOf(".") + 1,
					filename.length
				);

				// If there's no extension in the filename, the above codes assign the whole name to extension.
				if (baseName === "") {
					baseName = extension;
					extension = "";
				}

				if (imgExts.indexOf(extension) !== -1) {
					str += " ![" + baseName + "](" + filename + ") ";
				} else {
					str += " <" + filename + "> ";
				}
			} else {
				str += text.string;
			}
		});
		console.log(textObj.string, "->\n", str);
		return str;
	};
	return ApplicationLib;
})();
_;
