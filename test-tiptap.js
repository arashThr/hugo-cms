const { Editor } = require('@tiptap/core');
const StarterKit = require('@tiptap/starter-kit');
const Image = require('@tiptap/extension-image');
const { Markdown } = require('tiptap-markdown');

const editor = new Editor({
  extensions: [
    StarterKit,
    Image,
    Markdown,
  ],
  content: '<p><img src="test.jpg" alt="test" width="300" style="width: 300px"></p>',
});

console.log(editor.storage.markdown.getMarkdown());
