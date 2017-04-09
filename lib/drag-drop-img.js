'use babel';

import { CompositeDisposable, Directory, File } from 'atom';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const moment = require('moment');
const gm = require('gm');

const defaultImageDir = "/src/images";

export default {

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
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Registor handler for drag and drop events
    this.subscriptions.add(atom.workspace.observeTextEditors(
      (editor) => this.handle_subscription(editor)
    ));
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
        gm(f.path).size((err, size) => {
          if (!err) {
            console.log('width: ' + size.width);
            console.log('height: ' + size.height);
            const imgbuffer = new Buffer(fs.readFileSync(f.path));
            console.log(imgbuffer);
            const extname = path.extname(f.path);
            let origname =  path.basename(f.path, extname);
            console.log(origname);
            this.process_file(editor, imgbuffer, extname, origname, size);
          }
        });
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
    this.process_file(editor, imgbuffer, ".png", "", {});
  },

  // write a given buffer to the local "assets/" directory
  process_file(editor, imgbuffer, extname, origname, imgsize) {
    const target_file = editor.getPath();
    console.log(atom.project.getPaths());

    // if (path.extname(target_file) not in atom.config.get('markdown-image-assistant.suffixes')) {
    //   console.log("Adding images to non-markdown files is not supported");
    //   return false;
    // }

    // TODO how to deal if getPaths() return multipul values
    const project_path = atom.project.getPaths().length > 0 ? atom.project.getPaths()[0] : "";
    const yyyymm = moment().format('YYYY/MM')
    const assets_dir = path.join(project_path, defaultImageDir, yyyymm);
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
        const insstr = this.getImgHugoShortCode(path.join("/images/", yyyymm, img_filename), imgsize);
        editor.insertText(insstr);
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

  // TODO remove magic number
  getImgHugoShortCode(filepath, imgsize) {
    if (imgsize.width > 1280) {
      return `{{% imgsets src="${filepath}" sets="1280,640,320" %}}`;
    } else if (imgsize.width > 640) {
      return `{{% imgsets src="${filepath}" sets="640,320" %}}`;
    } else if (imgsize.width > 320) {
      return `{{% imgsets src="${filepath}" sets="320" %}}`;
    } else {
      return `![](${filepath})`;
    }
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {},

  toggle() {
    console.log('DragDropImg was toggled!');
    atom.notifications.addSuccess("DragDropImg package is enable");
  }

};
