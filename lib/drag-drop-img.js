'use babel';

import DragDropImgView from './drag-drop-img-view';
import { CompositeDisposable, Directory, File } from 'atom';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const defaultImageDir = "/static/images";

export default {

  dragDropImgView: null,
  modalPanel: null,
  subscriptions: null,
  config: {
    suffixes: {
      title: "Active file types",
      description: "File type that image assistant should activate for",
      type: 'array',
      default: ['.markdown','.md'],
      items: {
        type: 'string',
      },
    },
    preserveOrigName: {
      title: "Preserve original file names",
      description: "When dragging and dropping files, whether to perserve original file names when copying over into the image directory",
      type: "boolean",
      default: "false",
    },
    preserveFilenameInAssetsFolder: {
      title: "Create per-file asset directories",
      description: "Creates a separate asset directory for each markdown file, e.g. `README.assets`",
      type: 'boolean',
      default: false,
    },
    imageDir: {
      title: "Image Directory",
      description: "Local directory to copy images into; created if not fount.",
      type: 'string',
      default: defaultImageDir,
    },
    insertHtmlOverMarkdown: {
      title: "Insert image as Markup, insted of Markdown",
      description: "Insert an image as HTML Markup, `<img src=''>`, insted of Markdown",
      type: 'boolean',
      default: false,
    },
  },

  activate(state) {
    this.dragDropImgView = new DragDropImgView(state.dragDropImgViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.dragDropImgView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Registor handler for drag and drop events
    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => this.handle_subscription(editor)));
    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'drag-drop-img:toggle': () => this.toggle()
    }));
  },

  handle_subscription(editor) {
    const textEditorElement = atom.views.getView(editor);
    // on drag and drop event
    textEditorElement.addEventListener("drop", (e) => {this.handle_dropped(e)} );
  },

  // triggered in response to dragged and dropped files
  handle_dropped(e) {
    if (e === null) { return };
    e.preventDefault();
    e.stopPropagation();
    const editor = atom.workspace.getActiveTextEditor();
    if (editor === null) { return };

    const dropped_files = e.dataTransfer.files;

    for (let f of dropped_files) {
      console.log(f);
      if (fs.lstatSync(f.path).isFile()) {
        const imgbuffer = new Buffer(fs.readFileSync(f.path));
        const extname = path.extname(f.path);
        let origname =  path.basename(f.path, extname);
        console.log(origname);
        this.process_file(editor, imgbuffer, extname, origname);
      }
    }
  },

  // triggerd in response to a copy pasted image
  handle_cp(e) {
    const clipboard = reqire('clipboard');
    const img = clipboard.readImage();
    if (img.isEmpty()) { return; };
    const editor = atom.workspace.getActiveTextEditor();
    e.stopImmediatePropagation();
    const imgbuffer = img.toPng();
    this.process_file(editor, imgbuffer, ".png", "");
  },

  // write a given buffer to the local "assets/" directory
  process_file(editor, imgbuffer, extname, origname) {
    const target_file = editor.getPath();
    console.log(atom.project.getPaths());

    // if (path.extname(target_file) not in atom.config.get('markdown-image-assistant.suffixes')) {
    //   console.log("Adding images to non-markdown files is not supported");
    //   return false;
    // }
    const project_path = atom.project.getPaths().length > 0 ? atom.project.getPaths()[0] : "";
    const assets_dir = path.join(project_path, defaultImageDir);
    console.log(`assets_dir: ${assets_dir}`);

    // if (atom.config.get('markdown-image-assistant.imageDir') == defaultImageDir && atom.config.get('markdown-image-assistant.preserveFilenameInAssetsFolder')) {
    //   assets_dir = path.basename(path.parse(target_file).name + "." + atom.config.get('markdown-image-assistant.imageDir'));
    // } else {
    //   assets_dir = path.basename(atom.config.get('markdown-image-assistant.imageDir'));
    // }
    // const assets_path = path.join(target_file, "..", assets_dir);
    // console.log(`assets_path: ${assets_path}`);

    const md5 = crypto.createHash('md5');
    md5.update(imgbuffer);

    let img_filename;
    if (origname === "") {
      img_filename = `${path.parse(target_file).name}-${md5.digest('hex').slice(0,8)}${extname}`;
    } else {
      img_filename = `${origname}${extname}`;
    }
    console.log(`img_filename: ${img_filename}`);

    this.create_dir(assets_dir, () => {
      fs.writeFile(path.join(assets_dir, img_filename), imgbuffer, 'binary', () => {
        console.log(`Copied file over to ${assets_dir}`);
        if (atom.config.get('markdown-image-assistant.insertHtmlOverMarkdown')) {
          editor.insertText("<img alt=\"#{img_filename}\" src=\"#{assets_dir}/#{img_filename}\" width=\"\" height=\"\" >");
        } else {
          editor.insertText(`![](/images/${img_filename})`);
        }
      })
    });

    return false;
  },

  create_dir(dir_path, callback) {
    const dir_handle = new Directory(dir_path);

    dir_handle.exists().then((existed) => {
      if (!existed) {
        dir_handle.create().then((created) => {
          if (created) {
            console.log(`Successfully create ${dir_path}`);
            callback();
          }
        });
      } else {
        callback();
      }
    });
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