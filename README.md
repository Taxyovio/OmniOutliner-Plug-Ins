This is a collection of Omni-Automation plug-ins for OmniOutliner I created. The functionalities are mostly self-explainatory from filenames. They are meant to be used on iPadOS but most should work on MacOS.

I have organised all single actions into the bundles. I'll no longer maintain those single actions. 

For those who only want a few single actions, you can take  a few simple steps to convert the *.js files in the bundles into single actions: 

- Find the desired *.js file in the /*.omnioutlinerjs/resources/ folder, and change the extension to omnijs;
- Find a *.omnijs file in the /[old] Singles/ folder;
- Copy the JSON format comment header in the *.omnijs, such as 

```
/*{
	"type": "action",
	"targets": ["omnioutliner"],
	"author": "Taxyovio",
	"description": "Script creates a new Things task from the selected outline item.",
	"label": "Add to Things",
	"paletteLabel": "Add to Things"
}*/
```

- Paste it at the first line of the renamed *.js file;
- Change the values in the keys such as "label" and "paletteLabel" to appropriate ones.

Not all codes are original. In fact I stole most of them from [omni-automation.com](https://omni-automation.com/omnioutliner/index.html) and morphed them into my own. The codes are not up to the highest standards as I'm no javascript programmer.
