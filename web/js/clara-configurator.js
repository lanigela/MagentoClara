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
      optionConfig: null
    },

    _init: function initClaraConfigurator() {

    },

    _create: function createClaraConfigurator() {
      console.log("Making custom configurator...");
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
          this.element.append('<input type="radio" class="radio product bundle" name="bundle_option[' + optionCounter + ']" value="' + selectionCounter + '"/>');
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
      console.log("done");
    }

  });

  return $.clara.Configurator;
});
