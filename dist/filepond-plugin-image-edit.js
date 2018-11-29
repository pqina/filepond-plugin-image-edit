/*
 * FilePondPluginImageEdit 1.0.0
 * Licensed under MIT, https://opensource.org/licenses/MIT
 * Please visit https://pqina.nl/filepond for details.
 */

/* eslint-disable */
(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory())
    : typeof define === 'function' && define.amd
      ? define(factory)
      : (global.FilePondPluginImageEdit = factory());
})(this, function() {
  'use strict';

  var isPreviewableImage = function isPreviewableImage(file) {
    return /^image/.test(file.type);
  };

  /**
   * Image Edit Proxy Plugin
   */
  var plugin$1 = function(_) {
    var addFilter = _.addFilter,
      utils = _.utils,
      views = _.views;
    var Type = utils.Type,
      createRoute = utils.createRoute;
    var fileActionButton = views.fileActionButton;

    addFilter('SHOULD_REMOVE_ON_REVERT', function(shouldRemove, _ref) {
      var item = _ref.item,
        query = _ref.query;
      return new Promise(function(resolve) {
        var file = item.file;

        // if this file is editable it shouldn't be removed immidiately even when instant uploading

        var canEdit =
          query('GET_ALLOW_IMAGE_PREVIEW') &&
          query('GET_ALLOW_IMAGE_EDIT') &&
          query('GET_IMAGE_EDIT_ALLOW_EDIT') &&
          isPreviewableImage(file);

        // if the file cannot be edited it should be removed on revert
        resolve(!canEdit);
      });
    });

    // open editor when loading a new item
    addFilter('DID_LOAD_ITEM', function(item, _ref2) {
      var query = _ref2.query,
        dispatch = _ref2.dispatch;
      return new Promise(function(resolve, reject) {
        // get file reference
        var file = item.file;

        if (
          !query('GET_ALLOW_IMAGE_PREVIEW') ||
          !query('GET_ALLOW_IMAGE_EDIT') ||
          !query('GET_IMAGE_EDIT_INSTANT_EDIT')
        ) {
          resolve(item);
          return;
        }

        // exit if this is not an image
        if (!isPreviewableImage(file)) {
          resolve(item);
          return;
        }

        var createEditorResponseHandler = function createEditorResponseHandler(
          item,
          resolve,
          reject
        ) {
          return function(userDidConfirm) {
            // remove item
            editRequestQueue.shift();

            // handle item
            if (userDidConfirm) {
              resolve(item);
            } else {
              reject(item);
            }

            // handle next item!
            requestEdit();
          };
        };

        var requestEdit = function requestEdit() {
          if (!editRequestQueue.length) {
            return;
          }

          var _editRequestQueue$ = editRequestQueue[0],
            item = _editRequestQueue$.item,
            resolve = _editRequestQueue$.resolve,
            reject = _editRequestQueue$.reject;

          dispatch('EDIT_ITEM', {
            id: item.id,
            handleEditorResponse: createEditorResponseHandler(
              item,
              resolve,
              reject
            )
          });
        };

        queueEditRequest({ item: item, resolve: resolve, reject: reject });

        if (editRequestQueue.length === 1) {
          requestEdit();
        }
      });
    });

    var editRequestQueue = [];
    var queueEditRequest = function queueEditRequest(editRequest) {
      editRequestQueue.push(editRequest);
      return editRequest;
    };

    // called for each view that is created right after the 'create' method
    addFilter('CREATE_VIEW', function(viewAPI) {
      // get reference to created view
      var is = viewAPI.is,
        view = viewAPI.view,
        query = viewAPI.query;

      if (
        !is('file') ||
        !query('GET_ALLOW_IMAGE_PREVIEW') ||
        !query('GET_ALLOW_IMAGE_EDIT')
      ) {
        return;
      }

      // no editor defined, then exit
      var editor = query('GET_IMAGE_EDIT_EDITOR');
      if (!editor) return;

      // set default FilePond options
      editor.outputData = true;
      editor.outputFile = false;
      editor.cropAspectRatio =
        query('GET_IMAGE_CROP_ASPECT_RATIO') || editor.cropAspectRatio;

      // opens the editor, if it does not already exist, it creates the editor
      var openEditor = function openEditor(_ref3) {
        var root = _ref3.root,
          props = _ref3.props,
          action = _ref3.action;
        var id = props.id;
        var handleEditorResponse = action.handleEditorResponse;

        // get item

        var item = root.query('GET_ITEM', id);
        if (!item) return;

        // file to open
        var file = item.file;

        // crop data to pass to editor
        var imageParameters = {
          crop: item.getMetadata('crop') || {
            center: {
              x: 0.5,
              y: 0.5
            },
            flip: {
              horizontal: false,
              vertical: false
            },
            zoom: 1,
            rotation: 0,
            aspectRatio: null
          }
        };

        editor.onconfirm = function(_ref4) {
          var data = _ref4.data;
          var crop = data.crop;

          // update crop metadata

          item.setMetadata({ crop: crop });

          // used in instant edit mode
          if (!handleEditorResponse) return;
          editor.onclose = function() {
            handleEditorResponse(true);
            editor.onclose = null;
          };
        };

        editor.oncancel = function() {
          // used in instant edit mode
          if (!handleEditorResponse) return;
          editor.onclose = function() {
            handleEditorResponse(false);
            editor.onclose = null;
          };
        };

        editor.open(file, imageParameters);
      };

      /**
       * Image Preview related
       */
      var didPreviewUpdate = function didPreviewUpdate(_ref5) {
        var root = _ref5.root;

        if (!root.ref.buttonEditItem) {
          return;
        }
        root.ref.buttonEditItem.opacity = 1;
      };

      // create the image preview plugin, but only do so if the item is an image
      var didLoadItem = function didLoadItem(_ref6) {
        var root = _ref6.root,
          props = _ref6.props;

        if (!query('GET_IMAGE_EDIT_ALLOW_EDIT')) {
          return;
        }

        var id = props.id;

        // try to access item

        var item = query('GET_ITEM', id);
        if (!item) return;

        // get the file object
        var file = item.file;

        // exit if this is not an image
        if (!isPreviewableImage(file)) {
          return;
        }

        // set preview view
        var buttonView = view.createChildView(fileActionButton, {
          label: 'edit',
          icon: query('GET_IMAGE_EDIT_ICON_EDIT'),
          opacity: 0
        });

        // edit item classname
        buttonView.element.classList.add('filepond--action-edit-item');
        buttonView.element.dataset.align = query(
          'GET_STYLE_IMAGE_EDIT_BUTTON_EDIT_ITEM_POSITION'
        );

        // handle interactions
        root.ref.handleEdit = function() {
          return root.dispatch('EDIT_ITEM', { id: id });
        };
        buttonView.on('click', root.ref.handleEdit);

        root.ref.buttonEditItem = view.appendChildView(buttonView);
      };

      view.registerDestroyer(function(_ref7) {
        var root = _ref7.root;

        if (root.ref.buttonEditItem) {
          root.ref.buttonEditItem.off('click', root.ref.handleEdit);
        }
      });

      // start writing
      view.registerWriter(
        createRoute({
          DID_IMAGE_PREVIEW_SHOW: didPreviewUpdate,
          DID_LOAD_ITEM: didLoadItem,
          EDIT_ITEM: openEditor
        })
      );
    });

    // Expose plugin options
    return {
      options: {
        // enable or disable image editing
        allowImageEdit: [true, Type.BOOLEAN],

        // location of processing button
        styleImageEditButtonEditItemPosition: ['bottom center', Type.STRING],

        // open editor when image is dropped
        imageEditInstantEdit: [false, Type.BOOLEAN],

        // allow editing
        imageEditAllowEdit: [true, Type.BOOLEAN],

        // the icon to use for the edit button
        imageEditIconEdit: [
          '<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 17h1.586l7-7L15.5 8.414l-7 7V17zm-1.707-2.707l8-8a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1 0 1.414l-8 8A1 1 0 0 1 10.5 19h-3a1 1 0 0 1-1-1v-3a1 1 0 0 1 .293-.707z" fill="currentColor" fill-rule="nonzero"/></svg>',
          Type.STRING
        ],

        // editor object
        imageEditEditor: [null, Type.OBJECT]
      }
    };
  };

  var isBrowser =
    typeof window !== 'undefined' && typeof window.document !== 'undefined';

  if (isBrowser && document) {
    document.dispatchEvent(
      new CustomEvent('FilePond:pluginloaded', { detail: plugin$1 })
    );
  }

  return plugin$1;
});
