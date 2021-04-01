// This action renames duplicate entry keys to make them unique.
var _ = function(){
	var action = new PlugIn.Action(function(selection){
		editor = document.editors[0]
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
		
		// Record the row items and their EntryKey strings.
		var keysObj = {'keys':[], 'items':[]}
		
		rootItem.descendants.forEach((item, index) => {
			var entryKeyText = item.valueForColumn(document.outline.columns.byTitle('EntryKey'))
			if (entryKeyText && entryKeyText.string.length !== 0) {
				keysObj.keys.push(entryKeyText.string)
				keysObj.items.push(item)
			} else {
				var entryTypeText = item.valueForColumn(document.outline.columns.byTitle('EntryType'))
				if (entryTypeText && entryTypeText.string.length !== 0) {
					if (entryKeyText) {
						entryKeyText.string = entryTypeText.string.trim() + index
					} else {
						var text = new Text(entryTypeText.string.trim() + index, item.style)
						item.setValueForColumn(text, document.outline.columns.byTitle('EntryKey'))
					}
				} else {
					if (entryKeyText) {
						entryKeyText.string = index.toString()
					} else {
						var text = new Text(index.toString(), item.style)
						item.setValueForColumn(text, document.outline.columns.byTitle('EntryKey'))
					}
				}
				entryKeyText = item.valueForColumn(document.outline.columns.byTitle('EntryKey'))
				keysObj.keys.push(entryKeyText.string)
				keysObj.items.push(item)
			}
		})
		
		if (hasDuplicates(keysObj.keys)) {
			var duplicateCount = keysObj.keys.length - keysObj.keys.filter(onlyUnique).length
			
			var alertTitle = "Confirmation"
			if (duplicateCount === 1) {
				var alertMessage = "Rename 1 duplicate entry key?"
			} else {
				var alertMessage = "Rename " + duplicateCount + " duplicate entry keys?"
			}
			var alert = new Alert(alertTitle, alertMessage)
			alert.addOption("Cancel")
			alert.addOption("Continue")
			var alertPromise = alert.show()
			
			alertPromise.then(buttonIndex => {
				if (buttonIndex === 1){
					console.log("Continue script")
					
					var uniqueKeys = renameStrings(keysObj.keys)
					var renamingLog = ''
					uniqueKeys.forEach((key, i) => {
						var item = keysObj.items[i]
						var ogKeyText = item.valueForColumn(document.outline.columns.byTitle('EntryKey'))
						if (ogKeyText.string !== key) {
							renamingLog += ogKeyText.string + ' -> ' + key + '\n'
							ogKeyText.string = key
						}
					})
					
					var alertTitle = "Confirmation"
					var alertMessage = renamingLog
					var alert = new Alert(alertTitle, alertMessage)
					alert.show()
					
				} else {
					throw new Error('script cancelled')
				}
			})
		} else {
			var alertTitle = "Confirmation"
			var alertMessage = "No duplicate entry keys are found."
			var alert = new Alert(alertTitle, alertMessage)
			alert.show()
		}
		
	});

	// routine determines if menu item is enabled
	action.validate = function(selection){
		if (document) {return true} else {return false}
	};

	return action;
}();
_;

function renameStrings(arr){
	var count = {}
	arr.forEach(function(x, i) {
		if (arr.indexOf(x) !== i) {
			var c = x in count ? count[x] = count[x] + 1 : count[x] = 1
			var j = c + 1
			var k = x + j
			while(arr.indexOf(k) !== -1) k = x + (++j)
			arr[i] = k
		}
	})
	return arr
}

function hasDuplicates(array) {
	return (new Set(array)).size !== array.length;
}

function onlyUnique(value, index, self) {
	return self.indexOf(value) === index
}