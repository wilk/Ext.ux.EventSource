'use strict';

module.exports = function (grunt) {
    require('load-grunt-tasks') (grunt);

    grunt.initConfig ({
        jshint: {
            options: {
                globals: {
                    EventSource: true ,
                    Ext: true
                } ,
                node: true ,
                eqeqeq: true ,
                undef: true ,
                eqnull: true ,
                browser: true
            } ,
            dist: {
                src: ['ux/EventSource.js', 'demo/*.js']
            }
        } ,
        uglify: {
            dist: {
                src: ['ux/EventSource.js'] ,
                dest: 'build/EventSource.min.js'
            }
        } ,
        watch: {
            dist: {
                files: ['ux/EventSource.js', 'demo/*.js', 'Gruntfile.js'] ,
                tasks: ['jshint']
            }
        } ,
        express: {
            livereload: {
                options: {
                    script: 'demo/app.js'
                }
            }
        } ,
        connect: {
            options: {
                port: 9000 ,
                livereload: 35729
            } ,
            livereload: {
                options: {
                    open: 'http://localhost:9000/demo/index.html'
                }
            }
        }
    });

    grunt.registerTask ('server', ['jshint', 'express', 'connect:livereload', 'watch']);
    grunt.registerTask ('build', ['uglify']);
};