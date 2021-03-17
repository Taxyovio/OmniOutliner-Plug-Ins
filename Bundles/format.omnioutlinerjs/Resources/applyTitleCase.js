// This action applies title case to the text of the selected rows.
(() => {
	
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, styles
		selection.items.forEach(function(item){
			str = item.topic
			if (str.lastIndexOf('’') === -1){
				item.topic = titleCaps(str)
			} else {
				indices = [];
				for (var i=0; i < str.length; i++){
					if (str[i] === "’") indices.push(i);
				}
				str = str.replace(/’/g, "'")
				str = titleCaps(str)
				indices.forEach(function(index){
					str = setCharAt(str,index,'’') 
				})
				item.topic = str
			}
		})
	});

	action.validate = function(selection, sender) {
		// validation code
		// selection options: columns, document, editor, items, nodes, styles
		if(selection.nodes.length > 0){return true} else {return false}
	};
	
	return action;
})();

function setCharAt(str,index,chr){
	if(index > str.length-1) return str;
	return str.substr(0,index) + chr + str.substr(index+1);
};

function titleCaps(title){
	// Ported to JavaScript By John Resig - http://ejohn.org/ - 21 May 2008
	// Original by John Gruber - http://daringfireball.net/ - 10 May 2008
	// License: http://www.opensource.org/licenses/mit-license.php

	var small = "(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|v[.]?|via|vs[.]?)";
	var punct = "([!\"#$%&'()*+,./:;<=>?@[\\\\\\]^_`{|}~-]*)";
	var parts = [], split = /[:.;?!] |(?: |^)["Ò]/g, index = 0;
	
	while (true) {
		var m = split.exec(title);

		parts.push( title.substring(index, m ? m.index : title.length)
			.replace(/\b([A-Za-z][a-z.'Õ]*)\b/g, function(all){
				return /[A-Za-z]\.[A-Za-z]/.test(all) ? all : upper(all);
			})
			.replace(RegExp("\\b" + small + "\\b", "ig"), lower)
			.replace(RegExp("^" + punct + small + "\\b", "ig"), function(all, punct, word){
				return punct + upper(word);
			})
			.replace(RegExp("\\b" + small + punct + "$", "ig"), upper));
		
		index = split.lastIndex;
		
		if ( m ) parts.push( m[0] );
		else break;
	}
	
	return parts.join("").replace(/ V(s?)\. /ig, " v$1. ")
		.replace(/(['Õ])S\b/ig, "$1s")
		.replace(/\b(AT&T|Q&A)\b/ig, function(all){
			return all.toUpperCase();
	});
};
    
function lower(word){
	return word.toLowerCase();
};

function upper(word){
	return word.substr(0,1).toUpperCase() + word.substr(1);
};