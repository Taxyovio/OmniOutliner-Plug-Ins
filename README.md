# OmniOutliner Plug-Ins
##  Introduction
This is a collection of Omni-Automation scripts for OmniOutliner, organised into 5 bundle plug-ins: 

- Edit
- Format
- View
- Share 
- BibTeX

The functionalities are mostly self-explainatory from filenames. The details of each action can be found below. They are designed for iPadOS but most should also work on MacOS. The single actions in `[old] Singles` folder are no longer maintained as they have been incorporated into bundles. 

For those who only want a few single actions, you can take a few simple steps to convert the `*.js` files (except `importBibTeX.js` as it needs the `Parser.js` library) in the bundles into single actions: 

- Find the desired `*.js` file in the `/*.omnioutlinerjs/resources/` folder, and change the extension to omnijs;
- Find a `*.omnijs` file in the `/[old] Singles/` folder;
- Copy the JSON format manifest in the comment header in the `*.omnijs`, such as 

```
/*{
	“type”: “action”,
	“targets”: [“omnioutliner”],
	“author”: “Taxyovio”,
	“description”: “Script creates a new Things task from the selected outline item.”,
	“label”: “Add to Things”,
	“paletteLabel”: “Add to Things”
}*/
```

- Paste it at the first line of the renamed `*.js` file;
- Change the values in the keys such as `label` and `paletteLabel` to appropriate ones.
##  Plug-Ins
###  Edit
####  Copy as Link
This action copies the links for the selected rows, e.g. `omnioutliner:///open?row=fUpE2aoNbcL`.
####  Find and Replace
This action uses input RegEx to find or replace texts, either all at once, or cell by cell with manual confirmation.
####  Add Text
This action inserts input text into a selected column of the selected rows at either the end or the beginning, with the option to set text RGB colour.
####  Add Link
This action inserts a hyperlink from the input text and URL, into a selected column of the selected rows at either the end or the beginning.
####  Add Attachment
This action inserts attachments into a selected column of the selected row, picked from `Files.app`.
####  Rename Attachment
This action renames all attachments in the selected rows, allowing automatic renaming based on column texts, e.g. `{%Topic}-[{%Notes}]-({%Status})`. It allows renaming all at once or manually review and confirm each attachment.
####  Duplicate Column
This action duplicates a selected column and its contents to a new column to the right.
###  Format
####  Paste Style
This action pastes the style of the selected row into selected targets, including all rows, children, descendants, leaves, parent, ancestors, and preceding/following (collateral) siblings. Each target option is a toggle so multiple selections are allowed.
####  Clear Style
This action sets the style of the selected rows to the document base style.
####  Line Spacing
This action adjusts the base line spacing of the document, relative to base font size.
####  Column Formatter
This action changes the column formatter for a selected column. It exposes all column formatting options for date, duration, and number columns, with options of any calendars, time zones, and currencies unavailable through native interface.
####  Apply Title Case
This action sets the texts in a selected column from the selected rows to title case.
####  Split Column
This action splits the selected rows according to the paragraphs in a selected column. It includes all descendants to the new rows.
####  Trim Column Title
This action removes trailing white spaces in all column titles from both ends.
###  View
####  Focus
This action sets the focus of the editor to the selected rows.
####  Hide Column
This action hides all additional columns.
####  Word Count
This action shows the count of words in a selected text column of the selected rows.
####  Character Count
This action shows the count of characters in a selected text column of the selected rows.
####  Column Statistics
This action shows the basic statistics of a selected number or duration column of the selected rows, including sample size, mean, standard deviation, maximum, minimum, and median.
###  Share
####  Add to Anki
This action sends the selected rows into creating new notes in Anki Mobile. It requires appropriate configuration for card types in Anki, with 3 custom card types defined with custom fields: {Basic: Front, Back, Reference, Reverse, Extra}, {Cloze: Text, Reference, Extra}, {Input: Front, Back, Reference, Extra}. It also requires corresponding columns being present in the current document. Otherwise it prompts to create a template document.
####  Add to Things
This action sends sends the selected rows into creating/updating tasks/projects in Things. It includes the OmniOutliner row link in the notes, and has the option to send the Things URL back. Which column are sent to task/project title and notes can be selected. There are toggle options to include checklist, when, reminder, deadline, and tags.
####  Add to DEVONthink
This action sends the selected rows into creating new text documents in DEVONthink. It sends the document title as title, topic as body, notes as notes, and row link as URL.
####  Share Column
This action presents the contents of a selected column of the selected rows in share sheet.
####  Share Attachment
This action presents the attachments in the selected rows in share sheet.
####  Share as Link
This action presents the row links of the selected rows in share sheet.
####  Share as Markdown
This action presents a `.md` file generated from the texts of a selected text column of the selected rows in share sheet. If there’re ‘#’ existing in the texts, it only counts those rows as header and automatically adds more ‘#’ depending on indent level. Otherwise it assumes all rows as headers and add ‘#’ to all of them depending on indent level.
###  BibTeX
####  Copy Cite Key
This action converts the texts in the ‘EntryKey’ column of the selected rows into LaTeX citation command `\cite`, and copies it into the clipboard when confirmed. 
####  Copy Bibliography
This action converts the texts in the ‘title’, ‘author’, ‘year’ columns of the selected rows into LaTeX bibliography command `\bibitem`, and copies it into the clipboard when confirmed. 
####  Unique Key
This action changes duplicate texts in the ‘EntryKey’ column to ensure all cite keys are unique.
####  Import Attachment
This action adds attachments either as files or URL links into a selected column picked from `Files.app`. It can automatically add the attachment into its corresponding row, by matching its filename with texts in visible columns. Optionally the failed matches can be added as new rows. If importing as URL is selected, it automatically converts files stored in GoodReader as GoodReader URLs.
####  Import BibTeX
This action imports a `.bib` file picked from `Files.app`, or appreciate texts from clipboard, into the current document. It creates a new column for each field if necessary. It only shows important columns to prevent performance issues when too many columns are visible. This action is made possible by the [bib2json](https://github.com/mayanklahiri/bib2json) project owned by Mayank Lahiri. 
####  Export BibTeX
This action presents a `.bib` file generated from the selected rows in share sheet.