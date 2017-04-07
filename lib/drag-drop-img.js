'use babel';

import DragDropImgView from './drag-drop-img-view';
import { CompositeDisposable } from 'atom';

export default {

  dragDropImgView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.dragDropImgView = new DragDropImgView(state.dragDropImgViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.dragDropImgView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'drag-drop-img:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.dragDropImgView.destroy();
  },

  serialize() {
    return {
      dragDropImgViewState: this.dragDropImgView.serialize()
    };
  },

  toggle() {
    console.log('DragDropImg was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
