const isMarkActive = type => (state) => {
    if (!type) {
        return false;
    }
    const { from, $from, to, empty } = state.selection;
    return empty
        ? type.isInSet(state.storedMarks || $from.marks())
        : state.doc.rangeHasMark(from, to, type);
};
export default isMarkActive;
//# sourceMappingURL=isMarkActive.js.map