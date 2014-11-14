module.exports = function (grunt) {

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg : grunt.file.readJSON('package.json'),
    version : '0.9.0',
    srcPath : 'src/resrc.js',
    distPath : 'dist/resrc-<%= version %>.min.js',
    jshint : {
      options : {
        jshintrc : ".jshintrc"
      },
      all : ["<%= srcPath %>"]
    },
    uglify : {
      options : {
        banner : grunt.file.read("header.txt"),
        compress : true,
        mangle : true,
        preserveComments : false,
        report : 'gzip'
      },
      build : {
        files : {
          '<%= distPath %>' : ['<%= srcPath %>']
        }
      }
    },
    watch : {
      scripts : {
        files : ['<%= srcPath %>'],
        tasks : ['jshint', 'uglify']
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    }
  });
  grunt.registerTask('build', ['jshint', 'uglify']);
};
