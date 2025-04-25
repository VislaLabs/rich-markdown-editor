import { useLayoutEffect, useState } from "react";
export default function useViewportHeight() {
    const [height, setHeight] = useState(() => { var _a; return ((_a = window.visualViewport) === null || _a === void 0 ? void 0 : _a.height) || window.innerHeight; });
    useLayoutEffect(() => {
        var _a;
        const handleResize = () => {
            setHeight(() => { var _a; return ((_a = window.visualViewport) === null || _a === void 0 ? void 0 : _a.height) || window.innerHeight; });
        };
        (_a = window.visualViewport) === null || _a === void 0 ? void 0 : _a.addEventListener("resize", handleResize);
        return () => {
            var _a;
            (_a = window.visualViewport) === null || _a === void 0 ? void 0 : _a.removeEventListener("resize", handleResize);
        };
    }, []);
    return height;
}
//# sourceMappingURL=useViewportHeight.js.map