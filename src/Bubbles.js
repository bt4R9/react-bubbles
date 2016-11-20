import React, { Component } from 'react';
import { List, fromJS } from 'immutable';
import { moveCaretToTheEnd, startBubbleEditing, endBubbleEditing, isBubbleEditing } from './selection';
import { isUniqueBubble, getNodeIndexOf, prepareContent } from './utils';
import BubbleRecord from './bubbleRecord';
import KEYCODES from './keyCodes';

/**
 * @class Bubbles
 * @augments Component
 */
export default class Bubbles extends Component {
    constructor(props) {
        super(props);

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onEnter = this.onEnter.bind(this);
        this.onBackSpace = this.onBackSpace.bind(this);
        this.onClick = this.onClick.bind(this);
        this.attachEvents = this.attachEvents.bind(this);
        this.deattachEvents = this.deattachEvents.bind(this);
        this.onPaste = this.onPaste.bind(this);

        this.state = { bubbles: List() };
    }

    /**
     * Append bubble by the index.
     * @param {string} content
     * @param {number} [index]
     */
    appendBubble(content, index) {
        content = prepareContent(content);

        if (!isUniqueBubble(this.state.bubbles, content)) {
            moveCaretToTheEnd(this.editor);
        } else if (index !== undefined) {
            this.setState({ bubbles: this.state.bubbles.set(index, new BubbleRecord({ content })) });
        } else {
            this.setState({ bubbles: this.state.bubbles.push(new BubbleRecord({ content })) });
        }

        this.props.onChange && this.props.onChange(this.state.bubbles.toList());
    }

    /**
     * Remove bubble by index.
     * @param {number} [index]
     */
    removeBubble(index) {
        if (index !== undefined) {
            this.setState({ bubbles: this.state.bubbles.delete(index) });
        } else {
            this.setState({ bubbles: this.state.bubbles.pop() });
        }

        this.props.onChange && this.props.onChange(this.state.bubbles.toList());
    }

    /**
     * KeyDown handler.
     * @param {Event} e
     */
    onKeyDown(e) {
        switch (e.keyCode) {
            case KEYCODES.ENTER:
            case KEYCODES.SPACE:
                this.onEnter(e);
                break;

            case KEYCODES.BACKSPACE:
                this.onBackSpace(e);
                break;
        }
    }

    onEnter(e) {
        this.finishEditingBubbles();
        this.convertTextNodesToBubbles();
        moveCaretToTheEnd(this.editor);

        e.preventDefault();
    }

    onBackSpace(e) {
        const selection = window.getSelection();
        const focusNode = selection.focusNode;
        const prevNode = focusNode.previousSibling;
        const node = focusNode.parentNode;
        const code = focusNode.textContent.charCodeAt(0);

        if (isBubbleEditing(node)) {
            if (selection.toString() === focusNode.textContent) {
                const nodeIndex = getNodeIndexOf(this.editor, node);
                this.removeBubble(nodeIndex);
                moveCaretToTheEnd(this.editor);

                e.preventDefault();
            }
        }

        if (code === KEYCODES.ZEROWIDTHSPACE && focusNode.textContent.length === 1) {
            if (prevNode && prevNode.nodeType === Node.ELEMENT_NODE) {
                this.removeBubble();

                e.preventDefault();
            }
        }
    }

    onClick(e) {
        const node = e.target;

        if (node !== this.editor && !isBubbleEditing(node)) {
            startBubbleEditing(node);
        }

        if (node === this.editor) {
            moveCaretToTheEnd(this.editor);
        }
    }

    onBlur() {
        this.finishEditingBubbles();
        this.convertTextNodesToBubbles();
    }

    onPaste(e) {
        e.preventDefault();

        if (e.clipboardData && e.clipboardData.types && e.clipboardData.getData) {
            const data = e.clipboardData.getData('text/plain');
            const content = prepareContent(data);

            if (isUniqueBubble(this.state.bubbles, content)) {
                const record = new BubbleRecord({content});

                this.setState({
                    bubbles: this.state.bubbles.push(record)
                }, () => this.props.onChange(this.state.bubbles.toList()));
            }
        }
    }

    /**
     * Converts edited bubbles to bubbles.
     */
    finishEditingBubbles() {
        const editingNodes = [];

        this.editor.childNodes.forEach((node) => {
             if (node.nodeType === Node.ELEMENT_NODE && isBubbleEditing(node)) {
                 editingNodes.push(node);
             }
        });

        editingNodes.forEach((node) => {
            const content = prepareContent(node.textContent);
            const nodeIndex = getNodeIndexOf(this.editor, node);
            const listIndex = this.state.bubbles.findIndex((item) => item.get('content') === content);

            if (listIndex !== -1 && nodeIndex !== listIndex) {
                this.removeBubble(nodeIndex);
            } else {
                this.appendBubble(content, nodeIndex);
            }

            endBubbleEditing(node);
        });
    }

    /**
     * Converts text in the editor to bubbles.
     */
    convertTextNodesToBubbles() {
        const textNodes = [];

        this.editor.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push(node);
            }
        });

        textNodes.forEach((node) => {
            const content = prepareContent(node.textContent);

            if (content.length > 0) {
                this.appendBubble(content);
            }

            node.remove();
        });
    }

    attachEvents() {
        this.editor.addEventListener('keydown', this.onKeyDown, false);
        this.editor.addEventListener('click', this.onClick, false);
        this.editor.addEventListener('paste', this.onPaste, false);
    }

    deattachEvents() {
        this.editor.removeEventListener('keydown', this.onKeyDown, false);
        this.editor.removeEventListener('click', this.onClick, false);
        this.editor.removeEventListener('paste', this.onPaste, false);
    }

    componentDidMount() {
        this.attachEvents();

        const bubbles = this.props.bubbles;

        if (bubbles && bubbles.length > 0) {
            const bubbleRecords = fromJS(bubbles).map(bubble => new BubbleRecord({ content: prepareContent(bubble) }));
            this.setState({ bubbles: this.state.bubbles.merge(bubbleRecords) }, () => moveCaretToTheEnd(this.editor));
        }
    }

    componentWillUnmount() {
        this.deattachEvents();
    }

    render() {
        const bubbleComponent = this.props.bubbleComponent;
        const bubbles = this.state.bubbles.map((bubble) => {
            const content = bubble.get('content');

            return React.createElement(bubbleComponent, {
                key: content,
                content
            });
        });

        return (
            <div
                spellCheck="false"
                suppressContentEditableWarning="true"
                contentEditable
                onBlur={ () => this.onBlur() }
                ref={ (node) => this.editor = node }
                className={ this.props.class }
            >
                { bubbles }
            </div>
        )
    }
}
