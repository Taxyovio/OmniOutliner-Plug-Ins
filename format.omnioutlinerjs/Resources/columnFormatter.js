// This action changes the formatter of selected column.
(() => {

	var action = new PlugIn.Action(function(selection, sender){
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles
		var selectedItems = selection.items
		
		// List all visible text columns for insertion
		editor = document.editors[0]
		filteredColumns = columns.filter(function(column){
			if (editor.visibilityOfColumn(column)){
				if (column.type === Column.Type.Date || column.type === Column.Type.Duration || column.type === Column.Type.Number) {
					return column
				}
			}
		})
		
		if (filteredColumns.length === 0) {
			throw new Error("This document has no formattable columns.")
		}
		
		filteredColumnTitles = filteredColumns.map(function(column){
			if (column.title !== ''){
				return column.title
			} else if (column === document.outline.noteColumn){
			// The note column has empty title for unknown reason
				return 'Notes'
			}
		})
		
		// Rename columns with the same titles
		filteredColumnTitles = renameStrings(filteredColumnTitles)
		filteredColumns.forEach((column,index) => {
			if (column.title !== ''){
				if (column.title !== filteredColumnTitles[index]) {
					column.title = filteredColumnTitles[index]
				}
			}
		})
		
		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form()
		
		// CREATE TEXT FIELD
		
		var columnField = new Form.Field.Option(
			"columnInput",
			"Column",
			filteredColumns,
			filteredColumnTitles,
			filteredColumns[0]
		)
		
		// ADD THE FIELDS TO THE FORM
		inputForm.addField(columnField)
		// PRESENT THE FORM TO THE USER
		formPrompt = "Select Column"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject){
			return null
		}
	
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject){
			var selectedColumn = formObject.values["columnInput"]
			var selectedColumnType = selectedColumn.type
			// CREATE FORM FOR GATHERING USER INPUT
			var formatterForm = new Form()
			
			if (selectedColumnType === Column.Type.Date) {
				// Calendar and time zone identifiers in the current locale
				var curCalendar = Calendar.current.identifier
				var curTimeZone = Calendar.current.timeZone.abbreviation
				// Calendar and time zone identifiers of the selected column
				var ogCalendar = selectedColumn.formatter.calendar.identidier
				var ogTimeZone = selectedColumn.formatter.timeZone.abbreviation
				
				// CREATE TEXT FIELD
				var formatterField = new Form.Field.Checkbox(
					"formatterInput",
					"ISO 8601",
					false
				)
				
				var defaultDateStyle = Formatter.Date.Style.Short
				var dateStyleField = function (style) {
					return new Form.Field.Option(
						"dateStyleInput",
						"Date Style",
						[Formatter.Date.Style.Full, Formatter.Date.Style.Long, Formatter.Date.Style.Medium, Formatter.Date.Style.Short],
						['Full', 'Long', 'Medium', 'Short'],
						style
					)
				}
				
				var defaultTimeStyle = 'none'
				var timeStyleField = function (style) {
					return new Form.Field.Option(
						"timeStyleInput",
						"Time Style",
						[Formatter.Date.Style.Full, Formatter.Date.Style.Long, Formatter.Date.Style.Medium, Formatter.Date.Style.Short, 'none'],
						['Full', 'Long', 'Medium', 'Short', 'None'],
						style
					)
				}
				
				var defaultCalendar = curCalendar
				var calendarField = function (str) {
					return new Form.Field.Option(
						"calendarInput",
						"Calendar",
						['iso8601', 'buddhist', 'chinese', 'coptic', 'ethiopicAmeteAlem', 'ethiopicAmeteMihret', 'gregorian', 'hebrew', 'islamic', 'islamicCivil', 'islamicTabular', 'islamicUmmAlQura', 'japanese', 'persian', 'republicOfChina'],
						['ISO 8601', 'Buddhist', 'Chinese', 'Coptic', 'Ethiopic Amete Alem', 'Ethiopic Amete Mihret', 'Gregorian', 'Hebrew', 'Islamic', 'Islamic Civil', 'Islamic Tabular', 'Islamic Umm al-Qura', 'Japanese', 'Persian', 'Republic Of China'],
						str
					)
				}
				
				var defaultTimeZone = curTimeZone
				var timeZoneField = function (str) {
					return new Form.Field.Option(
						"timeZoneInput",
						"Time Zone",
						TimeZone.abbreviations,
						null,
						str
					)
				}
					
				
				// ADD THE FIELDS TO THE FORM
				formatterForm.addField(formatterField)
				formatterForm.addField(dateStyleField(defaultDateStyle))
				formatterForm.addField(timeStyleField(defaultTimeStyle))
				//formatterForm.addField(calendarField)
				//formatterForm.addField(timeZoneField)

				// PRESENT THE FORM TO THE USER
				formatterFormPrompt = "Select Formatter"
				formatterFormPromise = formatterForm.show(formatterFormPrompt,"Continue")
				
				// VALIDATE THE USER INPUT
				formatterForm.validate = function(formObject){
					var keys = formObject.fields.map(field => field.key)
					
					if (formObject.values["formatterInput"] === true) {
						if (keys.indexOf('timeStyleInput') !== -1) {
							defaultTimeStyle = formObject.values['timeStyleInput']
							formObject.removeField(formObject.fields[keys.indexOf('timeStyleInput')])
						}
						if (keys.indexOf('dateStyleInput') !== -1) {
							defaultDateStyle = formObject.values['dateStyleInput']
							formObject.removeField(formObject.fields[keys.indexOf('dateStyleInput')])
						}
						
						if (keys.indexOf('calendarInput') === -1) {
							formObject.addField(calendarField(defaultCalendar), 1)
						}
						if (keys.indexOf('timeZoneInput') === -1) {
							formObject.addField(timeZoneField(defaultTimeZone), 2)
						}
					} else {
						
						if (keys.indexOf('timeZoneInput') !== -1) {
							defaultTimeZone = formObject.values['timeZoneInput']
							formObject.removeField(formObject.fields[keys.indexOf('timeZoneInput')])
						}
						if (keys.indexOf('calendarInput') !== -1) {
							defaultCalendar = formObject.values['calendarInput']
							formObject.removeField(formObject.fields[keys.indexOf('calendarInput')])
						}
						
						if (keys.indexOf('dateStyleInput') === -1) {
							formObject.addField(dateStyleField(defaultDateStyle), 1)
						}
						
						if (keys.indexOf('timeStyleInput') === -1) {
							formObject.addField(timeStyleField(defaultTimeStyle), 2)
						}
					}
					return null
				}
			
				// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
				formatterFormPromise.then(function(formObject){
					var selectedFormatter = formObject.values["formatterInput"]
					
					var selectedCalendar = formObject.values["calendarInput"]
					var selectedTimeZone = formObject.values["timeZoneInput"]

					if (selectedFormatter === false) {
						selectedColumn.formatter = null
						var selectedDateStyle = formObject.values["dateStyleInput"]
						if (formObject.values["timeStyleInput"] === 'none') {
							var selectedTimeStyle = null
						} else {
							var selectedTimeStyle = formObject.values["timeStyleInput"]
						}
						selectedColumn.formatter = Formatter.Date.withStyle(selectedDateStyle, selectedTimeStyle)
					} else {
						selectedColumn.formatter = Formatter.Date.iso8601
						if (selectedCalendar !== ogCalendar) {
							var cal = eval('Calendar.' + selectedCalendar)
							selectedColumn.formatter.calendar = cal
						}
						if (selectedTimeZone !== ogTimeZone) {
							selectedColumn.formatter.timeZone = new TimeZone(selectedTimeZone)
						}
					}
				})
				
				// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
				formatterFormPromise.catch(function(err){
					console.log("form cancelled", err.message)
				})
				
			}
			
			
			
			
			
			
			
			
			if (selectedColumnType === Column.Type.Duration) {
				// Original duration formats of the selected column
				var ogHoursPerDay = selectedColumn.formatter.hoursPerDay
				var ogHoursPerWeek = selectedColumn.formatter.hoursPerWeek
				var ogUseVerboseFormat = selectedColumn.formatter.useVerboseFormat
				
				// CREATE TEXT FIELD
				var formatterField = new Form.Field.Option(
					"formatterInput",
					"Format",
					[false, true],
					['Concise', 'Verbose'],
					ogUseVerboseFormat
				)
				var dayField = new Form.Field.String(
					"dayInput",
					"Hours Per Day",
					ogHoursPerDay.toString()
				)
				
				var weekField = new Form.Field.String(
					"weekInput",
					"Hours Per Week",
					ogHoursPerWeek.toString()
				)
				
				
				// ADD THE FIELDS TO THE FORM
				formatterForm.addField(formatterField)
				formatterForm.addField(dayField)
				formatterForm.addField(weekField)
				// PRESENT THE FORM TO THE USER
				formatterFormPrompt = "Select Formatter"
				formatterFormPromise = formatterForm.show(formatterFormPrompt,"Continue")
				
				// VALIDATE THE USER INPUT
				formatterForm.validate = function(formObject){
					if (isNaN(parseFloat(formObject.values["dayInput"])) || isNaN(parseFloat(formObject.values["weekInput"]))) {
						throw new Error('Please enter numbers.')
					} else {
						return null
					}
					
				}
			
				// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
				formatterFormPromise.then(function(formObject){
					var useVerboseFormat = formObject.values["formatterInput"]
					var hoursPerDay = parseFloat(formObject.values["dayInput"])
					var hoursPerWeek = parseFloat(formObject.values["weekInput"])
					
					if (useVerboseFormat !== ogUseVerboseFormat) {
						selectedColumn.formatter.useVerboseFormat = useVerboseFormat
					}
					if (hoursPerDay !== ogHoursPerDay) {
						console.log(ogHoursPerDay)	
						console.log(hoursPerDay)		
						selectedColumn.formatter.hoursPerDay = hoursPerDay
					}
					if (hoursPerWeek !== ogHoursPerWeek) {
						selectedColumn.formatter.hoursPerWeek = hoursPerWeek
					}
				})
				
				// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
				formatterFormPromise.catch(function(err){
					console.log("form cancelled", err.message)
				})
			}
			
			
			
			
			if (selectedColumnType === Column.Type.Number) {
			
				currencyCodes = []
				Locale.identifiers.forEach(id => {
					loc = new Locale(id)
					currencyCodes.push(loc.currencyCode)
				})
				currencyCodes = currencyCodes.filter(el => {
					return el
				})
				currencyCodes = currencyCodes.filter(onlyUnique)
				currencyCodes.sort()
				currencyCodes.unshift('None')
				
				// CREATE TEXT FIELD
				var formatterField = new Form.Field.Option(
					"formatterInput",
					"Format",
					['None', 'plain', 'decimal','thousandsAndDecimal', 'percent', 'percentWithDecimal'],
					['None', 'Integer', 'Decimal', 'Separator Decimal', 'Percent', 'Percent Decimal'],
					'None'
				)
				
				var currencyField = new Form.Field.Option(
					"currencyInput",
					"Currency",
					currencyCodes,
					null,
					'None'
				)
				
				// ADD THE FIELDS TO THE FORM
				formatterForm.addField(formatterField)
				formatterForm.addField(currencyField)
				
				// PRESENT THE FORM TO THE USER
				formatterFormPrompt = "Select Formatter"
				formatterFormPromise = formatterForm.show(formatterFormPrompt,"Continue")
				
				// VALIDATE THE USER INPUT
				formatterForm.validate = function(formObject){
					if (formObject.values["currencyInput"] !== 'None' && formObject.values["formatterInput"] !== 'None') {
						throw new Error('Formatter and currency options are exclusive.')
					} else if (formObject.values["currencyInput"] === 'None' && formObject.values["formatterInput"] === 'None') {
						throw new Error('Please choose an option.')
					}
					return null
				}
			
				// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
				formatterFormPromise.then(function(formObject){
					var selectedFormatter = formObject.values["formatterInput"]
					var selectedCurrency = formObject.values["currencyInput"]
					if (selectedFormatter !== 'None') {
						selectedColumn.formatter = eval('Formatter.Decimal.' + selectedFormatter)
					} else if (selectedCurrency !== 'None') {
						selectedColumn.formatter = Formatter.Decimal.currency(selectedCurrency)
					}
				})
				
				// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
				formatterFormPromise.catch(function(err){
					console.log("form cancelled", err.message)
				})
			}
		})
		
		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function(err){
			console.log("form cancelled", err.message)
		})
		
	});
	
	
	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if (document) {return true} else {return false}
	};
	
	return action;
})();

function onlyUnique(value, index, self) {
	return self.indexOf(value) === index
}

function renameStrings(arr){
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