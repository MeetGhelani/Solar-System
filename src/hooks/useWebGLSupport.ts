"use client";

import { useEffect, useState } from "react";

export function useWebGLSupport(): { isSupported: boolean; checked: boolean } {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setIsSupported(Boolean(gl));
    } catch {
      setIsSupported(false);
    } finally {
      setChecked(true);
    }
  }, []);

  return { isSupported, checked };
}
