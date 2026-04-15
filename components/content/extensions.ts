import { Extension } from '@tiptap/core';
import '@tiptap/extension-text-style';

export interface FontSizeOptions {
  types: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Extension.create<FontSizeOptions>({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

export interface IndentOptions {
  types: string[];
  indentLevels: number;
  defaultIndentLevel: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
      setIndent: (level: number) => ReturnType;
      setTextIndent: (level: number) => ReturnType;
      setRightIndent: (level: number) => ReturnType;
    };
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      indentLevels: 8,
      defaultIndentLevel: 0,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: this.options.defaultIndentLevel,
            parseHTML: element => {
              const paddingLeft = element.style.paddingLeft;
              const marginLeft = element.style.marginLeft;
              const indentValue = paddingLeft || marginLeft;
              
              if (indentValue) {
                const match = indentValue.match(/^(\d+(?:\.\d+)?)(px|cm|mm|in|pt|pc|em|rem)$/);
                if (match) {
                  const value = parseFloat(match[1]);
                  const unit = match[2];
                  // Convert everything to a relative level (base 40px)
                  if (unit === 'px') return value / 40;
                  if (unit === 'cm') return (value * 37.8) / 40;
                  if (unit === 'mm') return (value * 3.78) / 40;
                  if (unit === 'in') return (value * 96) / 40;
                  if (unit === 'pt') return (value * 1.33) / 40;
                  if (unit === 'pc') return (value * 16) / 40;
                  if (unit === 'em' || unit === 'rem') return (value * 16) / 40;
                  return value / 40;
                }
              }
              return this.options.defaultIndentLevel;
            },
            renderHTML: attributes => {
              if (!attributes.indent || attributes.indent === 0) {
                return {};
              }

              return {
                style: `margin-left: ${attributes.indent * 40}px`,
              };
            },
          },
          textIndent: {
            default: 0,
            parseHTML: element => {
              const textIndent = element.style.textIndent;
              if (textIndent) {
                const match = textIndent.match(/^(-?\d+(?:\.\d+)?)(px|cm|mm|in|pt|pc|em|rem)$/);
                if (match) {
                  const value = parseFloat(match[1]);
                  const unit = match[2];
                  if (unit === 'px') return value / 40;
                  if (unit === 'cm') return (value * 37.8) / 40;
                  if (unit === 'mm') return (value * 3.78) / 40;
                  if (unit === 'in') return (value * 96) / 40;
                  if (unit === 'pt') return (value * 1.33) / 40;
                  if (unit === 'pc') return (value * 16) / 40;
                  if (unit === 'em' || unit === 'rem') return (value * 16) / 40;
                  return value / 40;
                }
              }
              return 0;
            },
            renderHTML: attributes => {
              if (!attributes.textIndent || attributes.textIndent === 0) {
                return {};
              }

              return {
                style: `text-indent: ${attributes.textIndent * 40}px`,
              };
            },
          },
          rightIndent: {
            default: 0,
            parseHTML: element => {
              const paddingRight = element.style.paddingRight;
              if (paddingRight) {
                const match = paddingRight.match(/^(\d+(?:\.\d+)?)(px|cm|mm|in|pt|pc|em|rem)$/);
                if (match) {
                  const value = parseFloat(match[1]);
                  const unit = match[2];
                  if (unit === 'px') return value / 40;
                  if (unit === 'cm') return (value * 37.8) / 40;
                  if (unit === 'pt') return (value * 1.33) / 40;
                  return value / 40;
                }
              }
              return 0;
            },
            renderHTML: attributes => {
              if (!attributes.rightIndent || attributes.rightIndent === 0) {
                return {};
              }

              return {
                style: `margin-right: ${attributes.rightIndent * 40}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        tr = updateIndentLevel(tr, this.options, 1);
        if (tr.docChanged) {
          dispatch?.(tr);
          return true;
        }
        return false;
      },
      outdent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        tr = updateIndentLevel(tr, this.options, -1);
        if (tr.docChanged) {
          dispatch?.(tr);
          return true;
        }
        return false;
      },
      setIndent: (level: number) => ({ tr, state, dispatch }) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        tr = setExactIndentLevel(tr, this.options, level);
        if (tr.docChanged) {
          dispatch?.(tr);
          return true;
        }
        return false;
      },
      setTextIndent: (level: number) => ({ tr, state, dispatch }) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        tr = setExactTextIndentLevel(tr, this.options, level);
        if (tr.docChanged) {
          dispatch?.(tr);
          return true;
        }
        return false;
      },
      setRightIndent: (level: number) => ({ tr, state, dispatch }) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        tr = setExactRightIndentLevel(tr, this.options, level);
        if (tr.docChanged) {
          dispatch?.(tr);
          return true;
        }
        return false;
      },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    };
  },
});

function updateIndentLevel(tr: any, options: any, delta: number) {
  const { doc, selection } = tr;
  if (!doc || !selection) return tr;

  const { from, to } = selection;

  doc.nodesBetween(from, to, (node: any, pos: number) => {
    if (options.types.includes(node.type.name)) {
      tr = setNodeIndentMarkup(tr, pos, delta, options);
      return false;
    }
    return true;
  });

  return tr;
}

function setExactIndentLevel(tr: any, options: any, level: number) {
  const { doc, selection } = tr;
  if (!doc || !selection) return tr;

  const { from, to } = selection;

  doc.nodesBetween(from, to, (node: any, pos: number) => {
    if (options.types.includes(node.type.name)) {
      const clampedLevel = Math.max(0, Math.min(level, options.indentLevels));
      const nodeAttrs = { ...node.attrs, indent: clampedLevel };
      tr = tr.setNodeMarkup(pos, node.type, nodeAttrs, node.marks);
      return false;
    }
    return true;
  });

  return tr;
}

function setExactTextIndentLevel(tr: any, options: any, level: number) {
  const { doc, selection } = tr;
  if (!doc || !selection) return tr;

  const { from, to } = selection;

  doc.nodesBetween(from, to, (node: any, pos: number) => {
    if (options.types.includes(node.type.name)) {
      const clampedLevel = Math.max(-options.indentLevels, Math.min(level, options.indentLevels));
      const nodeAttrs = { ...node.attrs, textIndent: clampedLevel };
      tr = tr.setNodeMarkup(pos, node.type, nodeAttrs, node.marks);
      return false;
    }
    return true;
  });

  return tr;
}

function setExactRightIndentLevel(tr: any, options: any, level: number) {
  const { doc, selection } = tr;
  if (!doc || !selection) return tr;

  const { from, to } = selection;

  doc.nodesBetween(from, to, (node: any, pos: number) => {
    if (options.types.includes(node.type.name)) {
      const clampedLevel = Math.max(0, Math.min(level, options.indentLevels));
      const nodeAttrs = { ...node.attrs, rightIndent: clampedLevel };
      tr = tr.setNodeMarkup(pos, node.type, nodeAttrs, node.marks);
      return false;
    }
    return true;
  });

  return tr;
}

function setNodeIndentMarkup(tr: any, pos: number, delta: number, options: any) {
  const node = tr.doc.nodeAt(pos);
  if (!node) return tr;

  const currentIndent = node.attrs.indent || 0;
  const nextIndent = currentIndent + delta;

  if (nextIndent < 0 || nextIndent > options.indentLevels) {
    return tr;
  }

  const nodeAttrs = { ...node.attrs, indent: nextIndent };
  return tr.setNodeMarkup(pos, node.type, nodeAttrs, node.marks);
}
