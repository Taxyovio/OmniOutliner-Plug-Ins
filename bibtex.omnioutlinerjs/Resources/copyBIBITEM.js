// This action copies the entry key(s) for the selected row(s) into ~\cite{key1, key2, key3, ...}.
var _ = function() {
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		
		const editor = document.editors[0]
		
		if (!document.outline.columns.byTitle('EntryKey')) {
			throw new Error('No column: EntryKey.')
		} else if (document.outline.columns.byTitle('EntryKey').type !== Column.Type.Text) {
			throw new Error('No text column: EntryKey.')
		}
		if (!document.outline.columns.byTitle('title')) {
			throw new Error('No column: title.')
		} else if (document.outline.columns.byTitle('title').type !== Column.Type.Text) {
			throw new Error('No text column: title.')
		}
		if (!document.outline.columns.byTitle('author')) {
			throw new Error('No column: author.')
		} else if (document.outline.columns.byTitle('author').type !== Column.Type.Text) {
			throw new Error('No text column: author.')
		}
		if (!document.outline.columns.byTitle('year')) {
			throw new Error('No column: year.')
		} else if (document.outline.columns.byTitle('year').type !== Column.Type.Text) {
			throw new Error('No text column: year.')
		}
		
		// All text columns titled 'EntryKey'
		var keyColumns = document.outline.columns.filter(function(column) {
			if (column.type === Column.Type.Text && column.title === 'EntryKey') {return column}
		})
		// Take the first one as the source column
		var keyColumn = keyColumns[0]
		
		var titleColumns = document.outline.columns.filter(function(column) {
			if (column.type === Column.Type.Text && column.title === 'title') {return column}
		})
		var titleColumn = titleColumns[0]
		
		var authorColumns = document.outline.columns.filter(function(column) {
			if (column.type === Column.Type.Text && column.title === 'author') {return column}
		})
		var authorColumn = authorColumns[0]
		
		var yearColumns = document.outline.columns.filter(function(column) {
			if (column.type === Column.Type.Text && column.title === 'year') {return column}
		})
		var yearColumn = yearColumns[0]
	

		// \bibitem{hori} {K.~Hori, S.~Katz, A.~Klemm, R.~Pandharipande, R.~Thomas, C.~Vafa, R.~Vakil and E.~Zaslow}, \textit{Mirror Symmetry}, AMS, Providence, USA (2003).

		
		var bibitems = []
		selection.items.forEach(item => {
			var entryKeyText = item.valueForColumn(keyColumn)
			if (entryKeyText && entryKeyText.string.trim().length !== 0) {
				var bibitem = {'key':entryKeyText.string.trim(), 'author':'', 'title':'', 'year':''}
				
				var authorText = item.valueForColumn(authorColumn)
				if (authorText && authorText.string.trim().length !== 0) {
					authors = authorText.string.trim().split(' and ')
					authors.forEach((author, i) => {
						if (i !== authors.length - 1) {
							bibitem.author += author + ', '
						} else if (authors.length === 1) {
							bibitem.author += author
						} else {
							bibitem.author += 'and ' + author
						}
					})
				}
				
				var titleText = item.valueForColumn(titleColumn)
				if (titleText && titleText.string.trim().length !== 0) {
					bibitem.title = titleText.string.trim()
				}
				
				var yearText = item.valueForColumn(yearColumn)
				if (yearText && yearText.string.trim().length !== 0) {
					bibitem.year = yearText.string.trim()
				}
				bibitems.push(bibitem)
			}
		})
		
		var str = ''
		bibitems.forEach(bibitem => {
			str += '\\bibitem\{' + bibitem.key + '\} '
			str += '\{' + bibitem.author + '\}, '
			str += '\\textit\{' + bibitem.title + '\}, '
			str += '(' + bibitem.year + ').\n'
		})
		
		
		var alertTitle = "BIBITEM"
		var alertMessage = str
		
		var alert = new Alert(alertTitle, alertMessage)
		alert.addOption("Cancel")
		alert.addOption("Copy")
		var alertPromise = alert.show()
		
		alertPromise.then(buttonIndex => {
			if (buttonIndex === 1) {
				console.log("Continue script")
				Pasteboard.general.string = str
			} else {
				throw new Error('script cancelled')
			}
		})
		
		
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.items.length > 0) {return true} else {return false}
	};
	
	return action;
}();
_;