
var JsDoc = require('jsdoc');
var fs = require('fs');

function deleteFiles(path) {
  if (fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if (!fs.lstatSync(curPath).isDirectory()) {
        fs.unlinkSync(curPath);
      }
    });
  }
}

module.exports = function(sourceText, editorId, callback) {
  var pathPrefix = "/tmp/jsdoc_preview" + editorId;
  var sourceFile = pathPrefix + "_buf.js";
  fs.writeFile(sourceFile, sourceText, function(err) {
      if (err) {
        return callback(err, null);
      }
      var outPath = pathPrefix + "_out";
      var jd = new JsDoc( "/tmp",
                  {
                    templates: { "default": { outputSourceFiles: false } },
                    plugins: [
                      "jsdoc-plugin-websequencediagrams/plugins/websequencediagram",
                      "plugins/markdown"]
                  },
                  { destination: outPath,
                    access: "all" },
                  [sourceFile]);

      deleteFiles(outPath);
      jd.generateDocs();
      return fs.readdir(outPath, function(err, files) {
                  if (err) {
                    return callback(err, null);
                  }
                  var htmlSource = null;
                  outPath += "/";
                  files.forEach(function(file, index) {
                        if (!fs.lstatSync(outPath + file).isDirectory()) {
                          if (file.match(/\.html$/) && !file.match(/^index_*\./)) {
                            htmlSource = file;
                          }
                        }
                    });
                  if (htmlSource) {
                    fs.readFile(outPath + htmlSource, "utf-8", function(err, data) {
                        callback(null, data);
                      });
                  } else {
                    callback("File not generated");
                  }
              });

  });
};
