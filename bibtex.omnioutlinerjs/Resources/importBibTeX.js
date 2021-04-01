// This action imports bibtex entries into rows from clipboard or bib file.
var _ = function(){
	var action = new PlugIn.Action(function(selection){
		const Parser = this.plugIn.library('Parser')
		// If clipboard contains bibtex string, import that string.
		var pb = Pasteboard.general
		if (pb.hasStrings && /^@/.test(pb.string)){
			var alertTitle = "BibTeX"
			var alertMessage = pb.string
			var alert = new Alert(alertTitle, alertMessage)
			alert.addOption("Cancel")
			alert.addOption("Import")
			var alertPromise = alert.show()
			
			alertPromise.then(buttonIndex => {
				if (buttonIndex === 1){
					console.log("Continue script")
					var bibStr = pb.string
					bibStr = escapeBibStr(bibStr) // Escape special chars \ and { }
					console.log('bibStr:\n', bibStr)
					importBibTeX(bibStr, Parser)
				} else {
					throw new Error('Script cancelled')
				}
			})
		} else {
			console.log('Clipboard has no bibtex.')
			var bibtexType = new TypeIdentifier('org.tug.tex.bibtex')
			var picker = new FilePicker()
			picker.folders = false
			picker.multiple = true
			picker.types = [bibtexType]
			
			pickerPromise = picker.show()
			
			// PROMISE FUNCTION CALLED UPON PICKER APPROVAL
			pickerPromise.then(function(urlsArray){
				urlsArray.forEach(url => {
					var filename = decodeURIComponent(url.string.substring(url.string.lastIndexOf('/')+1))
					console.log('Importing: ', filename)
					url.fetch(function(data){
						var bibStr = data.toString()
						//bibStr = escapeBibStr(bibStr) // Escape special chars \ and { }
						importBibTeX(bibStr, Parser)
					})
					
				})
			})

			// PROMISE FUNCTION CALLED UPON PICKER CANCELLATION
			pickerPromise.catch(function(error){
				console.log("form cancelled", error.message)
			})		
		
		}
		

	});

	// routine determines if menu item is enabled
	action.validate = function(selection){
		if (document && selection.items.length <= 1) {return true} else {return false}
	};

	return action;
}();
_;

// This function takes a string bibStr containing bibtex and add each entry to a new row, using the bibtex2JSON Parser.
function importBibTeX(bibStr, Parser) {
	
	// List all text columns
	const editor = document.editors[0]
	var filteredColumns = columns.filter(function(column){
		if (column.type === Column.Type.Text){return column}
	})
	
	var filteredColumnTitles = filteredColumns.map(function(column){
		if (column.title !== ''){
			return column.title
		} else if (column === document.outline.noteColumn){
		// The note column has empty title for unknown reason
			return 'Notes'
		}
	})
	
	var bibJSON = Parser.BibtexParser(bibStr) 
	// {"entries":[{"ObjectType":"entry","EntryType":"book","EntryKey":"book1","Fields":{"author":"Donald Knuth","title":"Concrete Mathematics"}}],"errors":[]}
	var entries = bibJSON.entries
	console.log('Parsed JSON with ', entries.length, ' entries:\n', JSON.stringify(bibJSON)) 
	var columnTitles = filteredColumnTitles //['EntryType', 'EntryKey', 'title']
	
	
	if (!entries) {
		throw new Error('No BibTeX entries are found.')
	}
	
	// Create a list of columns
	const outline = document.outline
	entries.forEach(entry => {
		if (columnTitles.indexOf('EntryKey') === -1) {
			columnTitles.push('EntryKey')
			outline.addColumn(Column.Type.Text, editor.beforeColumn(outlineColumn), 
				function (column) {
					column.title = 'EntryKey'
				}
			)
		}
		
		if (columnTitles.indexOf('EntryType') === -1) {
			columnTitles.push('EntryType')
			outline.addColumn(Column.Type.Text, editor.beforeColumn(outlineColumn), 
				function (column) {
					column.title = 'EntryType'
				}
			)
		}
		
		var fields = entry.Fields
		Object.getOwnPropertyNames(fields).forEach(fieldName => {
			if (columnTitles.indexOf(fieldName.toLowerCase()) === -1) {
				columnTitles.push(fieldName.toLowerCase())
				outline.addColumn(Column.Type.Text, editor.afterColumn(), 
					function (column) {
						column.title = fieldName.toLowerCase()
						if (!isEssentialField(fieldName)) {
							editor.setVisibilityOfColumn(column, false)
						}
					}
				)
			}
		})
	})
	console.log('Columns: ', columnTitles)
	
	// Add entries into rows
	entries.forEach(entry => {
		var fields = entry.Fields
		if (editor.selection.items.length === 1) {
			var position = editor.selection.items[0].after
			var item = editor.selection.items[0].parent
		} else {
			var position = null
			var item = outline.rootItem
		}
		
		item.addChild(position, function(item) {
				item.setValueForColumn(entry.EntryType, outline.columns.byTitle('EntryType'))
				item.setValueForColumn(entry.EntryKey, outline.columns.byTitle('EntryKey'))
				Object.getOwnPropertyNames(fields).forEach(fieldName => {
					var fieldValue = fields[fieldName]
					item.setValueForColumn(fieldValue, outline.columns.byTitle(fieldName.toLowerCase()))
				})
			}
		)
	})
}

function reverse(str) {
	return str.split("").reverse().join("")
}

function escapeBibStr(bibStr) {
	// Add new line char if the last char is not to help regex
	if (bibStr.slice(-1) !== '\n') {
		bibStr += '\n'
	}
	
	bibStr = bibStr.replace(/\\/g, '\\\\') // Escape backslash
	bibStr = bibStr.replace(/\}(?!(\s*,\s*\n)|\s*\n|\s*$)/g, '\\}') // Escape {
	
	// Escape } by reversing the str first as js doesn't have lookbehind
	var reverseStr = reverse(bibStr)
	reverseStr = reverseStr.replace(/\{(?!(\w*@$)|(\s*=\s*\w*\s*\n,))/g, '{\\')
	bibStr = reverse(reverseStr)
	return bibStr
}

// Return if a field is essential to determine new column visibility
function isEssentialField(filedName) {
	filedName = filedName.toLocaleLowerCase()
	const essentialTitles = ['title', 'author', 'year', 'eprint', 'journal', 'doi', 'publisher', 'url', 'keywords', 'abstract', 'date', 'booktitle', 'owner', 'timestamp']
	if (essentialTitles.indexOf(filedName) !== -1) {
		return true
	} else {
		return false
	}
}