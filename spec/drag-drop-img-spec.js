'use babel';

import DragDropImg from '../lib/drag-drop-img';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('DragDropImg', () => {
  let workspaceElement, activationPromise, openEditorPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('drag-drop-img');
    openEditorPromise = atom.workspace.open('test.markdown');
  });

  describe('when the drag-drop-img:toggle event is triggered', () => {
    it('hides and shows the modal panel', () => {
      // Before the activation event the view is not on the DOM, and no panel
      // has been created
      expect(workspaceElement.querySelector('.drag-drop-img')).not.toExist();

      // This is an activation event, triggering it will cause the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'drag-drop-img:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        expect(workspaceElement.querySelector('.drag-drop-img')).toExist();

        let dragDropImgElement = workspaceElement.querySelector('.drag-drop-img');
        expect(dragDropImgElement).toExist();

        let dragDropImgPanel = atom.workspace.panelForItem(dragDropImgElement);
        expect(dragDropImgPanel.isVisible()).toBe(true);
        atom.commands.dispatch(workspaceElement, 'drag-drop-img:toggle');
        expect(dragDropImgPanel.isVisible()).toBe(false);
      });
    });

    it('hides and shows the view', () => {
      // This test shows you an integration test testing at the view level.

      // Attaching the workspaceElement to the DOM is required to allow the
      // `toBeVisible()` matchers to work. Anything testing visibility or focus
      // requires that the workspaceElement is on the DOM. Tests that attach the
      // workspaceElement to the DOM are generally slower than those off DOM.
      jasmine.attachToDOM(workspaceElement);

      expect(workspaceElement.querySelector('.drag-drop-img')).not.toExist();

      // This is an activation event, triggering it causes the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'drag-drop-img:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        // Now we can test for view visibility
        let dragDropImgElement = workspaceElement.querySelector('.drag-drop-img');
        expect(dragDropImgElement).toBeVisible();
        atom.commands.dispatch(workspaceElement, 'drag-drop-img:toggle');
        expect(dragDropImgElement).not.toBeVisible();
      });
    });

    it('is my first test code', () => {
      // <hugo project path>/static/images/2017/04/<image-filename>.<extname>
      waitsForPromise(() => {
        return openEditorPromise;
      });

      runs(() => {
        console.log(openEditorPromise);
        const editor = atom.workspace.getActiveTextEditor();
        const target_file = editor.getPath();

        const project_path = atom.project.getPaths().length > 0 ? atom.project.getPaths()[0] : "";
        expect("ng").toBe(project_path);
        expect("test").toBe(target_file);

      });
    });

    it('copy drop file to static dir', () => {
      const fs = require('fs');
      fs.createReadStream('test.markdown').pipe(fs.createWriteStream('hoge.markdown'));
    });

    it('create todays folder',() => {
      const moment = require('moment');
      expect('2017/04').toBe(moment().format('YYYY/MM'));
    });

  });
});
