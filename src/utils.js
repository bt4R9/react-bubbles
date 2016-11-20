export function getNodeIndexOf(parent, child) {
    return Array.prototype.indexOf.call(parent.childNodes, child);
}

export function isUniqueBubble(list, content) {
    return list.findIndex((item) => item.get('content') === content) === -1;
}

export function prepareContent(content) {
    return content.trim().replace(/\u200B/g, '');
}
