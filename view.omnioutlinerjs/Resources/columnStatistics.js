// This action counts the total number of words in the topic column for the selected rows.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		
		// List all visible decimal columns
		var editor = document.editors[0]
		var filteredColumns = columns.filter(function(column){
			if (editor.visibilityOfColumn(column)){
				if (column.type === Column.Type.Number || column.type === Column.Type.Duration){
					return column
				}
			}
		})
		
		if (filteredColumns.length === 0) {
			throw new Error("This document has no number nor duration columns.")
		}
		
		
		var filteredColumnTitles = filteredColumns.map(column => column.title)
		
		// CREATE FORM FOR GATHERING USER INPUT
		var inputForm = new Form()
		
		
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
			
			var values = selection.items.map(item => {
				var value = item.valueForColumn(selectedColumn)
				return value
			})
			
			// Remove null and undefined
			var values = values.filter(value => {
				return value
			})
			
			values.sort(function(a, b) {return a.compare(b)})
			
			console.log('sorted values: ', values.map(dec => dec.toString()))
			var sum = Decimal.zero
			var size = Decimal.zero
			
			values.forEach(value => {
				sum = sum.add(value)
				size = size.add(Decimal.one)
			})
			
			var mean = sum.divide(size)
			var min = values[0]
			var max = values[values.length - 1]
			
			if (values.length % 2 === 0) {
				var median = values[values.length / 2 - 1].add(values[values.length / 2]).divide(Decimal.one.add(Decimal.one))
			} else {
				var median = values[Math.floor(values.length / 2)]
			}
			
			// Compute standard deviation
			var squaredSum = Decimal.zero
			values.forEach(value => {
				squaredSum = squaredSum.add(value.subtract(mean).multiply(value.subtract(mean)))
			})
			var squaredSumMean = squaredSum.divide(size)
			var standardDeviation = Decimal.fromString(Math.sqrt(parseFloat(squaredSumMean.toString())).toString())
			
			
			
			var message = 'Size\n' + decimalToFloat(size) + '\n\n'
			message += 'Sum\n' + decimalToFloat(sum) + '\n\n'
			message += 'Mean\n' + decimalToFloat(mean) + '\n\n'
			message += 'Standard Deviation\n' + decimalToFloat(standardDeviation) + '\n\n'
			message += 'Maximum\n' + decimalToFloat(max) + '\n\n'
			message += 'Minimum\n' + decimalToFloat(min) + '\n\n'
			message += 'Median\n' + decimalToFloat(median)
			
			alert = new Alert('Statistics', message)
			alert.show()
		})
		
		// PROMISE FUNCTION CALLED UPON FORM CANCELLATION
		formPromise.catch(function(err){
			console.log("form cancelled", err.message)
		})
		
		
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.items.length > 0){return true} else {return false}
	};
	
	return action;
}();
_;

function decimalToFloat(decimal) {
	var str = decimal.toString()
	var float =parseFloat(str)
	return parseFloat(float.toPrecision(10))
}