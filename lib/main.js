/*global arguments, require: true */
/**
 * @project jsdoc-preview
 */
(function() {
  var JsdocPreviewView, fs, isJsdocPreviewView, renderer, url,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  url = require('url');

  fs = require('fs-plus');

  JsdocPreviewView = null;

  renderer = null;

  isJsdocPreviewView = function(object) {
    if (JsdocPreviewView == null) {
      JsdocPreviewView = require('./jsdoc-preview-view');
    }
    return object instanceof JsdocPreviewView;
  };

  module.exports = {
    activate: function() {
      var previewFile;
      if (parseFloat(atom.getVersion()) < 1.7) {
        atom.deserializers.add({
          name: 'JsdocPreviewView',
          deserialize: module.exports.createJsdocPreviewView.bind(module.exports)
        });
      }
      atom.commands.add('atom-workspace', {
        'jsdoc-preview:toggle': (function(_this) {
          return function() {
            return _this.toggle();
          };
        })(this),
        'jsdoc-preview:copy-html': (function(_this) {
          return function() {
            return _this.copyHtml();
          };
        })(this),
        'jsdoc-preview:toggle-break-on-single-newline': function() {
          var keyPath;
          keyPath = 'jsdoc-preview.breakOnSingleNewline';
          return atom.config.set(keyPath, !atom.config.get(keyPath));
        }
      });
      previewFile = this.previewFile.bind(this);
      atom.commands.add('.tree-view .file .name[data-name$=\\.js]', 'jsdoc-preview:preview-file', previewFile);
      return atom.workspace.addOpener((function(_this) {
        return function(uriToOpen) {
          var error, error1, error2, host, pathname, protocol, ref;
          try {
            ref = url.parse(uriToOpen), protocol = ref.protocol, host = ref.host, pathname = ref.pathname;
          } catch (error1) {
            error = error1;
            return;
          }
          if (protocol !== 'jsdoc-preview:') {
            return;
          }
          try {
            if (pathname) {
              pathname = decodeURI(pathname);
            }
          } catch (error2) {
            error = error2;
            return;
          }
          if (host === 'editor') {
            return _this.createJsdocPreviewView({
              editorId: pathname.substring(1)
            });
          } else {
            return _this.createJsdocPreviewView({
              filePath: pathname
            });
          }
        };
      })(this));
    },
    createJsdocPreviewView: function(state) {
      if (state.editorId || fs.isFileSync(state.filePath)) {
        if (JsdocPreviewView == null) {
          JsdocPreviewView = require('./jsdoc-preview-view');
        }
        return new JsdocPreviewView(state);
      }
    },
    toggle: function() {
      var editor, grammars, ref, ref1;
      if (isJsdocPreviewView(atom.workspace.getActivePaneItem())) {
        atom.workspace.destroyActivePaneItem();
        return;
      }
      editor = atom.workspace.getActiveTextEditor();
      if (editor == null) {
        return;
      }
      grammars = (ref = atom.config.get('jsdoc-preview.grammars')) != null ? ref : [];
      if (ref1 = editor.getGrammar().scopeName, indexOf.call(grammars, ref1) < 0) {
        return;
      }
      if (!this.removePreviewForEditor(editor)) {
        return this.addPreviewForEditor(editor);
      }
    },
    uriForEditor: function(editor) {
      return "jsdoc-preview://editor/" + editor.id;
    },
    removePreviewForEditor: function(editor) {
      var previewPane, uri;
      uri = this.uriForEditor(editor);
      previewPane = atom.workspace.paneForURI(uri);
      if (previewPane != null) {
        previewPane.destroyItem(previewPane.itemForURI(uri));
        return true;
      } else {
        return false;
      }
    },
    addPreviewForEditor: function(editor) {
      var options, previousActivePane, uri;
      uri = this.uriForEditor(editor);
      previousActivePane = atom.workspace.getActivePane();
      options = {
        searchAllPanes: true
      };
      if (atom.config.get('jsdoc-preview.openPreviewInSplitPane')) {
        options.split = 'right';
      }
      return atom.workspace.open(uri, options).then(function(jsdocPreviewView) {
        if (isJsdocPreviewView(jsdocPreviewView)) {
          return previousActivePane.activate();
        }
      });
    },
    previewFile: function(arg) {
      var editor, filePath, i, len, ref, target;
      target = arg.target;
      filePath = target.dataset.path;
      if (!filePath) {
        return;
      }
      ref = atom.workspace.getTextEditors();
      for (i = 0, len = ref.length; i < len; i++) {
        editor = ref[i];
        if (!(editor.getPath() === filePath)) {
          continue;
        }
        this.addPreviewForEditor(editor);
        return;
      }
      return atom.workspace.open("jsdoc-preview://" + (encodeURI(filePath)), {
        searchAllPanes: true
      });
    },

    /**
     * Use this to copy HTML
     *
     */
    copyHtml: function() {
      var editor, text;
      editor = atom.workspace.getActiveTextEditor();
      if (editor == null) {
        return;
      }
      if (renderer == null) {
        renderer = require('./renderer');
      }
      text = editor.getSelectedText() || editor.getText();
      return renderer.toHTML(text, editor.getPath(), editor.getGrammar(), function(error, html) {
        if (error) {
          return console.warn('Copying Markdown as HTML failed', error);
        } else {
          return atom.clipboard.write(html);
        }
      });
    }
  };

}).call(this);
