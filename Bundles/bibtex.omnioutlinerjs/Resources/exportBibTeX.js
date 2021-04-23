// This action exports a bib file from the selected rows or the whole document.
var _ = function() {
	var action = new PlugIn.Action(function(selection) {
		var bibStr = exportBibTeX(selection.items)
		var data = Data.fromString(bibStr)
		var fileWrapper = FileWrapper.withContents(document.name + '.bib', data)
		sharePanel = new SharePanel([fileWrapper])
		sharePanel.show()
		
	});

	// routine determines if menu item is enabled
	action.validate = function(selection) {
		if (selection.items.length !== 0) {return true} else {return false}
	};

	return action;
}();
_;

// This function takes an array of outline items and returns a string of bibtex data.
function exportBibTeX(items) {
	const editor = document.editors[0]
	
	if (!document.outline.columns.byTitle('EntryKey')) {
		throw new Error('No column: EntryKey.')
	} else if (document.outline.columns.byTitle('EntryKey').type !== Column.Type.Text) {
		throw new Error('No text column: EntryKey.')
	}
	
	if (!document.outline.columns.byTitle('EntryType')) {
		throw new Error('No column: EntryType.')
	} else if (document.outline.columns.byTitle('EntryType').type !== Column.Type.Text) {
		throw new Error('No text column: EntryType.')
	}
	
	// List all text columns
	var filteredColumns = document.outline.columns.filter(function(column) {
		if (column.type === Column.Type.Text) {return column}
	})
	
	var filteredColumnTitles = filteredColumns.map(function(column) {
		if (column.title !== '') {
			return column.title
		} else if (column === document.outline.noteColumn) {
		// The note column has empty title
			return 'Notes'
		}
	})
	console.log('columns to export: ', filteredColumnTitles)
	
	var str = ''
	
	items.forEach(item => {
		
		var entryTypeText = item.valueForColumn(filteredColumns[filteredColumnTitles.indexOf('EntryType')])
		var entryKeyText = item.valueForColumn(filteredColumns[filteredColumnTitles.indexOf('EntryKey')])
		
		if (entryTypeText && entryTypeText.string.trim().length !== 0 && entryKeyText && entryKeyText.string.trim().length !== 0) {
			// First line of a bibtex entry
			str += '@' + entryTypeText.string.trim() + '{' + entryKeyText.string.trim() + ',\n'
			
			// Export other columns as fields 
			var fieldColumns = filteredColumns.filter(function(column) {
				if (column !== filteredColumns[filteredColumnTitles.indexOf('EntryType')] && column !== filteredColumns[filteredColumnTitles.indexOf('EntryKey')]) {return column}
			})
			
			fieldColumns.forEach(column => {
				if (item.valueForColumn(column) && item.valueForColumn(column).string.trim().length !== 0) {
					str += '\t' + column.title + ' = {' + item.valueForColumn(column).string.trim() + '},\n'
				}
			})
			str += '}\n\n'
		}

	})
	console.log('exported string:\n', str)
	return str
}