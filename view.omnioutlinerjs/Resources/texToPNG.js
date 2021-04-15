// This action generates and shares a base 64 encoded url of a html file to render LaTeX maths formula using mathjax 3.
// The url can be opened in Safari either manually, or automated using Shortcuts, or Scriptable.
(() => {
	var action = new PlugIn.Action(function(selection, sender) {
		// action code
		// selection options: columns, document, editor, items, nodes, outline, styles
		var inputForm = new Form()
		
		var defaultText = ''
		if (Pasteboard.general.hasStrings) {
			var defaultText = Pasteboard.general.string
		}
		// CREATE TEXT FIELD
		var textField = new Form.Field.String(
			"textInput",
			"Formula",
			defaultText
		)
		
		// CREATE TEXT FIELD
		var scaleField = new Form.Field.String(
			"scaleInput",
			"Scale",
			'1.0'
		)
		
		inputForm.addField(textField)
		inputForm.addField(scaleField)
		formPrompt = "Render LaTeX Formula"
		formPromise = inputForm.show(formPrompt,"Continue")
		
		// VALIDATE THE USER INPUT
		inputForm.validate = function(formObject) {
			var textValue = formObject.values["textInput"]
			var textStatus = (textValue && textValue.length > 0) ? true:false
			var scaleValue = formObject.values["scaleInput"]
			var scaleStatus = (scaleValue && scaleValue.length > 0 && parseFloat(scaleValue)) ? true:false
			return textStatus && scaleStatus
		}
	
		// PROCESSING USING THE DATA EXTRACTED FROM THE FORM
		formPromise.then(function(formObject) {
			var tex = formObject.values["textInput"]
			var scale = parseFloat(formObject.values["scaleInput"])
			if (typeof document !== 'undefined') {
				var height = Math.round(scale * parseFloat(document.outline.baseStyle.get(Style.Attribute.FontSize).toString()))
			} else {
				var height = 12
			}
			console.log('input', tex, '\nfont size', height)
			var html = Data.fromBase64(topHTML64).toString()
			html += tex
			html += Data.fromBase64(midHTML64).toString()
			html += height
			html += Data.fromBase64(botHTML64).toString()
			var urlStr = "data:text\/html;base64," + Data.fromString(html).toBase64()
			console.log(urlStr)
			var url = URL.fromString(urlStr)
			var sp = new SharePanel([url])
			sp.show()
		})
			
		
	});

	action.validate = function(selection, sender) {
		// selection options: columns, document, editor, items, nodes, styles
		return true
	};
	
	return action;
})();



const topHTML64 ="PCFET0NUWVBFIGh0bWw+CjxoZWFkPgoJPG1ldGEgY2hhcnNldD0idXRmLTgiPgoJPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCI+Cgk8c2NyaXB0IGlkPSJNYXRoSmF4LXNjcmlwdCIgYXN5bmMgc3JjPSJodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL21hdGhqYXhAMy9lczUvdGV4LXN2Zy1mdWxsLmpzIj48L3NjcmlwdD4KCTxzY3JpcHQ+CgkJZnVuY3Rpb24gY29udmVydCgpIHsKCQkJdmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImlucHV0IikudmFsdWUudHJpbSgpCgkJCXZhciBoZWlnaHQgPSBNYXRoLnJvdW5kKHBhcnNlRmxvYXQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImhlaWdodCIpLnZhbHVlLnRyaW0oKSkpCgkJCXZhciBkaXNwbGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImRpc3BsYXkiKQoJCQl2YXIgYnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoInJlbmRlciIpCgkJCWJ1dHRvbi5kaXNhYmxlZCA9IGRpc3BsYXkuZGlzYWJsZWQgPSB0cnVlCgkJCW91dHB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvdXRwdXQnKQoJCQlzdmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3ZnJykKCQkJcG5nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BuZycpCgkJCW91dHB1dC5pbm5lckhUTUwgPSAnJwoJCQlzdmcuaW5uZXJIVE1MID0gJycKCQkJcG5nLmlubmVySFRNTCA9ICcnCgkJCU1hdGhKYXgudGV4UmVzZXQoKQoJCQl2YXIgb3B0aW9ucyA9IE1hdGhKYXguZ2V0TWV0cmljc0ZvcihvdXRwdXQpCgkJCW9wdGlvbnMuZGlzcGxheSA9IGRpc3BsYXkuY2hlY2tlZAoJCQlNYXRoSmF4LnRleDJzdmdQcm9taXNlKGlucHV0LCBvcHRpb25zKS50aGVuKGZ1bmN0aW9uIChub2RlKSB7CgkJCQlvdXRwdXQuYXBwZW5kQ2hpbGQobm9kZSkKCQkJCWxldCBtak91dCA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoInN2ZyIpWzBdCgkJCQlvdXRwdXQuc3ZnID0gbWpPdXQub3V0ZXJIVE1MCgkJCQl2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKQoJCQkJaW1hZ2Uuc3JjID0gJ2RhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsJyArIHdpbmRvdy5idG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChvdXRwdXQuc3ZnKSkpCgkJCQlpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHsKCQkJCQl2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJykKCQkJCQljYW52YXMud2lkdGggPSBpbWFnZS53aWR0aAoJCQkJCWNhbnZhcy5oZWlnaHQgPSBpbWFnZS5oZWlnaHQKCQkJCQl2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpCgkJCQkJY29udGV4dC5kcmF3SW1hZ2UoaW1hZ2UsIDAsIDApCgkJCQkJaW1hZ2UuaGVpZ2h0ID0gTWF0aC5yb3VuZChpbWFnZS5oZWlnaHQgKiBoZWlnaHQgLyAxMi4gKSAvLyBkZWZhdWx0IDEyIAoJCQkJCXN2Zy5hcHBlbmRDaGlsZChpbWFnZSkKCQkJCQljb25zb2xlLmxvZyhpbWFnZS5zcmMpCgkJCQkJY2FudmFzLnRvQmxvYihmdW5jdGlvbihibG9iKSB7CgkJCQkJCXZhciBuZXdJbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKQoJCQkJCQl2YXIgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKQoJCQkJCQluZXdJbWcuaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0CgkJCQkJCW5ld0ltZy5zcmMgPSB1cmwKCQkJCQkJcG5nLmFwcGVuZENoaWxkKG5ld0ltZykKCQkJCQkJY29uc29sZS5sb2coY2FudmFzLnRvRGF0YVVSTCgpKQoJCQkJCQluZXdJbWcub25sb2FkID0gZnVuY3Rpb24oKSB7CgkJCQkJCQlVUkwucmV2b2tlT2JqZWN0VVJMKHVybCkKCQkJCQkJfQoJCQkJCQkvL2xvY2F0aW9uLnJlcGxhY2UodXJsKQoJCQkJCX0pCgkJCQl9CgkJCQlpbWFnZS5vbmVycm9yID0gZnVuY3Rpb24oKSB7CgkJCQkJcmVqZWN0KCkKCQkJCX0KCQkJCU1hdGhKYXguc3RhcnR1cC5kb2N1bWVudC5jbGVhcigpCgkJCQlNYXRoSmF4LnN0YXJ0dXAuZG9jdW1lbnQudXBkYXRlRG9jdW1lbnQoKQoJCQl9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7CgkJCQlvdXRwdXQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncHJlJykpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGVyci5tZXNzYWdlKSkKCQkJfSkudGhlbihmdW5jdGlvbiAoKSB7CgkJCQlidXR0b24uZGlzYWJsZWQgPSBkaXNwbGF5LmRpc2FibGVkID0gZmFsc2UKCQkJfSkKCQl9Cgk8L3NjcmlwdD4KCTxzdHlsZT4KCSNmcmFtZSB7CgkJbWF4LXdpZHRoOiA0MGVtOwoJCW1hcmdpbjogYXV0bzsKCX0KCSNpbnB1dCB7CgkJYm9yZGVyOiAxcHggc29saWQgZ3JleTsKCQltYXJnaW46IDAgMCAuMjVlbTsKCQl3aWR0aDogMTAwJTsKCQlmb250LXNpemU6IDEyMCU7CgkJYm94LXNpemluZzogYm9yZGVyLWJveDsKCX0KCSNvdXRwdXQsICNzdmcsICNwbmcsICN1cmwgewoJCWZvbnQtc2l6ZTogMTIwJTsKCQltYXJnaW4tdG9wOiAuNzVlbTsKCQlib3JkZXI6IDFweCBzb2xpZCBncmV5OwoJCXBhZGRpbmc6IC4yNWVtOwoJCW1pbi1oZWlnaHQ6IDJlbTsKCX0KCSNvdXRwdXQgPiBwcmUgewoJCW1hcmdpbi1sZWZ0OiA1cHg7Cgl9CgkubGVmdCB7CgkJZmxvYXQ6IGxlZnQ7Cgl9CgkucmlnaHQgewoJCWZsb2F0OiByaWdodDsKCX0KCS5jZW50ZXIgewoJCXRleHQtYWxpZ246IGNlbnRlcjsKCX0KCTwvc3R5bGU+CjwvaGVhZD4KPGJvZHk+CjxkaXYgaWQ9ImZyYW1lIj4KPHRleHRhcmVhIGlkPSJpbnB1dCIgcm93cz0iMTYiIGNvbHM9IjEwIj4K"

const midHTML64 = "CjwvdGV4dGFyZWE+CjxiciAvPgo8ZGl2IGNsYXNzPSJsZWZ0Ij4KPGlucHV0IHR5cGU9ImNoZWNrYm94IiBpZD0iZGlzcGxheSIgY2hlY2tlZD4gPGxhYmVsIGZvcj0iZGlzcGxheSI+RGlzcGxheSBNb2RlPC9sYWJlbD4KPC9kaXY+CjxkaXYgY2xhc3M9InJpZ2h0Ij4KPGlucHV0IHR5cGU9ImJ1dHRvbiIgdmFsdWU9IlJlbmRlciBUZVgiIGlkPSJyZW5kZXIiIG9uY2xpY2s9ImNvbnZlcnQoKSIgLz4KPC9kaXY+CjxiciBjbGVhcj0iYWxsIiAvPgo8ZGl2IGNsYXNzPSJjZW50ZXIiIGlkPSJvdXRwdXQiIHN0eWxlPSJkaXNwbGF5OiBub25lOyI+b3V0cHV0PC9kaXY+CjxkaXYgY2xhc3M9ImNlbnRlciIgaWQ9InN2ZyI+c3ZnPC9kaXY+CjxkaXYgY2xhc3M9ImNlbnRlciIgaWQ9InBuZyI+cG5nPC9kaXY+CjwvZGl2Pgo8dGV4dGFyZWEgaWQ9ImhlaWdodCIgc3R5bGU9ImRpc3BsYXk6IG5vbmU7Ij4K"

const height64 = "MjQ="

const botHTML64 = "CjwvdGV4dGFyZWE+CjwvYm9keT4KPC9odG1sPg=="