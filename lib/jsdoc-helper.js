
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

module.exports = function(sourceText, callback) {
  fs.writeFile("/tmp/jsdoc_preview_buf.js", sourceText, function(err) {
      if (err) {
        return callback(err, null);
      }
      var jd = new JsDoc( "/tmp",
                  {
                    templates: { "default": { outputSourceFiles: false } },
                    plugins: [
                      "jsdoc-plugin-websequencediagrams/plugins/websequencediagram",
                      "plugins/markdown"]
                  },
                  { destination: "/tmp/jsdoc_preview_out",
                    access: "all" },
                  ["jsdoc_preview_buf.js"]);

      deleteFiles("/tmp/jsdoc_preview_out");
      jd.generateDocs();
      return fs.readdir("/tmp/jsdoc_preview_out", function(err, files) {
                  if (err) {
                    return callback(err, null);
                  }
                  var htmlSource = null;
                  files.forEach(function(file, index) {
                        if (!fs.lstatSync("/tmp/jsdoc_preview_out/" + file).isDirectory()) {
                          if (file.match(/\.html$/) && !file.match(/^index_*\./)) {
                            htmlSource = file;
                          }
                        }
                    });
                  if (htmlSource) {
                    fs.readFile("/tmp/jsdoc_preview_out/" + htmlSource, "utf-8", function(err, data) {
                        callback(null, data);
                      });
                  } else {
                    callback("File not generated");
                  }
              });

  });
};
