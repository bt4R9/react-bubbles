import raf from 'raf';

const EDITING_CLASS = 'is-editing';

export function moveCaretToTheEnd(node) {
    raf(() => {
        node.appendChild(getCaretHelper());

        const range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(false);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        node.focus();
    });
}

export function startBubbleEditing(node) {
    node.classList.add(EDITING_CLASS);
    node.setAttribute('contentEditable', 'true');

    const range = document.createRange();
    range.selectNode(node);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

export function endBubbleEditing(node) {
    node.setAttribute('contentEditable', 'false');
    node.classList.remove(EDITING_CLASS);
}

export function isBubbleEditing(node) {
    return node.classList.contains(EDITING_CLASS);
}

function getCaretHelper() {
    // Zero width space.
    // It forces the caret to appear in the empty input.
    return document.createTextNode('\u200B');
}
