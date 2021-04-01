var _ = function() {
	var ApplicationLib = new PlugIn.Library(new Version("1.0"));

	ApplicationLib.isBeforeCurVers = function(versStrToCheck){
		curVersStr = app.version
		curVers = new Version(curVersStr)
		versToCheck = new Version(versStrToCheck)
		result = versToCheck.isBefore(curVers)
		console.log(versStrToCheck + ' is before ' + curVersStr + " = " + result)
		return result
	}

	ApplicationLib.isEqualToCurVers = function(versStrToCheck){
		curVersStr = app.version
		curVers = new Version(curVersStr)
		versToCheck = new Version(versStrToCheck)
		result = versToCheck.equals(curVers)
		console.log(versStrToCheck + ' equals ' + curVersStr + " = " + result)
		return result
	}

	ApplicationLib.isAtLeastCurVers = function(versStrToCheck){
		curVersStr = app.version
		curVers = new Version(curVersStr)
		versToCheck = new Version(versStrToCheck)
		result = versToCheck.atLeast(curVers)
		console.log(versStrToCheck + ' is at least ' + curVersStr + " = " + result)
		return result
	}

	ApplicationLib.isAfterCurVers = function(versStrToCheck){
		curVersStr = app.version
		curVers = new Version(curVersStr)
		versToCheck = new Version(versStrToCheck)
		result = versToCheck.isAfter(curVers)
		console.log(versStrToCheck + ' is after ' + curVersStr + " = " + result)
		return result
	}
	
	// returns a list of functions
	ApplicationLib.handlers = function handlers(){
		return "\n// ApplicationLib ©2017 The PlugIn Author\n• isBeforeCurVers(versStrToCheck)\n• isEqualToCurVers(versStrToCheck)\n• isAtLeastCurVers(versStrToCheck)\n• isAfterCurVers(versStrToCheck)"
	}
		
	// returns contents of matching strings file
	ApplicationLib.documentation = function(){
		// create a version object
		var aVersion = new Version("1.0")
		// look up the plugin
		var plugin = PlugIn.find("com.PlugInAuthorID.OmniOutliner",aVersion)
		// get the url for the text file inside this plugin
		var url = plugin.resourceNamed("ApplicationLib.strings")
		// read the file
		url.fetch(function (data){
			dataString = data.toString()
			console.log(dataString) // show in console
			return dataString
		})
	}
	
	return ApplicationLib;
}();
_;