Great info! 

To me, Links are the key to a successful Obsidian experience. I also leverage Maps of Content (MoC), as they are really just "index" notes with backlinks displayed. But as you point out, using Links and Backlinks doesn't have to be limited to MoCs.

For example, I use this Dataview query to auto-create a list of all notes that link to the MoC:

```dataview
list from [[]] and !outgoing([[]])
sort file.name asc
```

This is a godsend for me as it makes managing the backlinks easy. And again, you don't have to limit this query to an MoC. You could use it wherever you want Backlinks to show up as an index.