/**
 * Copyright © Exocortex, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

define([
  'jquery',
  'underscore',
  'mage/template',
  'mage/smart-keyboard-handler',
  'mage/translate',
  'priceUtils',
  'claraplayer',
  'jquery/ui',
  'jquery/jquery.parsequery',
  'mage/validation/validation'
], function($, _, mageTemplate,  keyboardHandler, $t, priceUtils, claraPlayer) {
  'use strict';

  $.widget('clara.Configurator', {
    options: {
      optionConfig: null,
      claraUUID: ''
    },

    _init: function initClaraConfigurator() {

    },

    _create: function createClaraConfigurator() {
      // init clara player
      console.log("ClaraUUID=" + this.options.claraUUID);
      var clara = claraPlayer('clara-player');
      clara.on('loaded', function() {
        console.log('Clara player is loaded and ready');

        ['orbit', 'pan', 'zoom'].forEach(function (tool) {
          clara.player.hideTool(tool);
        });
        clara.configuration.initConfigurator({ form: 'Default', el: document.getElementById('clara-panelControl') });
      });

      var defaultDimensions = {
        Length: 50,
        Width: 50,
        Depth: 8,
      };
      var dimensions = ['Length', 'Width', 'Depth'];
      var selfConfigChange = false;
      var THREE = clara.deps.THREE;

      clara.on('configurationChange', function (ev1) {
        // api.player.frameScene();

        // avoid infinite recursion
        if (selfConfigChange && (ev1[0].name === 'Shape')) {
          selfConfigChange = false;
          return;
        }

        var config = clara.configuration.getConfiguration();

        // back pillows allow depth up to 45cm
        if (ev1[0].name === 'Pillow Type') {
          var maxDepth = 25;
          if (config['Pillow Type'] === 'Back' || config['Pillow Type'] === 'Back (Angled)') {
            maxDepth = 45;
          }
          clara.configuration.setAttribute('Depth (cm)', { maxValue: maxDepth });
        }

        var widthHalf = (Number(config['Width (cm)']) - defaultDimensions.Width) / 100 / 2;
        var lengthHalf = (Number(config['Length (cm)']) - defaultDimensions.Length) / 100 / 2;
        var depthHalf = (Number(config['Depth (cm)']) - defaultDimensions.Depth) / 100 / 2;

        // ***
        ['bottom*', 'back*', 'mesh_elastic'].forEach(function (nodeName) { // add pocket
          clara.scene.setAll({ name: nodeName, plug: 'PolyMesh', properties: { name: 'StretchX' }, property: 'stretchDistance' },
            widthHalf);
        });

        ['bottom*', 'back*'].forEach(function (nodeName) { // add pocket
          clara.scene.setAll({ name: nodeName, plug: 'PolyMesh', properties: { name: 'StretchY' }, property: 'stretchDistance' },
            lengthHalf);
        });

        ['bottom*', 'back*'].forEach(function (nodeName) {
          clara.scene.setAll({ name: nodeName, plug: 'PolyMesh', properties: { name: 'StretchZ' }, property: 'stretchDistance' },
            depthHalf);
        });

        // api.scene.setAll({ name: 'Loops', plug: 'Transform', property: 'translation' }, new THREE.Vector3(widthHalf, 0, -lengthHalf));
        // api.scene.setAll({ name: 'Loops2', plug: 'Transform', property: 'translation' }, new THREE.Vector3(-widthHalf, 0.0884, -lengthHalf));

        clara.scene.setAll({ name: 'Stretch_Offset_Z', plug: 'Transform', property: 'translation' }, new THREE.Vector3(0, 0, -depthHalf));
        clara.scene.setAll({ name: 'Stretch_Offset_XZ', plug: 'Transform', property: 'translation' }, new THREE.Vector3(widthHalf, 0, -depthHalf));
        clara.scene.setAll({ name: 'Stretch_Offset_-XZ', plug: 'Transform', property: 'translation' }, new THREE.Vector3(-widthHalf, 0, -depthHalf));
        // api.scene.setAll({ name: 'Stretch_Offset2', plug: 'Transform', property: 'translation' }, new THREE.Vector3(0, 0, -depthHalf));


        if (ev1[0].name === 'Pillow Type' && config['Pillow Type'] !== 'Bottom') {
          selfConfigChange = true;
          clara.scene.setAll({ name: 'Shear_Offset_Left', plug: 'Transform', property: 'translation' }, new THREE.Vector3(0, 0, 0));
          clara.scene.setAll({ name: 'Shear_Offset_Right', plug: 'Transform', property: 'translation' }, new THREE.Vector3(0, 0, 0));
        }
        else {
          selfConfigChange = true; // avoid infinite recursion
          clara.configuration.executeAttribute('Shape', config['Shape']);
        }
      });

      // Fetch and initialize the sceneId
      clara.sceneIO.fetchAndUse(this.options.claraUUID, null, { waitForPublish: true });

      /*console.log("Making custom configurator...");
      console.log(this.options.optionConfig);

      var optionObj = this.options.optionConfig.options;
      var optionCounter=1;
      var selectionCounter=1;
      for(var key in optionObj) {
        // add div
        this.element.append('<div class="nested options-list">');
        // add title
        this.element.append('<label>' + optionObj[key].title + '</label>');
        // add selections
        selectionCounter=1;
        for(var sel in optionObj[key].selections) {
          this.element.append('<div class="field choice">');
          this.element.append('<input type="radio" class="radio product bundle" name="bundle_option[' + key + ']" value="' + sel + '"/>');
          this.element.append('<label>' + optionObj[key].selections[sel].name + '</label>');
          this.element.append('</div>');
          selectionCounter++;
        }
        // add option quantity
        this.element.append('<input type="number" name="bundle_option_qty[' + optionCounter + ']" value="1"/>');
        // end div
        this.element.append('</div>');
        optionCounter++;
      }
      console.log("done");*/
    }

  });

  return $.clara.Configurator;
});
