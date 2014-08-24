'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');


var FlairGenerator = yeoman.generators.Base.extend({
  init: function () {
    this.pkg = require('../package.json');

    this.on('end', function () {
      if (!this.options['skip-install']) {
        this.installDependencies({
          callback: function() {
                this.emit('dependenciesInstalled');
          }.bind(this)
        });
      }
    });

        // Now you can bind to the dependencies installed event
    this.on('dependenciesInstalled', function() {
        this.spawnCommand('grunt', ['setup']);
    });
  },

  askFor: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay('Welcome to the marvelous Flair V1.0 Theme generator! Based on WD-S generator by @webdevstudios.'));

    var prompts = [
      {
        type: 'input',
        name: 'themename',
        message: 'Enter the project name?',
        default: 'Flair'
      },
       {
        type: 'input',
        name: 'shortname',
        message: 'Enter the shortened project name?',
        default: function( props ) {
          return this._.slugify( props.themename );
        }.bind(this)
      },
      {
        name: 'themeuri',
        message: 'Enter the URI of your theme?',
        default: 'http://www.sennza.com.au/'
      },
      {
        name: 'author',
        message: 'Enter the  Author name?',
        default: 'Sennza Pty Ltd, Bronson Quick, Tarei King, Lachlan MacPherson'
      },
      {
        name: 'authoruri',
        message: 'Enter the Author URI?',
        default: 'http://www.sennza.com.au/'
      },
      {
        name: 'themedescription',
        message: 'Enter the theme description:',
        default: 'A starter theme based on Flair'
      },
    ];

    this.prompt(prompts, function (props) {
      this.themename = props.themename;
      this.shortname = this._.slugify( props.shortname );
      this.themeuri = props.themeuri;
      this.author = props.author;
      this.authoruri = props.authoruri;
      this.themedescription = props.themedescription;

      done();
    }.bind(this));
  },

  cloneRepo: function() {
    var done = this.async(),
        clone,
        pull,
        update;

    if ( this.src.exists( 'package.json' ) ) {
      this.log( 'Updating Flair Theme from GitHub...' );
      pull = this.spawnCommand( 'git', ['pull', '--recurse-submodules', '-q'], { cwd: this.sourceRoot() } );
      pull.on( 'close', function() {
        update = this.spawnCommand( 'git', ['submodule', 'update', '--recursive', '-q'], { cwd: this.sourceRoot() } );

        update.on( 'close', function() {
          done();
        });
      }.bind( this ));
    } else {
      this.log( 'Cloning Flair from GitHub...' );
      clone = this.spawnCommand( 'git', ['clone', '--recursive', 'git@github.com:sennza/Flair.git', '.', '-q'], { cwd: this.sourceRoot() } );

      clone.on( 'close', function() {
        done();
      }.bind( this ));
    }
  },

  getFiles: function () {
    var files   = this.expandFiles('**/*', { cwd: this.sourceRoot(), dot: true }),
        self    = this,
        ignores = [
          'LICENSE',
          'README.md',
        ];

    this.package = JSON.parse(this.src.read( 'package.json' ));

    this.log.writeln('Generating from ' + 'Flair' + ' v' + this.package.version + '...');

    files.forEach(function(file) {
      if (ignores.indexOf(file) !== -1 || file.indexOf( '.git/' ) !== -1 ) {
        return;
      }

      if ( file.indexOf( '.php' ) > -1 || file.indexOf( '.css'  ) > -1 || file.indexOf( '.scss'  ) > -1 || file.indexOf( '.js'  ) > -1 ) {
        var result = self.read( file );
        result = result.replace( /Text Domain: Flair/g, 'Text Domain: ' + self.shortname);
        result = result.replace( /'flair'/g, '\'' + self.shortname + '\'');
        result = result.replace( /flair_/g, self._.underscored(self.shortname) + '_');
        result = result.replace( / flair/g, ' ' + self.shortname);
        result = result.replace( /flair /g, self.shortname + ' ');
        result = result.replace( / Flair /g, ' ' + self.themename + ' ' );
        result = result.replace( /flair-/g, self.shortname + '-');
        result = result.replace( /Flair_/g, self._.titleize( self.shortname ).replace( '-', '_' ) + '_' );

        if ( file.indexOf( 'style.scss' ) > -1 ) {
          self.log.info( 'Updating theme information in ' + file );
          result = result.replace( /(Theme Name: )(.+)/g, '$1' + self.themename );
          result = result.replace( /(Theme URI: )(.+)/g, '$1' + self.themeuri );
          result = result.replace( /(Author: )(.+)/g, '$1' + self.author );
          result = result.replace( /(Author URI: )(.+)/g, '$1' + self.authoruri );
          result = result.replace( /(Description: )(.+)/g, '$1' + self.themedescription );
          result = result.replace( /(Version: )(.+)/g, '$10.0.1' );
        }

        if ( file == 'package.json' ) {
          self.log.info( 'Updating package information in ' + file );

          result = result.replace( /("name": )(.+)/g, '$1"' + self._.slugify( self.themename ) + '",' );
          result = result.replace( /("description": )(.+)/g, '$1"' + self.themedescription + '",' );
          result = result.replace( /("version": )(.+)/g, '$1"0.0.1",' );
          result = result.replace( /("author": )(.+)/g, '$1"' + self.author + '",' );
          result = result.replace( /("homepage": )(.+)/g, '$1"' + self.themeuri + '",' );
          result = result.replace( /("bugs": )(.+)/g, '$1"",' );
          result = result.replace( /("url": )(.+)/g, '$1""' );
        }

        self.write( file.replace( '/flair', '/' + this.shortname ), result );
      } else {
        // Copy over files substituting the theme name.
        this.copy( file, file.replace( '/flair', '/' + this.shortname ) );
      }
    }, this);
  },
});

module.exports = FlairGenerator;
