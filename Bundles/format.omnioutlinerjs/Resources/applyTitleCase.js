// This action applies title case to the text of the selected rows.
(() => {

	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles
		var selectedItems = selection.items
		
		// List all visible text columns
		editor = document.editors[0]
		filteredColumns = columns.filter(function(column) {
			if (editor.visibilityOfColumn(column)) {
				if (column.type === Column.Type.Text) {return column}
			}
		})
		
		if (filteredColumns.length === 0) {
			throw new Error("This document has no text columns.")
		}
		
		filteredColumnTitles = filteredColumns.map(function(column) {
			if (column.title !== '') {
				return column.title
			} else if (column === document.outline.noteColumn) {
			// The note column has empty title for unknown reason
				return 'Notes'
			}
		})
		
		// Rename columns with the same titles
		filteredColumnTitles = renameStrings(filteredColumnTitles)
		filteredColumns.forEach((column,index) => {
			if (column.title !== '') {
				if (column.title !== filteredColumnTitles[index]) {
					column.title = filteredColumnTitles[index]
				}
			}
		})
		
		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form()
		
		// CREATE TEXT FIELD
		
		if (filteredColumns.includes(document.outline.outlineColumn)) {
			var defaultColumn = document.outline.outlineColumn
		} else {
			var defaultColumn = document.outline.noteColumn
		}
		
		var columnField = new Form.Field.Option(
			"columnInput",
			"Column",
			filteredColumns,
			filteredColumnTitles,
			defaultColumn
		)
		
		// ADD THE FIELDS TO THE FORM
		inputForm.addField(columnField)
		// PRESENT THE FORM TO THE USER
		formPrompt = "Select Column"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject) {
			return null
		}
	
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject) {
			var selectedColumn = formObject.values["columnInput"]
			
			selectedItems.forEach(function(item) {
				var textObj = item.valueForColumn(selectedColumn)
				var str = textObj.string
				var sty = textObj.style
				if (str.lastIndexOf('’') === -1) {
					newText = new Text(titleCaps(str), sty)
					item.setValueForColumn(newText, selectedColumn)
				} else {
					indices = [];
					for (var i=0; i < str.length; i++) {
						if (str[i] === "’") indices.push(i);
					}
					str = str.replace(/’/g, "'")
					str = titleCaps(str)
					indices.forEach(function(index) {
						str = setCharAt(str,index,'’') 
					})
					newText = new Text(titleCaps(str), sty)
					item.setValueForColumn(newText, selectedColumn)
				}
			})
		})
		
		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function(err) {
			console.log("form cancelled", err.message)
		})
	});
	
	
	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.nodes.length > 0) {return true} else {return false}
	};
	
	return action;
})();

function setCharAt(str,index,chr) {
	if(index > str.length-1) return str;
	return str.substr(0,index) + chr + str.substr(index+1);
};

function titleCaps(title) {
	// Ported to JavaScript By John Resig - http://ejohn.org/ - 21 May 2008
	// Original by John Gruber - http://daringfireball.net/ - 10 May 2008
	// License: http://www.opensource.org/licenses/mit-license.php

	var small = "(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|v[.]?|via|vs[.]?)";
	var punct = "([!\"#$%&'()*+,./:;<=>?@[\\\\\\]^_`{|}~-]*)";
	var parts = [], split = /[:.;?!] |(?: |^)["Ò]/g, index = 0;
	
	while (true) {
		var m = split.exec(title);

		parts.push( title.substring(index, m ? m.index : title.length)
			.replace(/\b([A-Za-z][a-z.'Õ]*)\b/g, function(all) {
				return /[A-Za-z]\.[A-Za-z]/.test(all) ? all : upper(all);
			})
			.replace(RegExp("\\b" + small + "\\b", "ig"), lower)
			.replace(RegExp("^" + punct + small + "\\b", "ig"), function(all, punct, word) {
				return punct + upper(word);
			})
			.replace(RegExp("\\b" + small + punct + "$", "ig"), upper));
		
		index = split.lastIndex;
		
		if ( m ) parts.push( m[0] );
		else break;
	}
	
	return parts.join("").replace(/ V(s?)\. /ig, " v$1. ")
		.replace(/(['Õ])S\b/ig, "$1s")
		.replace(/\b(AT&T|Q&A)\b/ig, function(all) {
			return all.toUpperCase();
	});
};
    
function lower(word) {
	return word.toLowerCase();
};

function upper(word) {
	return word.substr(0,1).toUpperCase() + word.substr(1);
};

function renameStrings(arr) {
	var count = {}
	arr.forEach(function(x, i) {
		if (arr.indexOf(x) !== i) {
			var c = x in count ? count[x] = count[x] + 1 : count[x] = 1
			var j = c + 1
			var k = x + ' ' + j
			while(arr.indexOf(k) !== -1) k = x + ' ' + (++j)
			arr[i] = k
		}
	})
	return arr
}