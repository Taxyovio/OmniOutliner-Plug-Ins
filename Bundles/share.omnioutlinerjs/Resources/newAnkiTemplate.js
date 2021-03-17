// This action creates a new ooutline document in the deafault location. The document is pre-filled as a template for the "Add to Anki" action.
var _ = function(){
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		Document.makeNewAndShow(function(doc){
			outline = doc.outline
			editor = doc.editors[0]
			
			outline.addColumn(
				Column.Type.Text, 
				editor.afterColumn(outline.outlineColumn), 
				function (column) {
					column.title = 'Back'
				}
			)
			outline.addColumn(
				Column.Type.Text, 
				editor.afterColumn(null), 
				function (column) {
					column.title = 'Tags'
				}
			)
			outline.addColumn(
				Column.Type.Text, 
				editor.afterColumn(null), 
				function (column) {
					column.title = 'Reference'
				}
			)
			outline.addColumn(
				Column.Type.Text, 
				editor.afterColumn(null), 
				function (column) {
					column.title = 'Extra'
				}
			)
			outline.addColumn(
				Column.Type.Enumeration, 
				editor.afterColumn(null), 
				function (column) {
					column.title = 'Reverse'
					column.enumeration.add('No')
					column.enumeration.add('Yes')
				}
			)
			
			outline.addColumn(
				Column.Type.Text, 
				editor.beforeColumn(outline.outlineColumn), 
				function (column) {
					column.title = 'Deck'
				}
			)
			outline.addColumn(
				Column.Type.Enumeration,
				editor.beforeColumn(outline.outlineColumn), 
				function (column) {
					column.title = 'Type'
					column.enumeration.add('Basic')
					column.enumeration.add('Cloze')
					column.enumeration.add('Input')
				}
			)
			baseItem = editor.rootNode.object
			baseItem.addChild(baseItem.beginning, function(item) {
				item.topic = 'This is the front text of a input card.'
				item.setValueForColumn(outline.columns.byTitle('Type').enumeration.memberNamed('Input'), outline.columns.byTitle('Type'))
				item.setValueForColumn('Academia', outline.columns.byTitle('Deck'))
				item.setValueForColumn('This is the back text for a input card.', outline.columns.byTitle('Back'))
				item.setValueForColumn('tag1 tag2', outline.columns.byTitle('Tags'))
				item.setValueForColumn('Wikipedia', outline.columns.byTitle('Reference'))
				item.setValueForColumn('Extra notes', outline.columns.byTitle('Extra'))
			})
			baseItem.addChild(baseItem.beginning, function(item) {
				item.topic = 'This is the {{c1::text}} of a {{c2::cloze card}}.'
				item.setValueForColumn(outline.columns.byTitle('Type').enumeration.memberNamed('Cloze'), outline.columns.byTitle('Type'))
				item.setValueForColumn('Academia', outline.columns.byTitle('Deck'))
				item.setValueForColumn('N/A', outline.columns.byTitle('Back'))
				item.setValueForColumn('tag1 tag2', outline.columns.byTitle('Tags'))
				item.setValueForColumn('Wikipedia', outline.columns.byTitle('Reference'))
				item.setValueForColumn('Extra notes', outline.columns.byTitle('Extra'))
			})
			baseItem.addChild(baseItem.beginning, function(item) {
				item.topic = 'This is the front text of a basic card.'
				item.setValueForColumn(outline.columns.byTitle('Type').enumeration.memberNamed('Basic'), outline.columns.byTitle('Type'))
				item.setValueForColumn('Academia', outline.columns.byTitle('Deck'))
				item.setValueForColumn('This is the back text for a basic card.', outline.columns.byTitle('Back'))
				item.setValueForColumn('tag1 tag2', outline.columns.byTitle('Tags'))
				item.setValueForColumn(outline.columns.byTitle('Reverse').enumeration.memberNamed('No'), outline.columns.byTitle('Reverse'))
				item.setValueForColumn('Wikipedia', outline.columns.byTitle('Reference'))
				item.setValueForColumn('Extra notes', outline.columns.byTitle('Extra'))
			})
			baseItem.addChild(baseItem.beginning, function(item) {
				item.topic = 'This is a template for the "Add to Anki" Omni Automation action. This action requires using appropriate configuration for card types in Anki. Three custom card types are defined with custom fields: {Basic: Front, Back, Reference, Reverse, Extra}, {Cloze: Text, Reference, Extra}, {Input: Front, Back, Reference, Extra}.'
			})
			doc.close()
		})
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		return true
	};
	
	return action;
}();
_;