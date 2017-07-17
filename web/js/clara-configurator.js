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

    _init: function init() {

    },

    _create: function create() {
      // init clara player
      console.log("ClaraUUID=" + this.options.claraUUID);
      var clara = claraPlayer('clara-player');
      var configuratorPanelId = "clara-panelControl";
      this._initClaraPlayer(clara, this.options.claraUUID, configuratorPanelId);

      console.log(this.options.optionConfig);
    },


    _initClaraPlayer: function initClaraPlayer(clara, uuid, panelid) {
      /*
      * Copied from David's cillowsDemo.js
      */
      var self = this;
      var sceneId = uuid; // clara.io, live demo
      var api = clara;

      var THREE = api.deps.THREE;

      api.sceneIO.fetchAndUse(sceneId, null, { waitForPublish: true });
      api.on('loaded', function () {
        ['orbit', 'pan', 'zoom'].forEach(function (tool) {
          api.player.hideTool(tool);
        });
        api.configuration.initConfigurator({ form: 'Default', el: document.getElementById(panelid) });

        self._mappingConfiguration(clara.configuration.getAttributes(), self.options.optionConfig.options);
        self._createFormFields(self.options.optionConfig.options);
      });


      var defaultDimensions = {
        Length: 50,
        Width: 50,
        Depth: 8,
      };

      var dimensions = ['Length', 'Width', 'Depth'];

      var selfConfigChange = false;

      api.on('configurationChange', function (ev1) {
        // api.player.frameScene();

        var changedName = ev1[0].name;

        var config = api.configuration.getConfiguration();

        // back pillows allow depth up to 45cm
        if (changedName === 'Pillow Type') {
          var maxDepth = 25;
          if (config['Pillow Type'] === 'Back' || config['Pillow Type'] === 'Back (Angled)') {
            maxDepth = 45;
          }
          api.configuration.setAttribute('Depth (cm)', { maxValue: maxDepth });
        }

        // Resizing is handled manually here for convenience/flexibility over configurator actions
        if (changedName === 'Width (cm)' || changedName === 'Length (cm)' || changedName === 'Depth (cm)') {
          var widthHalf = (Number(config['Width (cm)']) - defaultDimensions.Width) / 100 / 2;
          var lengthHalf = (Number(config['Length (cm)']) - defaultDimensions.Length) / 100 / 2;
          var depthHalf = (Number(config['Depth (cm)']) - defaultDimensions.Depth) / 100 / 2;

          // Stretch pillows and attachments along the appropriate dimensions
          ['bottom*', 'back*', 'mesh_elastic', 'mesh_Velcro_strip', 'pocket*'].forEach(function (nodeName) {
            api.scene.setAll({ name: nodeName, plug: 'PolyMesh', properties: { name: 'StretchX' }, property: 'stretchDistance' },
              widthHalf);
          });

          ['bottom*', 'back*', 'pocket*'].forEach(function (nodeName) {
            api.scene.setAll({ name: nodeName, plug: 'PolyMesh', properties: { name: 'StretchY' }, property: 'stretchDistance' },
              lengthHalf);
          });

          ['bottom*', 'back*'].forEach(function (nodeName) {
            api.scene.setAll({ name: nodeName, plug: 'PolyMesh', properties: { name: 'StretchZ' }, property: 'stretchDistance' },
              depthHalf);
          });

          // Offset attachments to match pillow resizing
          api.scene.setAll({ name: 'Stretch_Offset_Z', plug: 'Transform', property: 'translation' }, new THREE.Vector3(0, 0, -depthHalf));
          api.scene.setAll({ name: 'Stretch_Offset_XZ', plug: 'Transform', property: 'translation' }, new THREE.Vector3(widthHalf, 0, -depthHalf));
          api.scene.setAll({ name: 'Stretch_Offset_-XZ', plug: 'Transform', property: 'translation' }, new THREE.Vector3(-widthHalf, 0, -depthHalf));

          // Shift back attachments proportionally along Y to maintain relative height on cushion - problem
          // is then the stretching to account for the shape attribute (angled cushion sides) has to be dynamically
          // recalculated based on attachment height
          // api.scene.setAll({ name: 'Stretch_Offset_Y', plug: 'Transform', property: 'translation' }, new THREE.Vector3(0, lengthHalf/2, 0));
        }

        // Shear_Offsets only apply for ties on the bottom box cushion, not the bottom puffy cushion since
        // it does not have angled variants. The configurator sets the shear offsets to 0 when selecting the
        // bottom puffy cushion, but when switching back to 'Bottom', we need to make sure the offsets are
        // re-applied for the current pillow shape. We manually force this below.
        // Likewise, displacement and stretching of the elastic attachment is performed separately for Back
        // vs Back (Angled) cushions, so need to re-execute the appropriate Shape actions when switching to these
        // cushion types
        if (changedName === 'Pillow Type') {
          if (config['Pillow Type'] === 'Bottom' || config['Pillow Type'] === 'Back') {
            api.configuration.executeAttribute('Shape', config['Shape']);
          }
          else if (config['Pillow Type'] === 'Back (Angled)') {
            api.configuration.executeAttribute('Shape (Angled Back)', config['Shape (Angled Back)']);
          }
        }
      });


    },

    // map clara configuration with magento (reverse map of this.options.optionConfig.options)
    /* this.options.optionConfig.options structure
    * options[key]:
    *               - title
    *               - selections[key]
    *                                  - name
    *  task: reverse the above key-value
    * config[title]:
    *               - key
    *               - selections[name]
    *                                  - key
    * Matching rule: title.includes(name) || name.includes(title)
    *
    * Note: title and name in config and options are similar strings but they could be different
    * Name and title are unique
    * Make sure it's an one-to-one mapping, otherwise report error
    */
    _mappingConfiguration: function mappingConfiguration(claraCon, magentoCon) {
      var claraKey = new Map();
      var claraSelectionKey = new Map();
      claraSelectionKey.set('keyInParent', 'values');
      claraSelectionKey.set('type', 'array');
      claraKey.set('key', 'name');
      claraKey.set('type', 'object');
      claraKey.set('nested', claraSelectionKey);

      var magentoKey = new Map();
      var magentoSelectionKey = new Map();
      magentoSelectionKey.set('keyInParent', 'selections');
      magentoSelectionKey.set('type', 'object');
      magentoSelectionKey.set('key', 'name');
      magentoKey.set('key', 'title');
      magentoKey.set('type', 'object');
      magentoKey.set('nested', magentoSelectionKey);

      var map = this._reverseMapping(magentoCon, magentoKey, claraCon, claraKey);
      if (!map) {
        console.error("Auto mapping clara configuration with magento failed");
        return null;
      }
      console.log(map);

      return map;
    },


    // recursively reverse mapping in primary using target as reference
    _reverseMapping: function reverseMapping(primary, primaryKey, target, targetKey) {
      // result (using ES6 map)
      var map = new Map();
      // save the values in target that already find a matching, to ensure 1-to-1 mapping
      var valueHasMapped = new Map();

      // complexity = o(n^2), could be reduced to o(nlog(n))
      for (var pKey in primary) {
        var primaryValue = primaryKey.get('type') === 'object' ? primary[pKey][primaryKey.get('key')] : primary[pKey];
        if (!primaryValue) {
          console.error("Can not read primaryKey from primary");
          return null;
        }
        // search for title in claraCon
        for (var tKey in target) {
          var targetValue = targetKey.get('type') === 'object' ? target[tKey][targetkey.get('key')] : target[tKey];
          if (!targetValue) {
            console.error("Can not read  targetKey from target");
            return null;
          }
          if (typeof primaryValue !== 'string' || typeof targetValue !== 'string') {
            console.error("Primary or target attribute value is not a string");
            return null;
          }
          if (primaryValue.includes(targetValue) || targetValue.includes(primaryValue)) {
            if (valueHasMapped.has(name)) {
              console.error("Found target attributes with similar names, unable to perform auto mapping");
              return null;
            }
            // find a match
            valueHasMapped.set(targetValue, true);
            map.set(targetValue, pKey);
            // recursively map nested object until primaryKey and targetKey have no 'nested' key
            if (primaryKey.get('nested') && targetKey.get('nested')) {
              var nestedMap = reverseMapping(primary[pKey][primaryKey.get('nested').get('keyInParent')],
                                             primaryKey.get('nested'),
                                             target[tKey][targetKey.get('nested').get('keyInParent')],
                                             targetKey.get('nested'));
              map.set(targetKey.get('nested').get('keyInParent'), nestedMap);
            }
          }
        }
      }
      return map;
    },

    // check if clara configuration match with magento
    _validateConfiguration(claraCon, magentoCon) {

    },


    // add invisible input to product_addtocart_form
    _createFormFields(options) {
      // locate the form div
      var wrapper = document.getElementById('clara-form-configurations-wrapper');
      if (!wrapper) {
        console.error("Can not find clara configuration wrapper");
        return;
      }
      // check if the fields are already created
      if (wrapper.hasChildNodes()) {
        console.warn("Form fields already exist");
        return;
      }

      // insert input fields
      console.log("Making custom configurator...");
      var formFields = document.createElement('div');
      var optionCounter=1;
      var selectionCounter=1;
      for(var key in options) {
        // add div
        var optionEI = document.createElement('input');
        var optionQtyEI = document.createElement('input');

        // set option name and leave default value empty
        optionEI.setAttribute('name', 'bundle_option[' + key + ']');
        optionEI.setAttribute('value', '');
        optionEI.setAttribute('type','hidden')
        // set option quantity
        optionQtyEI.setAttribute('name', 'bundle_option_qty[' + key + ']');
        optionQtyEI.setAttribute('value', '');
        optionQtyEI.setAttribute('type', 'hidden');
        // append to form
        formFields.appendChild(optionEI);
        formFields.appendChild(optionQtyEI)
      }
      wrapper.appendChild(formFields);
      console.log("done");
    },

    // update form fields when configuration change
    _updateFormFields(map) {
      // update dropdowns
      // update size
      // update volume price
    }

  });

  return $.clara.Configurator;
});
